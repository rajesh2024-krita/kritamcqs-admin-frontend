import { useEffect, useState } from "react";
import { emailTemplateService } from "../api/emailTemplateService";
import { notificationService } from "../api/notificationService";
import { EmptyState } from "../components/common/EmptyState";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Pagination } from "../components/tables/Pagination";
import { SearchBar } from "../components/tables/SearchBar";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";

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
  { value: "highest_premium", label: "Highest premium users" },
  { value: "middle_premium", label: "Middle-level premium users" },
  { value: "lowest_premium", label: "Lowest premium users" },
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
  linkUrl: "",
};

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

  return (
    <div className="flex flex-col gap-6">
      <form className={ui.compactPanel} onSubmit={handleSubmit}>
        <div className="mb-4">
          <div className={ui.eyebrow}>Broadcast</div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">Send Notifications</h2>
          <p className={ui.muted}>Send app notifications, emails, or both. Delivery status is stored per user.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <label className={ui.field}>
            <span>Notification Type</span>
            <select className={ui.input} value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>
              {typeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className={ui.field}>
            <span>Audience</span>
            <select className={ui.input} value={form.targetGroup} onChange={(event) => setForm((current) => ({ ...current, targetGroup: event.target.value }))}>
              {targetOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className={ui.field}>
            <span>Send Option</span>
            <select className={ui.input} value={form.deliveryMode} onChange={(event) => setForm((current) => ({ ...current, deliveryMode: event.target.value }))}>
              {deliveryOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className={ui.field}>
            <span>Email Template</span>
            <select className={ui.input} value={form.templateKey} onChange={(event) => setForm((current) => ({ ...current, templateKey: event.target.value }))}>
              <option value="">Auto select by type{autoTemplate ? `: ${autoTemplate.name}` : ""}</option>
              {emailCatalog.map((item) => <option key={item.key} value={item.key}>{item.name} ({item.key})</option>)}
            </select>
          </label>
          <label className={ui.field}>
            <span>Title</span>
            <input className={ui.input} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
          </label>
          <label className={ui.field}>
            <span>Redirect URL</span>
            <input className={ui.input} placeholder="/subscription" value={form.linkUrl} onChange={(event) => setForm((current) => ({ ...current, linkUrl: event.target.value }))} />
          </label>
          <label className={ui.field}>
            <span>Attachment</span>
            <input
              className={ui.input}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={(event) => setAttachment(event.target.files?.[0] || null)}
            />
          </label>
          <label className={cn(ui.field, "lg:col-span-3")}>
            <span>Message</span>
            <textarea className={cn(ui.input, "min-h-28")} value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} />
          </label>
          <label className={cn(ui.field, "lg:col-span-3")}>
            <span>Email Variables (JSON)</span>
            <textarea className={cn(ui.input, "min-h-24")} value={form.variables} onChange={(event) => setForm((current) => ({ ...current, variables: event.target.value }))} />
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={sending} type="submit">
            {sending ? "Sending..." : "Send Notification"}
          </button>
        </div>
      </form>

      <div className={ui.compactPanel}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className={ui.eyebrow}>History</div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Notification Delivery</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <select className={ui.input} value={query.type} onChange={(event) => setQuery({ page: 1, type: event.target.value })}>
              <option value="all">All types</option>
              {typeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <SearchBar value={search} onChange={setSearch} placeholder="Search notifications..." />
          </div>
        </div>
      </div>

      {loading ? <LoadingSpinner label="Loading notifications..." /> : null}
      {!loading && !items.length ? <EmptyState title="No notifications found" description="Broadcast history will appear here." /> : null}

      {!loading && items.length ? (
        <div className={ui.tableWrap}>
          <div className={ui.tableScroll}>
            <table className={ui.table}>
              <thead>
                <tr>
                  <th className={ui.tableHead}>Notification</th>
                  <th className={ui.tableHead}>User</th>
                  <th className={ui.tableHead}>Target</th>
                  <th className={ui.tableHead}>Delivery</th>
                  <th className={ui.tableHead}>Read</th>
                  <th className={ui.tableHead}>Created</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className={ui.tableCell}>
                      <div className="font-bold text-slate-900">{item.title}</div>
                      <div className="max-w-md truncate text-sm text-slate-500">{item.body}</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <span className={ui.pill}>{item.type}</span>
                        {item.attachmentUrl ? <span className={ui.pill}>Attachment</span> : null}
                      </div>
                    </td>
                    <td className={ui.tableCell}>
                      <div className="font-semibold text-slate-900">{item.user?.name || "Learner"}</div>
                      <div className="text-xs text-slate-500">{item.user?.email || item.user?.mobile || item.userId}</div>
                    </td>
                    <td className={ui.tableCell}>{item.targetGroup || "-"}</td>
                    <td className={ui.tableCell}>
                      <div className="flex flex-col gap-1 text-xs font-semibold">
                        <span>App: {item.notificationStatus || "-"}</span>
                        <span>Email: {item.emailStatus || "-"}</span>
                        <span>Push: {item.pushStatus || "-"}</span>
                      </div>
                    </td>
                    <td className={ui.tableCell}>{item.readAt ? "Read" : "Unread"}</td>
                    <td className={ui.tableCell}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onChange={(page) => setQuery((current) => ({ ...current, page }))} />
        </div>
      ) : null}
    </div>
  );
}
