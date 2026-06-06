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
        const trimmed = rawValue.trim();
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

  function renderInput(field) {
    const value = formState[field.name];
    if (field.type === "select") {
      return (
        <SelectDropdown
          value={value}
          onChange={(nextValue) => setFormState((current) => ({ ...current, [field.name]: nextValue }))}
          options={getOptions(field)}
          placeholder={field.placeholder}
        />
      );
    }
    if (field.type === "textarea") {
      return <textarea className={ui.textarea} value={value} onChange={(event) => setFormState((current) => ({ ...current, [field.name]: event.target.value }))} />;
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
        <div className="pt-2">
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
        <div className="space-y-2">
          <input
            className={ui.input}
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
          <div className="flex flex-wrap items-center gap-2">
            <input
              className={ui.input}
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
              className={cn(ui.buttonBase, ui.buttonSecondary)}
              disabled={!selectedFiles[field.name] || uploadingFields[field.name]}
              onClick={() => void handleFieldUpload(field)}
            >
              {uploadingFields[field.name] ? "Uploading..." : "Upload Image"}
            </button>
          </div>
          {value ? (
            <img
              src={resolveImageSource(value)}
              alt={`${field.label} preview`}
              className="max-h-28 rounded-sm border border-slate-200 object-contain"
            />
          ) : null}
        </div>
      );
    }
    return (
      <input
        className={ui.input}
        type={field.type || "text"}
        disabled={field.disabled}
        value={value ?? ""}
        placeholder={field.placeholder}
        onChange={(event) => setFormState((current) => ({ ...current, [field.name]: event.target.value }))}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-sm border border-white/60 bg-white/85 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.28em] text-blue-700">Entity Management</div>
            <p className="text-slate-500">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-sm bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-700">{meta?.total ?? items.length} records</div>
            {headerActions}
            {effectiveCanCreate ? <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={openCreate}>
              <PlusIcon size={16} />
              Create {title.slice(0, -1) || title}
            </button> : null}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-sm border border-white/60 bg-white/85 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 text-[11px] font-black uppercase tracking-[0.28em] text-blue-700">Workspace Filters</div>
          <SearchBar value={search} onChange={setSearch} placeholder={searchPlaceholder || `Search ${title.toLowerCase()}...`} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {filters.map((filter) => (
            <label key={filter.name} className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              {filter.label}
              {filter.type === "text" || filter.type === "date" ? (
                <input
                  className={ui.input}
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
                  className={ui.input}
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
            </label>
          ))}
          {effectiveCanDelete && effectiveCanBulkDelete && selectedIds.length > 0 ? (
            <button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => setBulkDeleteOpen(true)}>
              <TrashIcon size={16} />
              Delete Selected ({selectedIds.length})
            </button>
          ) : null}
          {service?.exportRecords ? (
            <>
              <button className={cn(ui.buttonBase, ui.buttonSecondary)} type="button" onClick={() => handleExport("filtered", "csv")}>
                Export Filtered CSV
              </button>
              <button className={cn(ui.buttonBase, ui.buttonSecondary)} type="button" onClick={() => handleExport("filtered", "xlsx")}>
                Export Filtered XLSX
              </button>
              <button className={cn(ui.buttonBase, ui.buttonSecondary)} type="button" onClick={() => handleExport("all", "csv")}>
                Export All CSV
              </button>
              <button className={cn(ui.buttonBase, ui.buttonSecondary)} type="button" onClick={() => handleExport("all", "xlsx")}>
                Export All XLSX
              </button>
            </>
          ) : null}
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Rows
            <select className={ui.input} value={query.limit} onChange={handleLimitChange}>
              {[10, 25, 50, 100, 200, 500].map((limit) => (
                <option key={limit} value={limit}>{limit}</option>
              ))}
            </select>
          </label>
          <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => loadItems({ ...query, page: 1 })}>
            <RefreshIcon size={16} />
            Refresh Results
          </button>
          {filters.length ? (
            <button className={cn(ui.buttonBase, ui.buttonGhost)} type="button" onClick={resetFilters}>
              Reset Filters
            </button>
          ) : null}
        </div>
      </div>

      {loading ? <LoadingSpinner /> : null}
      {!loading && items.length === 0 ? <EmptyState title={`No ${title.toLowerCase()} found`} description="Adjust the search or add a new record." /> : null}
      {!loading && items.length > 0 ? (
        <>
          {sortable ? (
            <div className="overflow-x-auto rounded-sm border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Sort</th>
                    {columns.map((column) => <th key={column.key} className="px-4 py-3">{column.label}</th>)}
                    {(effectiveCanEdit || effectiveCanDelete) ? <th className="px-4 py-3">Actions</th> : null}
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
                      className={cn("cursor-move bg-white", draggedId === String(row.id) && "opacity-50")}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">Drag</td>
                      {columns.map((column) => (
                        <td key={column.key} className="px-4 py-3 align-top text-slate-700">
                          {column.render ? column.render(row) : row[column.key]}
                        </td>
                      ))}
                      {(effectiveCanEdit || effectiveCanDelete) ? <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-3">
                          {effectiveCanEdit ? <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => openEdit(row)}>
                            <EditIcon size={16} />
                            Edit
                          </button> : null}
                          {effectiveCanDelete ? <button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => setDeleteItem(row)}>
                            <TrashIcon size={16} />
                            Delete
                          </button> : null}
                        </div>
                      </td> : null}
                    </tr>
                  ))}
                </tbody>
              </table>
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
                <div className="flex flex-wrap items-center gap-3">
                  {effectiveCanEdit ? <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => openEdit(row)}>
                    <EditIcon size={16} />
                    Edit
                  </button> : null}
                  {effectiveCanDelete ? <button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => setDeleteItem(row)}>
                    <TrashIcon size={16} />
                    Delete
                  </button> : null}
                </div>
              ) : null}
            />
          )}
          <Pagination meta={meta} onChange={(page) => setQuery((current) => ({ ...current, page }))} />
        </>
      ) : null}

      {showForm ? (
        <EntityFormWrapper
          title={editingItem ? `Edit ${title}` : `Create ${title}`}
          subtitle="Fill the required fields and save changes."
          onCancel={() => setShowForm(false)}
          onSubmit={handleSubmit}
          submitLabel={editingItem ? "Save Changes" : "Create"}
          modalClassName={renderFormPreview ? "overflow-hidden" : ""}
          formClassName={renderFormPreview ? "min-h-0" : ""}
        >
          {renderFormPreview ? (
            <div className="grid h-[calc(90vh-190px)] min-h-0 grid-cols-1 gap-6 overflow-hidden xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="grid min-h-0 grid-cols-1 content-start gap-4 overflow-y-auto pr-1 md:grid-cols-2">
                {visibleFields.map((field) => (
                  <Field key={field.name} label={field.label} error={errors[field.name]} className={field.full ? ui.fieldFull : ""}>
                    {renderInput(field)}
                  </Field>
                ))}
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {visibleFields.map((field) => (
                <Field key={field.name} label={field.label} error={errors[field.name]} className={field.full ? ui.fieldFull : ""}>
                  {renderInput(field)}
                </Field>
              ))}
            </div>
          )}
        </EntityFormWrapper>
      ) : null}

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
