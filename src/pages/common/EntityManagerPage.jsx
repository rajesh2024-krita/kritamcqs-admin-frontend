import { useEffect, useMemo, useState } from "react";
import { ConfirmDeleteModal } from "../../components/common/ConfirmDeleteModal";
import { EmptyState } from "../../components/common/EmptyState";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EntityFormWrapper } from "../../components/forms/EntityFormWrapper";
import { Field } from "../../components/forms/Field";
import { SelectDropdown } from "../../components/forms/SelectDropdown";
import { TagInput } from "../../components/forms/TagInput";
import { ToggleSwitch } from "../../components/forms/ToggleSwitch";
import { DataTable } from "../../components/tables/DataTable";
import { Pagination } from "../../components/tables/Pagination";
import { SearchBar } from "../../components/tables/SearchBar";
import { useToast } from "../../context/ToastContext";
import { EditIcon, PlusIcon, RefreshIcon, TrashIcon } from "../../components/common/AdminIcons";
import { useAuth } from "../../context/AuthContext";
import { getModulePermission, isEmployee } from "../../config/adminPermissions";
import { cn, ui } from "../../ui";

const ENTITY_TITLE_MODULES = {
  Modes: "modes",
  "Learning Levels": "learning-levels",
  Difficulties: "difficulties",
  "Exam Types": "exam-types",
  Subjects: "subjects",
  Chapters: "chapters",
  Topics: "topics",
  Years: "years",
  "Question Types": "question-types",
  "List Styles": "list-styles",
  Questions: "questions",
  Users: "users",
  Coupons: "coupons",
  "Subscription Plans": "subscription-plans",
  "iOS Subscription Plans": "subscription-plans",
  "Android Subscription Plans": "subscription-plans",
  "Subscription Free Cards": "subscription-free-cards",
  "Subscription Stat Cards": "subscription-stat-cards",
  "Policy Pages": "policy-pages",
  "CMS Pages": "cms-pages",
  "CMS Menu Items": "cms-menu-items",
  "Website Settings": "website-settings",
  "Email Templates": "email-templates",
};

function normalizeInitialValues(fields) {
  return fields.reduce((acc, field) => {
    if (field.defaultValue !== undefined) acc[field.name] = field.defaultValue;
    else if (field.type === "checkbox" || field.type === "switch") acc[field.name] = false;
    else if (field.type === "tags") acc[field.name] = [];
    else acc[field.name] = "";
    return acc;
  }, {});
}

export function EntityManagerPage({
  title,
  description,
  service,
  fields,
  columns,
  defaultQuery = {},
  lookupLoaders = [],
  mapItemToForm,
  headerActions = null,
  filters = [],
  sortable = false,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  canBulkDelete = true,
  renderFormPreview = null,
  filterStorageKey = "",
  refreshSignal = 0,
  searchPlaceholder = "",
  closeEditFormOnSave = true,
}) {
  const toast = useToast();
  const { admin } = useAuth();
  const inferredModuleKey = ENTITY_TITLE_MODULES[title];
  const inferredPermissions = inferredModuleKey ? getModulePermission(admin, inferredModuleKey) : null;
  const effectiveCanCreate = canCreate && (!isEmployee(admin) || !inferredPermissions || inferredPermissions.create === true);
  const effectiveCanEdit = canEdit && (!isEmployee(admin) || !inferredPermissions || inferredPermissions.edit === true);
  const effectiveCanDelete = canDelete && (!isEmployee(admin) || !inferredPermissions || inferredPermissions.delete === true);
  const effectiveCanBulkDelete = canBulkDelete && effectiveCanDelete;
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState({ page: 1, limit: 10, ...defaultQuery });
  const getDefaultFilterValues = () => filters.reduce((acc, filter) => ({ ...acc, [filter.name]: filter.defaultValue || "" }), {});
  const [filterValues, setFilterValues] = useState(() => {
    const defaults = getDefaultFilterValues();
    if (!filterStorageKey || typeof window === "undefined") return defaults;
    try {
      return { ...defaults, ...JSON.parse(window.localStorage.getItem(filterStorageKey) || "{}") };
    } catch {
      return defaults;
    }
  });
  const [formState, setFormState] = useState(normalizeInitialValues(fields));
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [lookups, setLookups] = useState({});
  const [errors, setErrors] = useState({});
  const [uploadingFields, setUploadingFields] = useState({});
  const [owningFields, setOwningFields] = useState({});
  const [selectedFiles, setSelectedFiles] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [previewItems, setPreviewItems] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [draggedId, setDraggedId] = useState(null);

  function getActiveFilters() {
    return Object.fromEntries(
      Object.entries(filterValues).filter(([, value]) => value !== "" && value !== undefined && value !== null),
    );
  }

  const visibleFields = useMemo(
    () => fields.filter((field) => (field.visible ? field.visible(formState, lookups) : true)),
    [fields, formState, lookups],
  );

  // Group fields into sections for better organization
  const groupedFields = useMemo(() => {
    const groups = {};
    const ungrouped = [];
    
    visibleFields.forEach(field => {
      if (field.section) {
        if (!groups[field.section]) groups[field.section] = [];
        groups[field.section].push(field);
      } else {
        ungrouped.push(field);
      }
    });
    
    return { groups, ungrouped };
  }, [visibleFields]);

  async function loadItems(nextQuery = query) {
    setLoading(true);
    try {
      const activeFilters = getActiveFilters();
      const response = await service.list({ ...nextQuery, ...activeFilters, search });
      setItems(response.data || []);
      setMeta(response.meta);
      setSelectedIds([]);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadPreviewItems(seedItems = items) {
    if (!renderFormPreview) return;
    setPreviewItems(seedItems);
    setPreviewLoading(true);
    try {
      const activeFilters = getActiveFilters();
      const pageSize = 500;
      const firstResponse = await service.list({ ...query, page: 1, limit: pageSize, ...activeFilters, search });
      const rows = firstResponse?.data || [];
      const totalPages = Number(firstResponse?.meta?.totalPages || 1);
      const allRows = [...rows];

      for (let page = 2; page <= totalPages; page += 1) {
        const response = await service.list({ ...query, page, limit: pageSize, ...activeFilters, search });
        allRows.push(...(response?.data || []));
      }

      setPreviewItems(allRows.length ? allRows : seedItems);
    } catch {
      setPreviewItems(seedItems);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function loadLookups() {
    try {
      const entries = await Promise.all(
        lookupLoaders.map(async (loader) => [loader.key, await loader.load()]),
      );

      setLookups(Object.fromEntries(entries.map(([key, response]) => [key, response.data || []])));
    } catch (error) {
      toast.error(error.message);
    }
  }

  useEffect(() => {
    loadItems(query);
  }, [query.page, filterValues]);

  useEffect(() => {
    if (refreshSignal) loadItems(query);
  }, [refreshSignal]);

  useEffect(() => {
    if (!filterStorageKey || typeof window === "undefined") return;
    window.localStorage.setItem(filterStorageKey, JSON.stringify(filterValues));
  }, [filterStorageKey, filterValues]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setQuery((current) => {
        if (current.page !== 1) return { ...current, page: 1 };
        loadItems({ ...current, page: 1 });
        return current;
      });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    const invalidSelectFields = fields.filter((field) => {
      if (field.type !== "select") return false;
      if (field.visible && !field.visible(formState, lookups)) return false;
      const currentValue = formState[field.name];
      if (!currentValue) return false;
      return !getOptions(field).some((option) => option.value === currentValue);
    });

    if (!invalidSelectFields.length) return;

    setFormState((current) => {
      const nextState = { ...current };
      let changed = false;

      invalidSelectFields.forEach((field) => {
        if (nextState[field.name]) {
          nextState[field.name] = "";
          changed = true;
        }
      });

      return changed ? nextState : current;
    });
  }, [fields, formState, lookups]);

  function openCreate() {
    setErrors({});
    setEditingItem(null);
    setFormState(normalizeInitialValues(fields));
    setSelectedFiles({});
    setUploadingFields({});
    setOwningFields({});
    setShowForm(true);
  }

  function buildFormStateFromItem(item) {
    const nextFormState = fields.reduce((acc, field) => {
      const rawValue = item[field.name];
      if (field.type === "select" && rawValue && typeof rawValue === "object") {
        acc[field.name] = rawValue.id || "";
      } else if (field.type === "datetime-local" && rawValue) {
        acc[field.name] = new Date(rawValue).toISOString().slice(0, 16);
      } else {
        acc[field.name] = rawValue ?? ((field.type === "checkbox" || field.type === "switch") ? false : field.type === "tags" ? [] : "");
      }
      return acc;
    }, {});
    return mapItemToForm ? mapItemToForm(item, nextFormState) : nextFormState;
  }

  function openEdit(item) {
    setErrors({});
    setEditingItem(item);
    setFormState(buildFormStateFromItem(item));
    setSelectedFiles({});
    setUploadingFields({});
    setOwningFields({});
    setShowForm(true);
    void loadPreviewItems();
  }

  function openPreviewItem(item) {
    setErrors({});
    setEditingItem(item);
    setFormState(buildFormStateFromItem(item));
    setSelectedFiles({});
    setUploadingFields({});
    setOwningFields({});
    setShowForm(true);
  }

  async function handleFieldUpload(field) {
    if (!field.upload) return;
    const file = selectedFiles[field.name];
    if (!file) {
      toast.error(`Choose a file for ${field.label}`);
      return;
    }

    setUploadingFields((current) => ({ ...current, [field.name]: true }));
    try {
      const response = await field.upload(file);
      const uploadedUrl = response?.data?.url || response?.url || response?.data?.path || response?.path || "";
      if (!uploadedUrl) throw new Error("Upload did not return an image URL");
      setFormState((current) => ({ ...current, [field.name]: uploadedUrl }));
      setSelectedFiles((current) => ({ ...current, [field.name]: undefined }));
      toast.success(`${field.label} uploaded`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploadingFields((current) => ({ ...current, [field.name]: false }));
    }
  }

  function validateForm() {
    const nextErrors = {};
    for (const field of visibleFields) {
      if (field.required && !formState[field.name] && formState[field.name] !== false) {
        nextErrors[field.name] = `${field.label} is required`;
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function buildPayload() {
    const payload = {};
    fields.forEach((field) => {
      const rawValue = formState[field.name];
      if (field.name === "levels" && typeof rawValue === "string") {
        try {
          payload[field.name] = rawValue.trim() ? JSON.parse(rawValue) : [];
        } catch {
          payload[field.name] = rawValue;
        }
        return;
      }
      if (typeof rawValue === "string") {
        const trimmed = field.preserveWhitespace ? rawValue : rawValue.trim();
        payload[field.name] = field.type === "datetime-local" && trimmed ? new Date(trimmed).toISOString() : trimmed;
      } else {
        payload[field.name] = rawValue;
      }
    });
    return payload;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = buildPayload();
      if (editingItem) {
        const response = await service.update(editingItem.id, payload);
        const updatedItem = response?.data || response;
        if (updatedItem?.id || updatedItem?._id) {
          setEditingItem(updatedItem);
          setFormState(buildFormStateFromItem(updatedItem));
        }
        toast.success(`${title} updated`);
        if (closeEditFormOnSave) setShowForm(false);
      } else {
        await service.create(payload);
        toast.success(`${title} created`);
        setShowForm(false);
      }

      loadItems({ ...query, page: 1 });
      loadLookups();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleDelete() {
    try {
      await service.remove(deleteItem.id);
      toast.success(`${title} deleted`);
      setDeleteItem(null);
      loadItems({ ...query, page: 1 });
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleBulkDelete() {
    if (!selectedIds.length) {
      setBulkDeleteOpen(false);
      return;
    }

    try {
      const response = service.removeMany
        ? await service.removeMany(selectedIds)
        : { data: { deletedCount: 0, failedCount: 0 } };
      const result = response.data || response;
      const successCount = Number(result.deletedCount || 0);
      const failedCount = Number(result.failedCount || 0);

      if (successCount > 0) {
        toast.success(`${successCount} ${title} deleted`);
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} ${title} failed to delete`);
      }

      setBulkDeleteOpen(false);
      setSelectedIds([]);
      loadItems({ ...query, page: 1 });
    } catch (error) {
      toast.error(error.message);
    }
  }

  function toggleRowSelection(id, checked) {
    setSelectedIds((current) => {
      const has = current.includes(id);
      if (checked && !has) return [...current, id];
      if (!checked && has) return current.filter((item) => item !== id);
      return current;
    });
  }

  function toggleAllSelection(checked) {
    if (!checked) {
      const visibleIds = new Set(items.map((item) => String(item.id)));
      setSelectedIds((current) => current.filter((id) => !visibleIds.has(id)));
      return;
    }
    setSelectedIds((current) => [...new Set([...current, ...items.map((item) => String(item.id))])]);
  }

  async function persistOrder(nextItems) {
    if (!service?.reorder) return;
    setItems(nextItems);
    try {
      await service.reorder(nextItems.map((item, index) => ({ id: item.id, sortOrder: (index + 1) * 10 })));
      toast.success(`${title} order updated`);
      loadItems({ ...query, sortBy: "sortOrder", sortOrder: "asc" });
    } catch (error) {
      toast.error(error.message);
      loadItems(query);
    }
  }

  function handleDropOnRow(targetId) {
    if (!sortable || !draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }
    const fromIndex = items.findIndex((item) => String(item.id) === String(draggedId));
    const toIndex = items.findIndex((item) => String(item.id) === String(targetId));
    if (fromIndex < 0 || toIndex < 0) {
      setDraggedId(null);
      return;
    }
    const nextItems = [...items];
    const [moved] = nextItems.splice(fromIndex, 1);
    nextItems.splice(toIndex, 0, moved);
    setDraggedId(null);
    void persistOrder(nextItems);
  }

  function handleLimitChange(event) {
    const limit = Number(event.target.value);
    setSelectedIds([]);
    setQuery((current) => ({ ...current, limit, page: 1 }));
    loadItems({ ...query, limit, page: 1 });
  }

  function resetFilters() {
    const defaults = getDefaultFilterValues();
    setFilterValues(defaults);
    setSelectedIds([]);
    setQuery((current) => ({ ...current, page: 1 }));
    if (filterStorageKey && typeof window !== "undefined") {
      window.localStorage.setItem(filterStorageKey, JSON.stringify(defaults));
    }
  }

  async function handleExport(scope, format) {
    if (!service?.exportRecords) return;
    try {
      const params = scope === "all" ? { scope, format } : { ...getActiveFilters(), search, scope, format };
      const response = await service.exportRecords(params);
      const blob = response.data;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title.toLowerCase().replace(/\s+/g, "-")}-${scope}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`${title} export started`);
    } catch (error) {
      toast.error(error.message);
    }
  }

  function getOptions(field) {
    if (typeof field.options === "function") {
      return field.options(formState, lookups);
    }
    return field.options || [];
  }

  function resolveImageSource(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
    if (!raw.startsWith("/")) return raw;
    if (raw.startsWith("/uploads/")) {
      const appBase = String(import.meta.env.VITE_APP_FRONTEND_BASE_URL || "").replace(/\/+$/, "");
      if (appBase) {
        return `${appBase}${raw}`;
      }
    }
    const base = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "").replace(/\/api$/, "");
    return base ? `${base}${raw}` : raw;
  }

  function shouldOwnImageUrl(rawValue) {
    const value = String(rawValue || "").trim();
    if (!value || value.startsWith("/uploads/") || value.startsWith("data:")) return false;

    let parsedUrl;
    try {
      parsedUrl = new URL(value);
    } catch {
      return false;
    }

    if (!/^https?:$/i.test(parsedUrl.protocol)) return false;

    const ownedHosts = new Set(
      [
        String(import.meta.env.VITE_API_BASE_URL || ""),
        String(import.meta.env.VITE_APP_FRONTEND_BASE_URL || ""),
        window.location.origin,
      ]
        .filter(Boolean)
        .map((entry) => {
          try {
            return new URL(entry).host;
          } catch {
            return "";
          }
        })
        .filter(Boolean),
    );

    return !ownedHosts.has(parsedUrl.host);
  }

  async function handleOwnImageUrl(field, explicitValue) {
    if (!field.ownUrl) return;
    const currentValue = String(explicitValue ?? formState[field.name] ?? "").trim();
    if (!shouldOwnImageUrl(currentValue)) return;

    setOwningFields((current) => ({ ...current, [field.name]: true }));
    try {
      const response = await field.ownUrl(currentValue);
      const ownedUrl = response?.data?.url || response?.url || response?.data?.path || response?.path || "";
      if (!ownedUrl) throw new Error("Unable to own this image URL");
      setFormState((current) => ({ ...current, [field.name]: ownedUrl }));
      toast.success(`${field.label} moved to owned storage`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setOwningFields((current) => ({ ...current, [field.name]: false }));
    }
  }

  // Custom compact input styles - using standard text sizes
  const compactInput = "w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-xs placeholder:text-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed";
  const compactTextarea = "w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-xs placeholder:text-slate-400 resize-y min-h-[60px] disabled:bg-slate-100 disabled:cursor-not-allowed";

  function renderInput(field) {
    const value = formState[field.name];
    if (field.type === "select") {
      return (
        <SelectDropdown
          value={value}
          onChange={(nextValue) => setFormState((current) => (
            field.onChange ? field.onChange(nextValue, current, lookups) : { ...current, [field.name]: nextValue }
          ))}
          options={getOptions(field)}
          placeholder={field.placeholder}
          disabled={field.disabled}
        />
      );
    }
    if (field.type === "textarea") {
      return <textarea className={compactTextarea} value={value} onChange={(event) => setFormState((current) => ({ ...current, [field.name]: event.target.value }))} />;
    }
    if (field.type === "switch") {
      return (
        <ToggleSwitch
          checked={Boolean(value)}
          onChange={(nextValue) => setFormState((current) => ({ ...current, [field.name]: nextValue }))}
          label={field.toggleLabel || field.label}
        />
      );
    }
    if (field.type === "checkbox") {
      return (
        <div className="pt-1">
          <ToggleSwitch
            checked={Boolean(value)}
            onChange={(nextValue) => setFormState((current) => ({ ...current, [field.name]: nextValue }))}
            label={field.toggleLabel || field.label}
          />
        </div>
      );
    }
    if (field.type === "tags") {
      return <TagInput value={value} onChange={(nextValue) => setFormState((current) => ({ ...current, [field.name]: nextValue }))} />;
    }
    if (field.type === "image-upload") {
      return (
        <div className="space-y-1.5">
          <input
            className={compactInput}
            type="text"
            value={value ?? ""}
            placeholder={field.placeholder || "Paste image URL"}
            onChange={(event) => setFormState((current) => ({ ...current, [field.name]: event.target.value }))}
            onBlur={(event) => void handleOwnImageUrl(field, event.target.value)}
            onPaste={(event) => {
              if (!field.ownUrl) return;
              const pasted = String(event.clipboardData?.getData("text") || "").trim();
              if (!pasted) return;
              window.setTimeout(() => {
                void handleOwnImageUrl(field, pasted);
              }, 0);
            }}
          />
          {owningFields[field.name] ? <div className="text-xs text-slate-500">Owning external image URL...</div> : null}
          <div className="flex flex-wrap items-center gap-1.5">
            <input
              className="flex-1 min-w-[120px] px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              type="file"
              accept={field.accept || "image/*"}
              onChange={(event) =>
                setSelectedFiles((current) => ({
                  ...current,
                  [field.name]: event.target.files?.[0] || undefined,
                }))
              }
            />
            <button
              type="button"
              className="inline-flex items-center px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedFiles[field.name] || uploadingFields[field.name]}
              onClick={() => void handleFieldUpload(field)}
            >
              {uploadingFields[field.name] ? "Uploading..." : "Upload"}
            </button>
          </div>
          {value ? (
            <img
              src={resolveImageSource(value)}
              alt={`${field.label} preview`}
              className="max-h-20 rounded border border-slate-200 object-contain"
            />
          ) : null}
        </div>
      );
    }
    return (
      <input
        className={compactInput}
        type={field.type || "text"}
        disabled={field.disabled}
        value={value ?? ""}
        placeholder={field.placeholder}
        onChange={(event) => setFormState((current) => ({ ...current, [field.name]: event.target.value }))}
      />
    );
  }

  // Helper to render form fields with responsive grid
  function renderFormFields() {
    const { groups, ungrouped } = groupedFields;
    const groupKeys = Object.keys(groups);

    if (groupKeys.length > 0) {
      return (
        <div className="space-y-4">
          {groupKeys.map((sectionName) => (
            <div key={sectionName} className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-100 pb-1">
                {sectionName}
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {groups[sectionName].map((field) => (
                  <Field 
                    key={field.name} 
                    label={field.label} 
                    error={errors[field.name]} 
                    className={field.full ? "sm:col-span-2" : ""}
                  >
                    {renderInput(field)}
                  </Field>
                ))}
              </div>
            </div>
          ))}
          
          {ungrouped.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-100 pb-1">
                Additional Info
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ungrouped.map((field) => (
                  <Field 
                    key={field.name} 
                    label={field.label} 
                    error={errors[field.name]} 
                    className={field.full ? "sm:col-span-2" : ""}
                  >
                    {renderInput(field)}
                  </Field>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visibleFields.map((field) => (
          <Field 
            key={field.name} 
            label={field.label} 
            error={errors[field.name]} 
            className={field.full ? "sm:col-span-2" : ""}
          >
            {renderInput(field)}
          </Field>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Header - Ultra Compact */}
      <div className="bg-white rounded-lg border border-slate-200/60 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25">
              <span className="text-white text-xs font-bold">{title.slice(0, 2).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">{title}</h1>
              <p className="text-xs text-slate-500">{description}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-sm font-medium text-indigo-700">
              {meta?.total ?? items.length}
            </span>
            {headerActions}
            {effectiveCanCreate && (
              <button 
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-medium rounded-lg transition-all shadow-sm shadow-indigo-500/25"
                onClick={openCreate}
              >
                <PlusIcon size={12} />
                New
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters - Ultra Compact */}
      <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
        {/* Search Bar - Always on top */}
        <div className="px-3 pt-2 pb-1.5 border-b border-slate-100">
          <SearchBar 
            value={search} 
            onChange={setSearch} 
            placeholder={searchPlaceholder || `Search ${title.toLowerCase()}...`} 
          />
        </div>

        {/* Filters and Actions */}
        <div className="px-3 py-2">
          <div className="flex flex-col gap-2">
            {/* Filters Row */}
            {filters.length > 0 && (
              <div className="flex items-start gap-1.5">
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wider mt-0.5 flex-shrink-0">
                  Filters:
                </span>
                <div className="flex-1 min-w-0 overflow-x-auto pb-1">
                  <div className="flex flex-wrap items-center gap-1">
                    {filters.map((filter) => (
                      <div 
                        key={filter.name} 
                        className="flex items-center gap-0.5 bg-slate-50 rounded px-1.5 py-0.5 border border-slate-200/50 whitespace-nowrap"
                      >
                        <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                          {filter.label}:
                        </span>
                        {filter.type === "text" || filter.type === "date" ? (
                          <input
                            className="px-1 py-0.5 text-xs bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 rounded min-w-[60px] max-w-[120px]"
                            type={filter.type}
                            value={filterValues[filter.name] || ""}
                            placeholder={filter.placeholder}
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              setFilterValues((current) => ({ ...current, [filter.name]: nextValue }));
                              setSelectedIds([]);
                              setQuery((current) => ({ ...current, page: 1 }));
                            }}
                          />
                        ) : (
                          <select
                            className="px-1 py-0.5 text-xs bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 rounded cursor-pointer max-w-[140px]"
                            value={filterValues[filter.name] || ""}
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              setFilterValues((current) => ({ ...current, [filter.name]: nextValue }));
                              setSelectedIds([]);
                              setQuery((current) => ({ ...current, page: 1 }));
                            }}
                          >
                            <option value="">{filter.placeholder || "All"}</option>
                            {(typeof filter.options === "function" ? filter.options(lookups, filterValues) : filter.options || []).map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actions Row */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 border-t border-slate-100/50">
              {/* Left side: Clear and Export */}
              <div className="flex items-center gap-1">
                {filters.length > 0 && (
                  <button 
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-sm text-slate-400 hover:text-slate-600 transition-colors hover:bg-slate-50 rounded"
                    type="button" 
                    onClick={resetFilters}
                  >
                    <span className="text-xs">✕</span>
                    Clear all
                  </button>
                )}

                {service?.exportRecords && (
                  <div className="flex items-center gap-0.5 ml-1">
                    <span className="text-sm text-slate-400">Export:</span>
                    <button 
                      className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-medium rounded transition-colors border border-slate-200/50"
                      type="button" 
                      onClick={() => handleExport("filtered", "csv")}
                    >
                      CSV
                    </button>
                    <button 
                      className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-medium rounded transition-colors border border-slate-200/50"
                      type="button" 
                      onClick={() => handleExport("filtered", "xlsx")}
                    >
                      XLSX
                    </button>
                  </div>
                )}
              </div>

              {/* Right side: Bulk actions, limit, refresh, count */}
              <div className="flex flex-wrap items-center gap-1 ml-auto">
                {effectiveCanDelete && effectiveCanBulkDelete && selectedIds.length > 0 && (
                  <button 
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-medium rounded transition-colors"
                    onClick={() => setBulkDeleteOpen(true)}
                  >
                    <TrashIcon size={10} />
                    Delete {selectedIds.length}
                  </button>
                )}

                <div className="flex items-center gap-0.5">
                  <span className="text-sm text-slate-400">Show:</span>
                  <select 
                    className="px-1.5 py-0.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-all cursor-pointer"
                    value={query.limit} 
                    onChange={handleLimitChange}
                  >
                    {[10, 25, 50, 100, 200, 500].map((limit) => (
                      <option key={limit} value={limit}>{limit}</option>
                    ))}
                  </select>
                </div>

                <button 
                  className="inline-flex items-center gap-2 px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-medium rounded transition-colors"
                  onClick={() => loadItems({ ...query, page: 1 })}
                >
                  <RefreshIcon size={14} />
                  Refresh
                </button>

                <span className="text-sm text-slate-400 ml-1">
                  {meta?.total ?? items.length} {meta?.total === 1 ? 'record' : 'records'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table - Ultra Compact */}
      {loading ? <LoadingSpinner /> : null}
      {!loading && items.length === 0 ? <EmptyState title={`No ${title.toLowerCase()} found`} description="Adjust the search or add a new record." /> : null}
      {!loading && items.length > 0 ? (
        <>
          {sortable ? (
            <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-2.5 py-1.5 text-left">
                        <span className="text-sm font-bold uppercase tracking-wider text-slate-400">Sort</span>
                      </th>
                      {columns.map((column) => (
                        <th key={column.key} className="px-2.5 py-1.5 text-left">
                          <span className="text-sm font-bold uppercase tracking-wider text-slate-400">{column.label}</span>
                        </th>
                      ))}
                      {(effectiveCanEdit || effectiveCanDelete) && (
                        <th className="px-2.5 py-1.5 text-right">
                          <span className="text-sm font-bold uppercase tracking-wider text-slate-400">Actions</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((row) => (
                      <tr
                        key={row.id}
                        draggable
                        onDragStart={() => setDraggedId(String(row.id))}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => handleDropOnRow(String(row.id))}
                        className={cn(
                          "bg-white hover:bg-slate-50/50 transition-colors cursor-move",
                          draggedId === String(row.id) && "opacity-50"
                        )}
                      >
                        <td className="px-2.5 py-1.5">
                          <span className="text-xs text-slate-400">↕</span>
                        </td>
                        {columns.map((column) => (
                          <td key={column.key} className="px-2.5 py-1.5 text-xs text-slate-700">
                            {column.render ? column.render(row) : row[column.key]}
                          </td>
                        ))}
                        {(effectiveCanEdit || effectiveCanDelete) && (
                          <td className="px-2.5 py-1.5 text-right">
                            <div className="flex items-center justify-end gap-0.5">
                              {effectiveCanEdit && (
                                <button 
                                  className="p-0.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                  onClick={() => openEdit(row)}
                                >
                                  <EditIcon size={14}  />
                                </button>
                              )}
                              {effectiveCanDelete && (
                                <button 
                                  className="p-0.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                  onClick={() => setDeleteItem(row)}
                                >
                                  <TrashIcon size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={items}
              selectable={Boolean(service?.removeMany) && effectiveCanDelete && effectiveCanBulkDelete}
              selectedRowIds={selectedIds}
              onToggleRow={toggleRowSelection}
              onToggleAllRows={toggleAllSelection}
              renderActions={(effectiveCanEdit || effectiveCanDelete) ? (row) => (
                <div className="flex items-center justify-end gap-2">
                  {effectiveCanEdit && (
                    <button 
                      className="p-0.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      onClick={() => openEdit(row)}
                    >
                      <EditIcon size={16} />
                    </button>
                  )}
                  {effectiveCanDelete && (
                    <button 
                      className="p-0.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      onClick={() => setDeleteItem(row)}
                    >
                      <TrashIcon size={16} />
                    </button>
                  )}
                </div>
              ) : null}
            />
          )}
          <Pagination meta={meta} onChange={(page) => setQuery((current) => ({ ...current, page }))} />
        </>
      ) : null}

      {/* Form Modal */}
      {showForm && (
        <EntityFormWrapper
          title={editingItem ? `Edit ${title}` : `Create ${title}`}
          subtitle="Fill the required fields and save changes."
          onCancel={() => setShowForm(false)}
          onSubmit={handleSubmit}
          submitLabel={editingItem ? "Save" : "Create"}
          modalClassName={renderFormPreview ? "overflow-hidden" : ""}
          formClassName={renderFormPreview ? "min-h-0" : ""}
        >
          {renderFormPreview ? (
            <div className="grid h-[calc(90vh-190px)] min-h-0 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-h-0 overflow-y-auto pr-1">
                {renderFormFields()}
              </div>
              <div className="min-h-0 overflow-y-auto pr-1">
                {renderFormPreview({
                  formState,
                  setFormState,
                  lookups,
                  editingItem,
                  navigation: {
                    items: previewItems,
                    loading: previewLoading,
                    currentIndex: previewItems.findIndex((item) => String(item.id) === String(editingItem?.id)),
                    openItem: openPreviewItem,
                  },
                })}
              </div>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              {renderFormFields()}
            </div>
          )}
        </EntityFormWrapper>
      )}

      {/* Delete Confirmation Modals */}
      <ConfirmDeleteModal
        open={Boolean(deleteItem)}
        title={`Delete ${title.slice(0, -1)}`}
        description="This action cannot be undone."
        onCancel={() => setDeleteItem(null)}
        onConfirm={handleDelete}
      />

      <ConfirmDeleteModal
        open={bulkDeleteOpen}
        title={`Delete Selected ${title}`}
        description={`Delete ${selectedIds.length} selected record(s). This action cannot be undone.`}
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}