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
import { cn, ui } from "../../ui";

function normalizeInitialValues(fields) {
  return fields.reduce((acc, field) => {
    if (field.defaultValue !== undefined) acc[field.name] = field.defaultValue;
    else if (field.type === "checkbox" || field.type === "switch") acc[field.name] = false;
    else if (field.type === "tags") acc[field.name] = [];
    else acc[field.name] = "";
    return acc;
  }, {});
}

export function EntityManagerPage({ title, description, service, fields, columns, defaultQuery = {}, lookupLoaders = [], mapItemToForm, headerActions = null, filters = [] }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState({ page: 1, limit: 10, ...defaultQuery });
  const [filterValues, setFilterValues] = useState(() => filters.reduce((acc, filter) => ({ ...acc, [filter.name]: filter.defaultValue || "" }), {}));
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
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const visibleFields = useMemo(
    () => fields.filter((field) => (field.visible ? field.visible(formState, lookups) : true)),
    [fields, formState, lookups],
  );

  async function loadItems(nextQuery = query) {
    setLoading(true);
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filterValues).filter(([, value]) => value !== "" && value !== undefined && value !== null),
      );
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

  function openEdit(item) {
    setErrors({});
    setEditingItem(item);
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
    setFormState(mapItemToForm ? mapItemToForm(item, nextFormState) : nextFormState);
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
        await service.update(editingItem.id, payload);
        toast.success(`${title} updated`);
      } else {
        await service.create(payload);
        toast.success(`${title} created`);
      }

      setShowForm(false);
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

  function handleLimitChange(event) {
    const limit = Number(event.target.value);
    setSelectedIds([]);
    setQuery((current) => ({ ...current, limit, page: 1 }));
    loadItems({ ...query, limit, page: 1 });
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
      if (field.checkboxStyle === "simple") {
        return (
          <label className="inline-flex items-center gap-3 pt-2 text-sm font-medium text-slate-700">
            <input
              className={ui.checkbox}
              type="checkbox"
              checked={Boolean(value)}
              onChange={(event) => setFormState((current) => ({ ...current, [field.name]: event.target.checked }))}
            />
            <span>{field.toggleLabel || field.label}</span>
          </label>
        );
      }
      return (
        <div className="inline-flex items-center gap-3 pt-2 text-sm font-medium text-slate-700">
          <input
            className={ui.checkbox}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => setFormState((current) => ({ ...current, [field.name]: event.target.checked }))}
          />
          <span>{field.toggleLabel || field.label}</span>
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
            <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={openCreate}>
              <PlusIcon size={16} />
              Create {title.slice(0, -1) || title}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-sm border border-white/60 bg-white/85 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 text-[11px] font-black uppercase tracking-[0.28em] text-blue-700">Workspace Filters</div>
          <SearchBar value={search} onChange={setSearch} placeholder={`Search ${title.toLowerCase()}...`} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {filters.map((filter) => (
            <label key={filter.name} className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              {filter.label}
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
            </label>
          ))}
          {selectedIds.length > 0 ? (
            <button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => setBulkDeleteOpen(true)}>
              <TrashIcon size={16} />
              Delete Selected ({selectedIds.length})
            </button>
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
        </div>
      </div>

      {loading ? <LoadingSpinner /> : null}
      {!loading && items.length === 0 ? <EmptyState title={`No ${title.toLowerCase()} found`} description="Adjust the search or add a new record." /> : null}
      {!loading && items.length > 0 ? (
        <>
          <DataTable
            columns={columns}
            rows={items}
            selectable={Boolean(service?.removeMany)}
            selectedRowIds={selectedIds}
            onToggleRow={toggleRowSelection}
            onToggleAllRows={toggleAllSelection}
            renderActions={(row) => (
              <div className="flex flex-wrap items-center gap-3">
                <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => openEdit(row)}>
                  <EditIcon size={16} />
                  Edit
                </button>
                <button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => setDeleteItem(row)}>
                  <TrashIcon size={16} />
                  Delete
                </button>
              </div>
            )}
          />
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
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {visibleFields.map((field) => (
              <Field key={field.name} label={field.label} error={errors[field.name]} className={field.full ? ui.fieldFull : ""}>
                {renderInput(field)}
              </Field>
            ))}
          </div>
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
