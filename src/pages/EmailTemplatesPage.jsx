import { useEffect, useMemo, useRef, useState } from "react";
import { emailTemplateService } from "../api/emailTemplateService";
import { ConfirmDeleteModal } from "../components/common/ConfirmDeleteModal";
import { EmptyState } from "../components/common/EmptyState";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EntityFormWrapper } from "../components/forms/EntityFormWrapper";
import { Field } from "../components/forms/Field";
import { SelectDropdown } from "../components/forms/SelectDropdown";
import { TagInput } from "../components/forms/TagInput";
import { ToggleSwitch } from "../components/forms/ToggleSwitch";
import { Pagination } from "../components/tables/Pagination";
import { SearchBar } from "../components/tables/SearchBar";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";

const typeOptions = [
  { value: "all", label: "All Types" },
  { value: "forgot_password", label: "Forgot Password" },
  { value: "otp_verification", label: "OTP Verification" },
  { value: "welcome", label: "Welcome" },
  { value: "notification", label: "Notification" },
  { value: "offer", label: "Offer" },
  { value: "announcement", label: "Announcement" },
  { value: "update", label: "Update" },
  { value: "invoice", label: "Invoice" },
  { value: "registration", label: "Registration" },
  { value: "verification", label: "Verification" },
  { value: "subscription", label: "Subscription" },
  { value: "payment_success", label: "Payment Success" },
  { value: "reminder", label: "Reminder" },
  { value: "broadcast", label: "Broadcast" },
  { value: "expiry", label: "Expiry" },
  { value: "helpdesk", label: "Helpdesk" },
  { value: "admin_notification", label: "Admin Notification" },
];

const formTypeOptions = typeOptions.filter((option) => option.value !== "all");

const initialFormState = {
  name: "",
  key: "",
  type: "",
  module: "",
  subject: "",
  htmlContent: "",
  textContent: "",
  variables: [],
  sampleData: "{}",
  isActive: true,
};

export function EmailTemplatesPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [query, setQuery] = useState({ page: 1, type: "all" });
  const [moduleFilter, setModuleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState(null);
  const [preview, setPreview] = useState(null);
  const [logs, setLogs] = useState([]);
  const [audit, setAudit] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [formState, setFormState] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [updateExisting, setUpdateExisting] = useState(false);
  const importRef = useRef(null);

  const catalogTemplates = catalog?.templates || [];
  const selectedCatalog = useMemo(
    () => catalogTemplates.find((item) => item.key === formState.key) || catalogTemplates.find((item) => item.module === formState.module && item.type === formState.type),
    [catalogTemplates, formState.key, formState.module, formState.type],
  );
  const allowedVariables = selectedCatalog?.variables || [];

  function extractVariables(...values) {
    return [...new Set(values.join("\n").match(/\{\{\s*[\w.]+\s*\}\}/g)?.map((item) => item.replace(/[{}]/g, "").trim()) || [])];
  }

  function unsupportedVariables() {
    if (!allowedVariables.length) return [];
    const used = [...new Set([...(formState.variables || []), ...extractVariables(formState.subject, formState.htmlContent, formState.textContent)])];
    return used.filter((name) => !allowedVariables.includes(name));
  }

  function resetForm() {
    setEditingItem(null);
    setFormState(initialFormState);
    setFormErrors({});
  }

  function openCreate() {
    resetForm();
    setShowForm(true);
  }

  function openEdit(item) {
    setEditingItem(item);
    setFormErrors({});
    setFormState({
      name: item.name || "",
      key: item.key || "",
      type: item.type || "",
      module: item.module || "",
      subject: item.subject || "",
      htmlContent: item.htmlContent || "",
      textContent: item.textContent || "",
      variables: Array.isArray(item.variables) ? item.variables : [],
      sampleData: JSON.stringify(item.sampleData || {}, null, 2),
      isActive: item.isActive !== false,
    });
    setShowForm(true);
  }

  function openDuplicate(item) {
    setEditingItem(null);
    setFormErrors({});
    setFormState({
      name: `${item.name || ""} Copy`,
      key: "",
      type: item.type || "",
      module: item.module || "",
      subject: item.subject || "",
      htmlContent: item.htmlContent || "",
      textContent: item.textContent || "",
      variables: Array.isArray(item.variables) ? item.variables : [],
      sampleData: JSON.stringify(item.sampleData || {}, null, 2),
      isActive: item.isActive !== false,
    });
    setShowForm(true);
  }

  function validateForm() {
    const nextErrors = {};
    if (!formState.name.trim()) nextErrors.name = "Template name is required.";
    if (!formState.key.trim()) nextErrors.key = "Template key is required.";
    if (!formState.type) nextErrors.type = "Template type is required.";
    if (!formState.subject.trim()) nextErrors.subject = "Template subject is required.";
    if (!formState.htmlContent.trim() && !formState.textContent.trim()) {
      nextErrors.htmlContent = "At least one of HTML or text content is required.";
      nextErrors.textContent = "At least one of HTML or text content is required.";
    }
    if (formState.sampleData.trim()) {
      try {
        JSON.parse(formState.sampleData);
      } catch (error) {
        nextErrors.sampleData = "Sample data must be valid JSON.";
      }
    }
    const invalid = unsupportedVariables();
    if (invalid.length) nextErrors.variables = `Unsupported variables: ${invalid.map((name) => `{{${name}}}`).join(", ")}`;
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function buildPayload() {
    let sampleData = {};
    if (formState.sampleData.trim()) {
      try {
        sampleData = JSON.parse(formState.sampleData);
      } catch (error) {
        setFormErrors((current) => ({ ...current, sampleData: "Sample data must be valid JSON." }));
        throw new Error("Sample data must be valid JSON.");
      }
    }

    return {
      name: formState.name.trim(),
      key: formState.key.trim(),
      type: formState.type,
      module: formState.module.trim() || formState.type || "",
      subject: formState.subject.trim(),
      htmlContent: formState.htmlContent,
      textContent: formState.textContent,
      variables: Array.isArray(formState.variables) ? formState.variables : [],
      sampleData,
      isActive: Boolean(formState.isActive),
    };
  }

  function applyCatalogTemplate(key) {
    const item = catalogTemplates.find((template) => template.key === key);
    if (!item) return;
    setFormState((current) => ({
      ...current,
      key: item.key,
      name: current.name || item.name || "",
      type: item.type || current.type,
      module: current.module.trim() || item.module || item.type || "",
      subject: current.subject || item.subject || "",
      htmlContent: current.htmlContent || item.htmlContent || "",
      textContent: current.textContent || item.textContent || "",
      variables: item.variables || [],
      sampleData: JSON.stringify(item.sampleData || catalog?.sampleData || {}, null, 2),
    }));
  }

  async function copyVariable(name) {
    const value = `{{${name}}}`;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${value} copied`);
    } catch {
      toast.error("Unable to copy variable.");
    }
  }

  async function handleBulkUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const response = await emailTemplateService.bulkUpload(file, updateExisting);
      const data = response.data || {};
      toast.success(`Import processed: ${data.created?.length || 0} created, ${data.updated?.length || 0} updated, ${data.skipped?.length || 0} skipped.`);
      void loadItems({ ...query, page: 1 });
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validateForm()) return;
    try {
      const payload = buildPayload();
      if (editingItem) {
        await emailTemplateService.update(editingItem.id, payload);
        toast.success("Email template updated successfully.");
      } else {
        await emailTemplateService.create(payload);
        toast.success("Email template created successfully.");
      }
      setShowForm(false);
      resetForm();
      const nextQuery = { ...query, page: 1 };
      setQuery(nextQuery);
      void loadItems(nextQuery);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    try {
      await emailTemplateService.delete(deleteItem.id);
      toast.success("Email template deleted successfully.");
      setDeleteItem(null);
      const nextQuery = { ...query, page: 1 };
      setQuery(nextQuery);
      void loadItems(nextQuery);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleSyncDefaults() {
    try {
      const response = await emailTemplateService.syncDefaults();
      toast.success(`System templates synced: ${response.data?.synced ?? response.synced ?? 0}`);
      await Promise.all([loadItems({ ...query, page: 1 }), loadCatalog(), loadAudit()]);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function sendTestEmail(item) {
    const to = window.prompt("Send test email to:");
    if (!to) return;
    try {
      const response = await emailTemplateService.test(item.id, { to });
      toast.success(response.message || "Test email processed.");
      await loadLogs();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function loadCatalog() {
    const response = await emailTemplateService.catalog();
    const payload = response?.data ?? response;
    setCatalog((payload?.data ?? payload) || null);
  }

  async function loadLogs() {
    const response = await emailTemplateService.logs({ limit: 5 });
    const payload = response?.data ?? response;
    setLogs((payload?.data ?? payload) || []);
  }

  async function loadAudit() {
    const response = await emailTemplateService.audit();
    const payload = response?.data ?? response;
    setAudit((payload?.data ?? payload) || null);
  }

  async function loadItems(nextQuery = query) {
    setLoading(true);
    try {
      const response = await emailTemplateService.list({ ...nextQuery, module: moduleFilter, search });
      setItems(response.data || []);
      setMeta(response.meta || null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems(query);
  }, [query.page, query.type, moduleFilter]);

  useEffect(() => {
    loadCatalog()
      .catch((error) => toast.error(error.message));

    loadLogs()
      .catch(() => undefined);

    loadAudit()
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = { ...query, page: 1 };
      setQuery(next);
      void loadItems(next);
    }, 350);
    return () => window.clearTimeout(id);
  }, [search]);

  const getTypeLabel = (type) => {
    const option = typeOptions.find((opt) => opt.value === type);
    return option ? option.label : type;
  };

  async function previewTemplate(item) {
    try {
      const response = await emailTemplateService.preview(item.id, {});
      setPreview({ item, ...(response.data || {}) });
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <div className={ui.eyebrow}>System</div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Email Template Management</h1>
            <p className={ui.muted}>Create and manage customizable email templates for different system events.</p>
          </div>
        </div>
      </section>

      <section className={ui.panel}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <SearchBar value={search} onChange={setSearch} placeholder="Search templates..." />
            <select
              className={ui.input}
              value={query.type}
              onChange={(event) => setQuery((current) => ({ ...current, type: event.target.value, page: 1 }))}
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className={ui.input}
              value={moduleFilter}
              onChange={(event) => {
                setModuleFilter(event.target.value);
                setQuery((current) => ({ ...current, page: 1 }));
              }}
            >
              <option value="all">All Modules</option>
              {(catalog?.modules || []).map((module) => (
                <option key={module} value={module}>
                  {module}
                </option>
              ))}
            </select>
          </div>
          <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={openCreate}>
            Create Template
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={handleSyncDefaults}>
              Sync System Templates
            </button>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input type="checkbox" checked={updateExisting} onChange={(event) => setUpdateExisting(event.target.checked)} />
              Update existing
            </label>
            <input ref={importRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleBulkUpload} />
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => importRef.current?.click()}>
              Bulk Upload CSV/XLSX
            </button>
          </div>
        </div>


        {loading ? (
          <LoadingSpinner />
        ) : items.length ? (
          <>
            <table className={ui.table}>
              <thead>
                <tr>
                  <th className={ui.tableHead}>Template Name</th>
                  <th className={ui.tableHead}>Type</th>
                  <th className={ui.tableHead}>Module</th>
                  <th className={ui.tableHead}>Variables</th>
                  <th className={ui.tableHead}>Status</th>
                  <th className={ui.tableHead}>Last Updated</th>
                  <th className={ui.tableHead}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className={ui.tableCell}>
                      <div>
                        <div className="font-medium text-slate-900">{item.name}</div>
                        <div className="text-sm text-slate-500">{item.key}</div>
                      </div>
                    </td>
                    <td className={ui.tableCell}>
                      <span className={ui.pill}>{getTypeLabel(item.type)}</span>
                    </td>
                    <td className={ui.tableCell}>
                      <span className={ui.pill}>{item.module || item.type}</span>
                    </td>
                    <td className={ui.tableCell}>
                      <div className="max-w-xs truncate text-sm text-slate-500">
                        {(item.variables || []).map((name) => `{{${name}}}`).join(", ")}
                      </div>
                    </td>
                    <td className={ui.tableCell}>
                      <span className={cn(ui.pill, item.isActive ? ui.pillSuccess : ui.pillGray)}>
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className={ui.tableCell}>
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </td>
                    <td className={ui.tableCell}>
                      <div className="flex flex-wrap items-center gap-2">
                        <button className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => openEdit(item)}>Edit</button>
                        <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => previewTemplate(item)}>Preview</button>
                        <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => sendTestEmail(item)}>Send Test</button>
                        <button className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => openDuplicate(item)}>Duplicate</button>
                        <button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => setDeleteItem(item)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {meta && <Pagination meta={meta} onChange={(page) => setQuery((current) => ({ ...current, page }))} />}
          </>
        ) : (
          <EmptyState
            title="No email templates found"
            description="Create your first email template to get started with customizable email communications."
          />
        )}
      </section>

      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <div className="admin-modal w-full max-w-5xl overflow-auto rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl shadow-slate-950/20" onClick={(event) => event.stopPropagation()}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <h3 className="text-xl font-black tracking-tight text-slate-950">Preview: {preview.item.name}</h3>
                  <p className="mt-2 text-slate-500">{preview.subject}</p>
                </div>
                <button className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => setPreview(null)}>Close</button>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                {preview.htmlContent ? (
                  <div dangerouslySetInnerHTML={{ __html: preview.htmlContent }} />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-slate-700">{preview.textContent || "No preview available."}</pre>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showForm ? (
        <EntityFormWrapper
          title={editingItem ? "Edit Email Template" : "Create Email Template"}
          subtitle="Manage the email template content and delivery variables."
          onCancel={() => setShowForm(false)}
          onSubmit={handleSubmit}
          submitLabel={editingItem ? "Save Changes" : "Create Template"}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Catalog Mapping">
              <SelectDropdown value={formState.key} onChange={applyCatalogTemplate} options={catalogTemplates.map((item) => ({ value: item.key, label: `${item.name} (${item.key})` }))} placeholder="Select mapped email action" />
            </Field>
            <Field label="Template Name" error={formErrors.name}>
              <input className={ui.input} value={formState.name} onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))} />
            </Field>
            <Field label="Template Key" error={formErrors.key}>
              <input className={ui.input} value={formState.key} onChange={(event) => setFormState((current) => ({ ...current, key: event.target.value }))} />
            </Field>
            <Field label="Template Type" error={formErrors.type}>
              <SelectDropdown
                value={formState.type}
                onChange={(value) => setFormState((current) => ({
                  ...current,
                  type: value,
                  module: current.module.trim() || value,
                }))}
                options={formTypeOptions}
                placeholder="Select template type"
              />
            </Field>
            <Field label="Module">
              <input className={ui.input} value={formState.module} onChange={(event) => setFormState((current) => ({ ...current, module: event.target.value }))} placeholder="e.g. notification" />
            </Field>
            <Field label="Subject" error={formErrors.subject}>
              <input className={ui.input} value={formState.subject} onChange={(event) => setFormState((current) => ({ ...current, subject: event.target.value }))} />
            </Field>
            <Field label="Active">
              <ToggleSwitch checked={Boolean(formState.isActive)} onChange={(value) => setFormState((current) => ({ ...current, isActive: value }))} label={formState.isActive ? "Active" : "Inactive"} />
            </Field>
            <Field label="HTML Content" error={formErrors.htmlContent} className="md:col-span-2">
              <textarea className={ui.textarea} rows={6} value={formState.htmlContent} onChange={(event) => setFormState((current) => ({ ...current, htmlContent: event.target.value }))} />
            </Field>
            <Field label="Text Content" error={formErrors.textContent} className="md:col-span-2">
              <textarea className={ui.textarea} rows={5} value={formState.textContent} onChange={(event) => setFormState((current) => ({ ...current, textContent: event.target.value }))} />
            </Field>
            <Field label="Variables" error={formErrors.variables} className="md:col-span-2">
              <TagInput value={formState.variables} onChange={(nextValue) => setFormState((current) => ({ ...current, variables: nextValue }))} />
              {allowedVariables.length ? (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Available variables</div>
                  <div className="flex flex-wrap gap-2">
                    {allowedVariables.map((name) => (
                      <button type="button" key={name} className={cn(ui.buttonBase, ui.buttonSecondary, "min-h-8 px-2.5 py-1 text-xs")} onClick={() => copyVariable(name)}>
                        {`{{${name}}}`}
                      </button>
                    ))}
                  </div>
                  {selectedCatalog ? (
                    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                      <div className="font-semibold text-slate-900">Mapped template info</div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Trigger</div>
                          <div>{selectedCatalog.trigger || "Not specified"}</div>
                        </div>
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Attachments</div>
                          <div>{selectedCatalog.supportsAttachments ? "Enabled" : "Disabled"}</div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </Field>
            <Field label="Sample Data (JSON)" error={formErrors.sampleData} className="md:col-span-2">
              <textarea className={ui.textarea} rows={5} value={formState.sampleData} onChange={(event) => setFormState((current) => ({ ...current, sampleData: event.target.value }))} />
            </Field>
          </div>
        </EntityFormWrapper>
      ) : null}

      <ConfirmDeleteModal
        open={Boolean(deleteItem)}
        title="Delete email template"
        description="This will permanently delete the selected email template."
        onCancel={() => setDeleteItem(null)}
        onConfirm={handleDelete}
      />

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <div className={ui.eyebrow}>Delivery</div>
            <h2 className="text-xl font-black text-slate-900">Recent Email Logs</h2>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <div>
                <div className="font-medium text-slate-900">{log.subject}</div>
                <div className="text-slate-500">{log.to} - {log.templateKey || "manual"}</div>
              </div>
              <span className={cn(ui.pill, log.status === "sent" ? ui.pillSuccess : log.status === "failed" ? ui.pillDanger : ui.pillGray)}>{log.status}</span>
            </div>
          ))}
          {!logs.length && <p className={ui.muted}>No sent email logs yet.</p>}
        </div>
      </section>

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <div className={ui.eyebrow}>Audit</div>
            <h2 className="text-xl font-black text-slate-900">Email Mapping Report</h2>
            <p className={ui.muted}>Module triggers, template keys, and current database status.</p>
          </div>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {["Working", "Missing", "Broken"].map((status) => (
            <span key={status} className={cn(ui.pill, status === "Working" ? ui.pillSuccess : status === "Broken" ? ui.pillDanger : ui.pillWarning)}>
              {status}: {audit?.summary?.[status] || 0}
            </span>
          ))}
        </div>
        <div className="max-h-96 overflow-auto">
          <table className={ui.table}>
            <thead>
              <tr>
                <th className={ui.tableHead}>Module Name</th>
                <th className={ui.tableHead}>Functionality</th>
                <th className={ui.tableHead}>Email Trigger Event</th>
                <th className={ui.tableHead}>Template Key</th>
                <th className={ui.tableHead}>Status</th>
              </tr>
            </thead>
            <tbody>
              {(audit?.modules || []).map((item) => (
                <tr key={item.templateKey}>
                  <td className={ui.tableCell}>{item.moduleName}</td>
                  <td className={ui.tableCell}>{item.functionality}</td>
                  <td className={ui.tableCell}>{item.emailTriggerEvent}</td>
                  <td className={ui.tableCell}>{item.templateKey}</td>
                  <td className={ui.tableCell}>
                    <span className={cn(ui.pill, item.status === "Working" ? ui.pillSuccess : item.status === "Broken" ? ui.pillDanger : ui.pillWarning)}>{item.status}</span>
                  </td>
                </tr>
              ))}
              {!audit?.modules?.length ? (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-slate-500">Audit report has not loaded yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
