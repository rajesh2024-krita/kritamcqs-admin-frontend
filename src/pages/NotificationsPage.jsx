import { useEffect, useState } from "react";
import { emailTemplateService } from "../api/emailTemplateService";
import { notificationService } from "../api/notificationService";
import { ctaConfigService } from "../api/ctaConfigService";
import { EmptyState } from "../components/common/EmptyState";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Pagination } from "../components/tables/Pagination";
import { SearchBar } from "../components/tables/SearchBar";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";
import {
  Bell,
  Send,
  Users,
  Target,
  Mail,
  MessageSquare,
  FileText,
  Image,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Upload,
  Link,
  Hash,
  Type,
  Layout,
  Share2,
  Smartphone
} from "lucide-react";

const typeOptions = [
  { value: "text", label: "Text" },
  { value: "image", label: "Image" },
  { value: "offer", label: "Offer" },
  { value: "announcement", label: "Announcement" },
  { value: "update", label: "Update" },
  { value: "reminder", label: "Reminder" },
];

const targetOptions = [
  { value: "all", label: "All users" },
  { value: "premium", label: "Premium users" },
  { value: "non_premium", label: "Non-premium users" },
  { value: "new_registered", label: "New registered users" },
  { value: "selected", label: "Selected users" },
  { value: "highest_premium", label: "Highest premium users" },
  { value: "middle_premium", label: "Middle-level premium users" },
  { value: "lowest_premium", label: "Lowest premium users" },
];
const targetScreenOptions = [
  { value: "", label: "Custom / None" },
  { value: "/dashboard", label: "Dashboard" },
  { value: "/daily-test", label: "Daily Test" },
  { value: "/weak-areas", label: "Weak Areas" },
  { value: "/subscription", label: "Premium / Subscription" },
  { value: "/notifications", label: "Notifications" },
  { value: "/mock-tests", label: "Mock Tests" },
  { value: "/revision", label: "Revision" },
];

const deliveryOptions = [
  { value: "notification", label: "App Notification" },
  { value: "email", label: "Email only" },
  { value: "push", label: "Push Notification" },
  { value: "email_push", label: "Email + Push" },
  { value: "both", label: "App + Email" },
];

const defaultForm = {
  title: "",
  body: "",
  type: "text",
  targetGroup: "all",
  deliveryMode: "notification",
  templateKey: "",
  variables: "{}",
  ctaConfigId: "",
  ctaText: "",
  linkUrl: "",
  selectedUsers: "",
};

const playStoreUrl = "https://play.google.com/store/apps/details?id=app.kritamcqs.androidapp";

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function defaultTemplateForType(templates, type) {
  const normalizedType = normalizeText(type);
  const notificationTemplates = templates.filter((item) => normalizeText(item.module) === "notifications" || normalizeText(item.module) === "notification");
  return (
    notificationTemplates.find((item) => normalizeText(item.type) === normalizedType)
    || notificationTemplates.find((item) => item.key === "notification_general")
    || null
  );
}

export function NotificationsPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [query, setQuery] = useState({ page: 1, type: "all" });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [attachment, setAttachment] = useState(null);
  const [emailCatalog, setEmailCatalog] = useState([]);
  const [ctaConfigs, setCtaConfigs] = useState([]);

  async function loadItems(nextQuery = query) {
    setLoading(true);
    try {
      const response = await notificationService.list({ ...nextQuery, search });
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
  }, [query.page, query.type]);

  useEffect(() => {
    emailTemplateService.catalog()
      .then((response) => {
        const payload = response?.data ?? response;
        const templates = (payload?.data ?? payload)?.templates || [];
        setEmailCatalog(
          templates.filter((item) => {
            const module = normalizeText(item.module);
            return module === "notification" || module === "notifications";
          }),
        );
      })
      .catch(() => undefined);
    ctaConfigService.list({ channel: "push", isActive: true })
      .then((response) => setCtaConfigs(response.data || []))
      .catch(() => undefined);
  }, []);

  const autoTemplate = defaultTemplateForType(emailCatalog, form.type);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = { ...query, page: 1 };
      setQuery(next);
      void loadItems(next);
    }, 350);
    return () => window.clearTimeout(id);
  }, [search]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (form.variables?.trim()) {
      try {
        JSON.parse(form.variables);
      } catch {
        toast.error("Variables must be valid JSON.");
        return;
      }
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.set(key, value));
    if (attachment) formData.set("attachment", attachment);

    setSending(true);
    try {
      const response = await notificationService.broadcast(formData);
      const summary = response.data || {};
      toast.success(`Sent to ${summary.totalRecipients || 0} users`);
      setForm(defaultForm);
      setAttachment(null);
      await loadItems({ ...query, page: 1 });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  }

  function applyCtaConfig(id) {
    if (!id) {
      setForm((current) => ({ ...current, ctaConfigId: "" }));
      return;
    }
    const selected = ctaConfigs.find((item) => String(item.id || item._id) === String(id));
    if (!selected) return;
    setForm((current) => ({
      ...current,
      ctaConfigId: selected.id || selected._id || "",
      ctaText: selected.ctaText || "",
      linkUrl: selected.ctaUrl || current.linkUrl,
    }));
  }

  async function createCtaFromNotification() {
    if (!form.ctaText.trim() || !form.linkUrl.trim()) {
      toast.error("Enter CTA text and redirect URL first.");
      return;
    }
    try {
      const response = await ctaConfigService.create({
        name: `${form.title || form.ctaText || "Push"} CTA`,
        channel: "push",
        ctaText: form.ctaText,
        ctaType: "custom_url",
        ctaUrl: form.linkUrl,
        openIn: "app",
      });
      const item = response.data;
      setCtaConfigs((current) => [item, ...current]);
      setForm((current) => ({ ...current, ctaConfigId: item?.id || item?._id || "" }));
      toast.success("Reusable push CTA created.");
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
              <Bell size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Notifications</h1>
              <p className="text-xs text-slate-500">Send broadcasts and manage notification delivery</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-medium text-indigo-700">
              {meta?.total || items.length} sent
            </span>
            <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[9px] font-medium text-slate-700 rounded transition-colors" onClick={() => loadItems(query)} type="button">
              <RefreshCw size={10} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Broadcast Form */}
      <form className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm space-y-3" onSubmit={handleSubmit}>
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Send size={14} className="text-indigo-600" />
            <h2 className="text-xs font-semibold text-slate-900">Send Notification</h2>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[8px] font-medium text-slate-700 rounded transition-colors"
            onClick={() =>
              setForm((current) => ({
                ...current,
                title: "Update KritaMCQs",
                body: "A new app update is available. Tap Update to open Play Store.",
                type: "update",
                targetGroup: "all",
                deliveryMode: "notification",
                ctaText: "Update",
                linkUrl: playStoreUrl,
              }))
            }
          >
            <Zap size={9} /> Quick Template
          </button>
        </div>

        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Type</label>
            <select className={compactSelect} value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>
              {typeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Audience</label>
            <select className={compactSelect} value={form.targetGroup} onChange={(event) => setForm((current) => ({ ...current, targetGroup: event.target.value }))}>
              {targetOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Delivery</label>
            <select className={compactSelect} value={form.deliveryMode} onChange={(event) => setForm((current) => ({ ...current, deliveryMode: event.target.value }))}>
              {deliveryOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Email Template</label>
            <select className={compactSelect} value={form.templateKey} onChange={(event) => setForm((current) => ({ ...current, templateKey: event.target.value }))}>
              <option value="">Auto: {autoTemplate?.name || "Default"}</option>
              {emailCatalog.map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Title</label>
            <input className={compactInput} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Redirect URL</label>
            <input className={compactInput} placeholder="/subscription" value={form.linkUrl} onChange={(event) => setForm((current) => ({ ...current, linkUrl: event.target.value }))} />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Managed CTA</label>
            <select className={compactSelect} value={form.ctaConfigId} onChange={(event) => applyCtaConfig(event.target.value)}>
              <option value="">Custom CTA</option>
              {ctaConfigs.map((item) => <option key={item.id || item._id} value={item.id || item._id}>{item.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">CTA Text</label>
            <input className={compactInput} placeholder="Open App" value={form.ctaText} onChange={(event) => setForm((current) => ({ ...current, ctaText: event.target.value }))} />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Target Screen</label>
            <select className={compactSelect} value={targetScreenOptions.some((item) => item.value === form.linkUrl) ? form.linkUrl : ""} onChange={(event) => setForm((current) => ({ ...current, linkUrl: event.target.value || current.linkUrl }))}>
              {targetScreenOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Attachment</label>
            <input
              className={compactInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={(event) => setAttachment(event.target.files?.[0] || null)}
            />
            {attachment && <span className="text-[7px] text-emerald-600">{attachment.name}</span>}
          </div>
          <div className="flex flex-col gap-0.5 sm:col-span-3">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Message</label>
            <textarea className={compactTextarea} rows={3} value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} placeholder="Notification message..." />
          </div>
          {form.targetGroup === "selected" && (
            <div className="flex flex-col gap-0.5 sm:col-span-3">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Selected Users</label>
              <textarea className={compactTextarea} rows={2} value={form.selectedUsers} onChange={(event) => setForm((current) => ({ ...current, selectedUsers: event.target.value }))} placeholder="Emails, mobiles, or IDs (comma or new line)" />
            </div>
          )}
          <div className="flex flex-col gap-0.5 sm:col-span-3">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Email Variables (JSON)</label>
            <textarea className={compactTextarea} rows={2} value={form.variables} onChange={(event) => setForm((current) => ({ ...current, variables: event.target.value }))} placeholder='{"key": "value"}' />
          </div>
          <div className="flex flex-wrap gap-1 sm:col-span-3">
            <button type="button" className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[8px] font-medium text-slate-700 rounded transition-colors" onClick={createCtaFromNotification}>
              <Plus size={9} /> Save as CTA
            </button>
            <button className={cn(
              "inline-flex items-center gap-0.5 px-3 py-0.5 text-[8px] font-medium rounded-lg transition-all ml-auto",
              "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm shadow-indigo-500/25",
              sending && "opacity-50 cursor-not-allowed"
            )} disabled={sending} type="submit">
              <Send size={9} /> {sending ? "Sending..." : "Send Notification"}
            </button>
          </div>
        </div>
      </form>

      {/* History Header */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-2.5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-indigo-600" />
            <h2 className="text-xs font-semibold text-slate-900">Delivery History</h2>
            <span className="text-[8px] text-slate-400">({meta?.total || items.length})</span>
          </div>
          <div className="flex flex-wrap items-center gap-1 ml-auto">
            <select className={compactSelect} value={query.type} onChange={(event) => setQuery({ page: 1, type: event.target.value })}>
              <option value="all">All types</option>
              {typeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <SearchBar value={search} onChange={setSearch} placeholder="Search notifications..." />
          </div>
        </div>
      </div>

      {/* Loading/Empty States */}
      {loading && <LoadingSpinner />}
      {!loading && !items.length && <EmptyState title="No notifications found" description="Broadcast history will appear here." />}

      {/* Table */}
      {!loading && items.length && (
        <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  {["Notification", "User", "Target", "Delivery", "Read", "Created"].map((x) => (
                    <th key={x} className="px-2.5 py-1.5 text-left">
                      <span className="text-xs font-normal uppercase tracking-wider text-slate-400">{x}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-2.5 py-1.5">
                      <div className="text-[10px] font-semibold text-slate-900">{item.title}</div>
                      <div className="text-[8px] text-slate-500 truncate max-w-[200px]">{item.body}</div>
                      <div className="flex flex-wrap gap-0.5 mt-0.5">
                        <span className="inline-flex px-1.5 py-0.5 bg-slate-100 rounded text-[7px] font-medium text-slate-600">{item.type}</span>
                        {item.attachmentUrl && <span className="inline-flex px-1.5 py-0.5 bg-indigo-50 rounded text-[7px] font-medium text-indigo-600">Attachment</span>}
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="text-[9px] font-semibold text-slate-900">{item.user?.name || "Learner"}</div>
                      <div className="text-[7px] text-slate-400">{item.user?.email || item.user?.mobile || item.userId}</div>
                    </td>
                    <td className="px-2.5 py-1.5 text-[8px] text-slate-600">{item.targetGroup || "-"}</td>
                    <td className="px-2.5 py-1.5">
                      <div className="flex flex-col gap-0.5 text-[7px]">
                        <span className={cn(
                          "inline-flex px-1.5 py-0.5 rounded",
                          item.notificationStatus === "sent" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        )}>App: {item.notificationStatus || "-"}</span>
                        <span className={cn(
                          "inline-flex px-1.5 py-0.5 rounded",
                          item.emailStatus === "sent" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        )}>Email: {item.emailStatus || "-"}</span>
                        <span className={cn(
                          "inline-flex px-1.5 py-0.5 rounded",
                          item.pushStatus === "sent" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        )}>Push: {item.pushStatus || "-"}</span>
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <span className={cn(
                        "inline-flex px-1.5 py-0.5 rounded text-[7px] font-medium",
                        item.readAt ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      )}>
                        {item.readAt ? "Read" : "Unread"}
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5 text-[7px] text-slate-400">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}
                    </td>
                    {/* <td className="px-2.5 py-1.5">
                      <button className="p-0.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                        <Eye size={10} />
                      </button>
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onChange={(page) => setQuery((current) => ({ ...current, page }))} />
        </div>
      )}
    </div>
  );
}