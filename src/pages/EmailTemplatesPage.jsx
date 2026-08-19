import { useEffect, useMemo, useRef, useState } from "react";
import { emailTemplateService } from "../api/emailTemplateService";
import { ctaConfigService } from "../api/ctaConfigService";
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
import {
  Mail,
  FileText,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  Send,
  RefreshCw,
  Filter,
  Search,
  Upload,
  Download,
  Save,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Calendar,
  Tag,
  Layers,
  Zap,
  Shield,
  Database,
  Server,
  Globe,
  Link,
  Type,
  Palette,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Underline,
  List,
  Quote,
  Code,
  Image,
  Video,
  Music,
  File,
  Folder,
  HardDrive,
  Cloud,
  Smartphone,
  Tablet,
  Monitor,
  Layout,
  Columns,
  Grid,
  List as ListIcon,
  ChevronDown,
  ChevronRight
} from "lucide-react";

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
  { value: "contact", label: "Contact" },
  { value: "admin_notification", label: "Admin Notification" },
];

const formTypeOptions = typeOptions.filter((option) => option.value !== "all");

const ctaTypeOptions = [
  { value: "none", label: "None", url: "" },
  { value: "home", label: "Home", url: "/home" },
  { value: "daily_test", label: "Daily Test", url: "/daily-test" },
  { value: "revision", label: "Revision", url: "/revision" },
  { value: "mock_test", label: "Mock Test", url: "/mock-tests" },
  { value: "leaderboard", label: "Leaderboard", url: "/leaderboard" },
  { value: "weak_areas", label: "Weak Areas", url: "/weak-areas" },
  { value: "mistake_book", label: "Mistake Book", url: "/mistake-book" },
  { value: "subscription", label: "Subscription", url: "/subscription" },
  { value: "profile", label: "Profile", url: "/profile" },
  { value: "custom_url", label: "Custom URL", url: "" },
];

const openInOptions = [
  { value: "app", label: "App" },
  { value: "website", label: "Website" },
  { value: "auto", label: "Auto (App if installed, otherwise Website)" },
];

const alignmentOptions = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

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
  ctaConfigId: "",
  ctaEnabled: false,
  ctaText: "",
  ctaType: "none",
  ctaUrl: "",
  openIn: "auto",
  buttonColor: "#2563eb",
  buttonTextColor: "#ffffff",
  buttonAlignment: "center",
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
  const [ctaConfigs, setCtaConfigs] = useState([]);
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

  function getCtaTypeLabel(type) {
    return ctaTypeOptions.find((option) => option.value === type)?.label || type || "None";
  }

  function isValidCtaUrl(value) {
    const url = String(value || "").trim();
    if (!url || /\s/.test(url)) return false;
    if (/^\/[^\s]*$/.test(url)) return true;
    if (/^https?:\/\//i.test(url)) {
      try {
        const parsed = new URL(url);
        return Boolean(parsed.hostname);
      } catch {
        return false;
      }
    }
    return /^[a-z][a-z0-9+.-]*:\/\/\S+$/i.test(url);
  }

  function handleCtaTypeChange(value) {
    const selected = ctaTypeOptions.find((option) => option.value === value);
    setFormState((current) => ({
      ...current,
      ctaType: value,
      ctaUrl: selected?.url !== undefined ? selected.url : current.ctaUrl,
    }));
  }

  function ctaFieldsFromConfig(config) {
    return {
      ctaConfigId: config.id || config._id || "",
      ctaEnabled: true,
      ctaText: config.ctaText || "",
      ctaType: config.ctaType || "none",
      ctaUrl: config.ctaUrl || "",
      openIn: config.openIn || "auto",
      buttonColor: config.buttonColor || "#2563eb",
      buttonTextColor: config.buttonTextColor || "#ffffff",
      buttonAlignment: config.buttonAlignment || "center",
    };
  }

  function applyManagedCta(id) {
    if (!id) {
      setFormState((current) => ({ ...current, ctaConfigId: "" }));
      return;
    }
    const selected = ctaConfigs.find((item) => String(item.id || item._id) === String(id));
    if (!selected) return;
    setFormState((current) => ({ ...current, ...ctaFieldsFromConfig(selected) }));
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
      ctaConfigId: item.ctaConfigId || "",
      ctaEnabled: Boolean(item.ctaEnabled),
      ctaText: item.ctaText || "",
      ctaType: item.ctaType || "none",
      ctaUrl: item.ctaUrl || "",
      openIn: item.openIn || "auto",
      buttonColor: item.buttonColor || "#2563eb",
      buttonTextColor: item.buttonTextColor || "#ffffff",
      buttonAlignment: item.buttonAlignment || "center",
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
      ctaConfigId: item.ctaConfigId || "",
      ctaEnabled: Boolean(item.ctaEnabled),
      ctaText: item.ctaText || "",
      ctaType: item.ctaType || "none",
      ctaUrl: item.ctaUrl || "",
      openIn: item.openIn || "auto",
      buttonColor: item.buttonColor || "#2563eb",
      buttonTextColor: item.buttonTextColor || "#ffffff",
      buttonAlignment: item.buttonAlignment || "center",
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
    if (formState.ctaEnabled) {
      if (!formState.ctaText.trim()) nextErrors.ctaText = "CTA button text is required when CTA is enabled.";
      if (!formState.ctaType || formState.ctaType === "none") nextErrors.ctaType = "CTA destination is required when CTA is enabled.";
      if (formState.ctaType === "custom_url") {
        if (!formState.ctaUrl.trim()) {
          nextErrors.ctaUrl = "Custom URL is required.";
        } else if (!isValidCtaUrl(formState.ctaUrl)) {
          nextErrors.ctaUrl = "Enter a valid URL.";
        }
      }
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
      ctaConfigId: formState.ctaConfigId || "",
      ctaEnabled: Boolean(formState.ctaEnabled),
      ctaText: formState.ctaText.trim(),
      ctaType: formState.ctaType || "none",
      ctaUrl: formState.ctaUrl.trim(),
      openIn: formState.openIn || "auto",
      buttonColor: formState.buttonColor || "#2563eb",
      buttonTextColor: formState.buttonTextColor || "#ffffff",
      buttonAlignment: formState.buttonAlignment || "center",
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
      await refreshTemplateData({ ...query, page: 1 });
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function seedDefaultTemplates() {
    try {
      const response = await emailTemplateService.seedDefaults(updateExisting);
      const data = response.data || {};
      toast.success(response.message || `Default templates processed: ${data.created?.length || 0} created, ${data.updated?.length || 0} updated.`);
      await refreshTemplateData({ ...query, page: 1 });
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
      await refreshTemplateData(nextQuery);
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
      await refreshTemplateData(nextQuery);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function toggleTemplateActive(item) {
    try {
      await emailTemplateService.update(item.id, { isActive: !item.isActive });
      toast.success(`Template ${item.isActive ? "deactivated" : "activated"} successfully.`);
      await refreshTemplateData(query);
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

  async function loadCtaConfigs() {
    const response = await ctaConfigService.list({ channel: "email", isActive: true });
    setCtaConfigs(response.data || []);
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

  async function refreshTemplateData(nextQuery = query) {
    await Promise.all([
      loadItems(nextQuery),
      loadCatalog(),
      loadCtaConfigs(),
      loadAudit(),
    ]);
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

    loadCtaConfigs()
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

  async function createManagedCtaFromForm() {
    if (!formState.ctaText.trim() || !formState.ctaType || formState.ctaType === "none" || (formState.ctaType === "custom_url" && !isValidCtaUrl(formState.ctaUrl))) {
      toast.error("Enter valid CTA text and destination before saving as reusable CTA.");
      return;
    }
    try {
      const response = await ctaConfigService.create({
        name: `${formState.name || formState.ctaText || "Email CTA"} CTA`,
        channel: "email",
        ctaText: formState.ctaText,
        ctaType: formState.ctaType,
        ctaUrl: formState.ctaUrl,
        openIn: formState.openIn,
        buttonColor: formState.buttonColor,
        buttonTextColor: formState.buttonTextColor,
        buttonAlignment: formState.buttonAlignment,
        isActive: true,
      });
      const item = response.data;
      await loadCtaConfigs();
      setFormState((current) => ({ ...current, ctaConfigId: item?.id || item?._id || "" }));
      toast.success("Reusable CTA created.");
    } catch (error) {
      toast.error(error.message);
    }
  }

  // Compact input classes
  const compactInput = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
  const compactSelect = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none";
  const compactTextarea = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y min-h-[60px]";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200/60 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25">
              <Mail size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Email Templates</h1>
              <p className="text-xs text-slate-500">Manage customizable email templates</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-medium text-indigo-700">
              {meta?.total || items.length} templates
            </span>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-2.5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1 min-w-0">
            <SearchBar value={search} onChange={setSearch} placeholder="Search templates..." />
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <div className="flex items-center gap-0.5">
              <Filter size={9} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Type:</span>
              <select className={cn(compactSelect, "w-24")} value={query.type} onChange={(event) => setQuery((current) => ({ ...current, type: event.target.value, page: 1 }))}>
                {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-0.5">
              <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Module:</span>
              <select className={cn(compactSelect, "w-24")} value={moduleFilter} onChange={(event) => { setModuleFilter(event.target.value); setQuery((current) => ({ ...current, page: 1 })); }}>
                <option value="all">All</option>
                {(catalog?.modules || []).map((module) => <option key={module} value={module}>{module}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-0.5">
              <label className="flex items-center gap-0.5 text-sm font-medium text-slate-500">
                <input type="checkbox" className="h-3 w-3 rounded border-slate-300 text-indigo-600 focus:ring-1 focus:ring-indigo-500/20" checked={updateExisting} onChange={(event) => setUpdateExisting(event.target.checked)} />
                Update
              </label>
            </div>
            <button className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 rounded transition-colors" onClick={() => importRef.current?.click()}>
              <Upload size={8} /> Import
            </button>
            <button className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 rounded transition-colors" onClick={seedDefaultTemplates}>
              <RefreshCw size={8} /> Seed
            </button>
            <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm shadow-indigo-500/25" onClick={openCreate}>
              <Plus size={8} /> New
            </button>
            <input ref={importRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleBulkUpload} />
          </div>
        </div>
      </div>

      {/* Loading/Empty States */}
      {loading && <LoadingSpinner />}
      {!loading && !items.length && <EmptyState title="No email templates found" description="Create your first email template to get started." />}

      {/* Templates Table */}
      {!loading && items.length && (
        <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  {["Template", "Type", "Module", "Variables", "CTA", "Status", "Updated", "Actions"].map((x) => (
                    <th key={x} className="px-2.5 py-1.5 text-left">
                      <span className="text-sm font-bold uppercase tracking-wider text-slate-400">{x}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-2.5 py-1.5">
                      <div className="text-[10px] font-semibold text-slate-900">{item.name}</div>
                      <div className="text-sm text-slate-400">{item.key}</div>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <span className="inline-flex px-1.5 py-0.5 bg-slate-100 rounded text-sm font-medium text-slate-600">{getTypeLabel(item.type)}</span>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <span className="inline-flex px-1.5 py-0.5 bg-indigo-50 rounded text-sm font-medium text-indigo-600">{item.module || item.type}</span>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="text-sm text-slate-500 truncate max-w-[120px]">
                        {(item.variables || []).map((name) => `{{${name}}}`).join(", ")}
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <span className={cn(
                        "inline-flex px-1.5 py-0.5 rounded text-sm font-medium",
                        item.ctaEnabled ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"
                      )}>
                        {item.ctaEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <span className={cn(
                        "inline-flex px-1.5 py-0.5 rounded text-sm font-medium",
                        item.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"
                      )}>
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5 text-sm text-slate-400">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="flex items-center gap-0.5">
                        <button className="p-0.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" onClick={() => openEdit(item)}>
                          <Edit size={10} />
                        </button>
                        <button className="p-0.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" onClick={() => previewTemplate(item)}>
                          <Eye size={10} />
                        </button>
                        <button className="p-0.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" onClick={() => sendTestEmail(item)}>
                          <Send size={10} />
                        </button>
                        <button className="p-0.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" onClick={() => openDuplicate(item)}>
                          <Copy size={10} />
                        </button>
                        <button className="p-0.5 text-rose-600 hover:bg-rose-50 rounded transition-colors" onClick={() => setDeleteItem(item)}>
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta && <Pagination meta={meta} onChange={(page) => setQuery((current) => ({ ...current, page }))} />}
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-2xl shadow-slate-950/30 w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-2.5 border-b border-slate-200/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{preview.item.name}</h3>
                <p className="text-[10px] text-slate-500">{preview.subject}</p>
              </div>
              <button className="p-1 rounded-lg hover:bg-slate-100 transition-colors" onClick={() => setPreview(null)}>
                <X size={14} />
              </button>
            </div>
            <div className="overflow-y-auto p-4 max-h-[calc(90vh-80px)]">
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                {preview.htmlContent ? (
                  <div dangerouslySetInnerHTML={{ __html: preview.htmlContent }} className="prose prose-sm max-w-none" />
                ) : (
                  <pre className="whitespace-pre-wrap text-[10px] text-slate-700 font-mono">{preview.textContent || "No preview available."}</pre>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <EntityFormWrapper
          title={editingItem ? "Edit Email Template" : "Create Email Template"}
          subtitle="Manage the email template content and delivery variables."
          onCancel={() => setShowForm(false)}
          onSubmit={handleSubmit}
          submitLabel={editingItem ? "Save Changes" : "Create Template"}
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="flex flex-col gap-0.5">
              <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Catalog Mapping</label>
              <select className={compactSelect} value={formState.key} onChange={(e) => applyCatalogTemplate(e.target.value)}>
                <option value="">Select mapped email action</option>
                {catalogTemplates.map((item) => <option key={item.key} value={item.key}>{item.name} ({item.key})</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Template Name</label>
              <input className={compactInput} value={formState.name} onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Template Key</label>
              <input className={compactInput} value={formState.key} onChange={(event) => setFormState((current) => ({ ...current, key: event.target.value }))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Template Type</label>
              <select className={compactSelect} value={formState.type} onChange={(value) => setFormState((current) => ({ ...current, type: value.target.value, module: current.module.trim() || value.target.value }))}>
                <option value="">Select type</option>
                {formTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Module</label>
              <input className={compactInput} value={formState.module} onChange={(event) => setFormState((current) => ({ ...current, module: event.target.value }))} placeholder="e.g. notification" />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Subject</label>
              <input className={compactInput} value={formState.subject} onChange={(event) => setFormState((current) => ({ ...current, subject: event.target.value }))} />
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg border border-slate-200/50 px-2 py-0.5">
              <ToggleSwitch checked={Boolean(formState.isActive)} onChange={(value) => setFormState((current) => ({ ...current, isActive: value }))} label="" size="sm" />
              <span className="text-sm font-medium text-slate-700">{formState.isActive ? "Active" : "Inactive"}</span>
            </div>
          </div>

          {/* CTA Settings */}
          <div className="bg-slate-50 rounded-lg border border-slate-200/50 p-2.5 mt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-sm font-semibold text-slate-700">CTA Settings</span>
              <ToggleSwitch checked={Boolean(formState.ctaEnabled)} onChange={(value) => setFormState((current) => ({ ...current, ctaEnabled: value }))} label="" size="sm" />
              <span className="text-sm font-medium text-slate-600">{formState.ctaEnabled ? "Enabled" : "Disabled"}</span>
            </div>
            {formState.ctaEnabled && (
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                <div className="flex flex-col gap-0.5 sm:col-span-2">
                  <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Managed CTA</label>
                  <div className="flex gap-1">
                    <select className={cn(compactSelect, "flex-1")} value={formState.ctaConfigId} onChange={(event) => applyManagedCta(event.target.value)}>
                      <option value="">Custom CTA</option>
                      {ctaConfigs.map((item) => <option key={item.id || item._id} value={item.id || item._id}>{item.name}</option>)}
                    </select>
                    <button type="button" className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-sm font-medium text-slate-700 rounded transition-colors" onClick={createManagedCtaFromForm}>
                      <Save size={8} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">CTA Text</label>
                  <input className={compactInput} value={formState.ctaText} onChange={(event) => setFormState((current) => ({ ...current, ctaText: event.target.value }))} placeholder="Button text" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">CTA Type</label>
                  <select className={compactSelect} value={formState.ctaType} onChange={(e) => handleCtaTypeChange(e.target.value)}>
                    {ctaTypeOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                {formState.ctaType === "custom_url" && (
                  <div className="flex flex-col gap-0.5 sm:col-span-2">
                    <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Custom URL</label>
                    <input className={compactInput} value={formState.ctaUrl} onChange={(event) => setFormState((current) => ({ ...current, ctaUrl: event.target.value }))} placeholder="https://..." />
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Open In</label>
                  <select className={compactSelect} value={formState.openIn} onChange={(e) => setFormState((current) => ({ ...current, openIn: e.target.value }))}>
                    {openInOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Alignment</label>
                  <select className={compactSelect} value={formState.buttonAlignment} onChange={(e) => setFormState((current) => ({ ...current, buttonAlignment: e.target.value }))}>
                    {alignmentOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Button Color</label>
                  <div className="flex gap-1">
                    <input type="color" className="h-6 w-6 rounded border border-slate-200 p-0.5 cursor-pointer" value={/^#[0-9a-f]{6}$/i.test(formState.buttonColor) ? formState.buttonColor : "#2563eb"} onChange={(event) => setFormState((current) => ({ ...current, buttonColor: event.target.value }))} />
                    <input className={cn(compactInput, "flex-1")} value={formState.buttonColor} onChange={(event) => setFormState((current) => ({ ...current, buttonColor: event.target.value }))} />
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Text Color</label>
                  <div className="flex gap-1">
                    <input type="color" className="h-6 w-6 rounded border border-slate-200 p-0.5 cursor-pointer" value={/^#[0-9a-f]{6}$/i.test(formState.buttonTextColor) ? formState.buttonTextColor : "#ffffff"} onChange={(event) => setFormState((current) => ({ ...current, buttonTextColor: event.target.value }))} />
                    <input className={cn(compactInput, "flex-1")} value={formState.buttonTextColor} onChange={(event) => setFormState((current) => ({ ...current, buttonTextColor: event.target.value }))} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-1.5 mt-1">
            <div className="flex flex-col gap-0.5">
              <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">HTML Content</label>
              <textarea className={compactTextarea} rows={4} value={formState.htmlContent} onChange={(event) => setFormState((current) => ({ ...current, htmlContent: event.target.value }))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Text Content</label>
              <textarea className={compactTextarea} rows={3} value={formState.textContent} onChange={(event) => setFormState((current) => ({ ...current, textContent: event.target.value }))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Variables</label>
              <TagInput value={formState.variables} onChange={(nextValue) => setFormState((current) => ({ ...current, variables: nextValue }))} />
              {allowedVariables.length > 0 && (
                <div className="mt-1 bg-slate-50 rounded-lg border border-slate-200/50 p-1.5">
                  <div className="text-[6px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Available Variables</div>
                  <div className="flex flex-wrap gap-0.5">
                    {allowedVariables.map((name) => (
                      <button type="button" key={name} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[6px] font-medium text-slate-600 hover:bg-slate-100 transition-colors" onClick={() => copyVariable(name)}>
                        {`{{${name}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Sample Data (JSON)</label>
              <textarea className={compactTextarea} rows={3} value={formState.sampleData} onChange={(event) => setFormState((current) => ({ ...current, sampleData: event.target.value }))} />
            </div>
          </div>
        </EntityFormWrapper>
      )}

      {/* Delete Modal */}
      <ConfirmDeleteModal
        open={Boolean(deleteItem)}
        title="Delete email template"
        description="This will permanently delete the selected email template."
        onCancel={() => setDeleteItem(null)}
        onConfirm={handleDelete}
      />

      {/* Email Logs */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Clock size={14} className="text-indigo-600" />
          <h2 className="text-xs font-semibold text-slate-900">Recent Email Logs</h2>
          <span className="text-sm text-slate-400">({logs.length})</span>
        </div>
        <div className="divide-y divide-slate-100 mt-2">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
              <div>
                <div className="font-medium text-slate-900">{log.subject}</div>
                <div className="text-slate-500">{log.to} - {log.templateKey || "manual"}</div>
              </div>
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[6px] font-medium",
                log.status === "sent" ? "bg-emerald-100 text-emerald-700" :
                log.status === "failed" ? "bg-rose-100 text-rose-700" :
                "bg-slate-100 text-slate-600"
              )}>{log.status}</span>
            </div>
          ))}
          {!logs.length && <div className="text-sm text-slate-400 py-2">No sent email logs yet.</div>}
        </div>
      </div>

      {/* Audit Report */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Shield size={14} className="text-indigo-600" />
          <h2 className="text-xs font-semibold text-slate-900">Email Mapping Report</h2>
          <span className="text-sm text-slate-400">Audit status</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {["Working", "Missing", "Broken"].map((status) => (
            <span key={status} className={cn(
              "px-1.5 py-0.5 rounded text-[6px] font-medium",
              status === "Working" ? "bg-emerald-100 text-emerald-700" :
              status === "Broken" ? "bg-rose-100 text-rose-700" :
              "bg-amber-100 text-amber-700"
            )}>
              {status}: {audit?.summary?.[status] || 0}
            </span>
          ))}
        </div>
        <div className="mt-2 max-h-48 overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-500 border-b border-slate-100">
              <tr>
                <th className="text-left py-0.5 font-medium">Module</th>
                <th className="text-left py-0.5 font-medium">Event</th>
                <th className="text-left py-0.5 font-medium">Template</th>
                <th className="text-left py-0.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(audit?.modules || []).map((item) => (
                <tr key={item.templateKey} className="border-b border-slate-50">
                  <td className="py-0.5 text-slate-700">{item.moduleName}</td>
                  <td className="py-0.5 text-slate-600">{item.emailTriggerEvent}</td>
                  <td className="py-0.5 text-slate-600">{item.templateKey}</td>
                  <td className="py-0.5">
                    <span className={cn(
                      "px-1 py-0.5 rounded text-[5px] font-medium",
                      item.status === "Working" ? "bg-emerald-100 text-emerald-700" :
                      item.status === "Broken" ? "bg-rose-100 text-rose-700" :
                      "bg-amber-100 text-amber-700"
                    )}>{item.status}</span>
                  </td>
                </tr>
              ))}
              {!audit?.modules?.length && <tr><td colSpan={4} className="py-2 text-center text-slate-400">No audit data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}