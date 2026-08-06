import { useEffect, useMemo, useState } from "react";
import { Bell, Mail, Pause, Play, Plus, Save, Trash2 } from "lucide-react";
import { subscriptionReminderService } from "../api/subscriptionReminderService";
import { EmptyState } from "../components/common/EmptyState";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Pagination } from "../components/tables/Pagination";
import { SearchBar } from "../components/tables/SearchBar";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";

const defaultReminders = [
  {
    id: "immediate",
    name: "Immediate Reminder",
    enabled: true,
    delayAmount: 0,
    delayUnit: "Minutes",
    push: {
      title: "Your Premium Access Is Waiting",
      message: "Complete your Rs.499 purchase and unlock premium MCQs, PYQs and mock tests.",
      ctaText: "Complete Purchase",
      ctaAction: "/subscription",
    },
    email: {
      subject: "Complete your Krita Premium purchase",
      body: "<p>Hi {{StudentName}},</p><p>Your Krita Premium access is waiting. Complete your purchase to continue your preparation.</p><p>Best wishes,<br/>Team Krita</p>",
      ctaText: "Complete Purchase",
      ctaUrl: "/subscription",
    },
  },
  {
    id: "after-24-hours",
    name: "24 Hours Reminder",
    enabled: true,
    delayAmount: 24,
    delayUnit: "Hours",
    push: {
      title: "Still Thinking About Premium?",
      message: "Your Premium practice plan is still waiting. Complete your subscription and keep learning.",
      ctaText: "Unlock Premium",
      ctaAction: "/subscription",
    },
    email: {
      subject: "Your Premium subscription is still waiting",
      body: "<p>Hi {{StudentName}},</p><p>You can still complete your Krita Premium purchase and continue practising without interruption.</p><p>Best wishes,<br/>Team Krita</p>",
      ctaText: "Complete Purchase",
      ctaUrl: "/subscription",
    },
  },
];

const emptyConfig = {
  reminderName: "Subscription Reminder",
  status: "enabled",
  platform: "Both",
  applicablePlan: "Premium",
  priority: 100,
  reminders: defaultReminders,
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeConfig(item) {
  if (!item) return clone(emptyConfig);
  const reminders = Array.isArray(item.reminders) && item.reminders.length ? item.reminders : defaultReminders;
  return {
    ...emptyConfig,
    ...item,
    reminders: reminders.map((reminder, index) => ({
      ...defaultReminders[index % defaultReminders.length],
      ...reminder,
      push: { ...defaultReminders[index % defaultReminders.length].push, ...(reminder.push || {}) },
      email: { ...defaultReminders[index % defaultReminders.length].email, ...(reminder.email || {}) },
    })),
  };
}

function badge(value) {
  return cn(
    "inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase",
    ["enabled", "sent", "pending"].includes(value) ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600",
  );
}

export function SubscriptionReminderCenterPage() {
  const toast = useToast();
  const [tab, setTab] = useState("configurations");
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [query, setQuery] = useState({ page: 1 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(() => clone(emptyConfig));

  async function load(activeTab = tab, nextQuery = query) {
    setLoading(true);
    try {
      const [statsResponse, listResponse] = await Promise.all([
        subscriptionReminderService.stats(),
        activeTab === "jobs"
          ? subscriptionReminderService.cancelledUsers({ ...nextQuery, search })
          : activeTab === "logs"
            ? subscriptionReminderService.logs({ ...nextQuery, search })
            : subscriptionReminderService.configurations({ ...nextQuery, search }),
      ]);
      setStats(statsResponse.data || null);
      setItems(listResponse.data || []);
      setMeta(listResponse.meta || null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(tab, query);
  }, [tab, query.page]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = { page: 1 };
      setQuery(next);
      void load(tab, next);
    }, 350);
    return () => window.clearTimeout(id);
  }, [search]);

  const enabledCount = useMemo(() => form.reminders.filter((item) => item.enabled !== false).length, [form.reminders]);

  function beginEdit(item = null) {
    setEditing(item || {});
    setForm(normalizeConfig(item));
    setTab("configurations");
  }

  async function save(event) {
    event.preventDefault();
    try {
      const payload = { ...form, maximumReminderCount: enabledCount };
      if (editing?.id) await subscriptionReminderService.updateConfiguration(editing.id, payload);
      else await subscriptionReminderService.createConfiguration(payload);
      toast.success(editing?.id ? "Subscription reminder updated" : "Subscription reminder created");
      setEditing(null);
      setForm(clone(emptyConfig));
      await load("configurations", { page: 1 });
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function action(fn, message) {
    try {
      await fn();
      toast.success(message);
      await load(tab, query);
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className={ui.compactPanel}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className={ui.eyebrow}>Notification Delivery</div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Subscription Reminder</h2>
            <p className={ui.muted}>Independent payment recovery automation using the same push, email, history, and FCM delivery flow as Notification Center.</p>
          </div>
          <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={() => beginEdit()}>
            <Plus size={16} /> Create Reminder
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[["Created Today", stats?.cancelledToday], ["Pending Jobs", stats?.pendingReminders], ["Push Today", stats?.notificationSentToday], ["Emails Today", stats?.emailSentToday], ["Converted", stats?.convertedUsers]].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</div>
              <div className="mt-1 text-2xl font-black text-slate-950">{value ?? 0}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {[["configurations", "Configurations"], ["jobs", "Reminder Jobs"], ["logs", "Delivery Logs"]].map(([key, label]) => (
            <button key={key} className={cn(ui.buttonBase, tab === key ? ui.buttonPrimary : ui.buttonSecondary)} onClick={() => { setTab(key); setQuery({ page: 1 }); }}>{label}</button>
          ))}
        </div>
      </div>

      {editing ? <ReminderForm form={form} setForm={setForm} editing={editing} onClose={() => setEditing(null)} onSave={save} /> : null}

      <div className={ui.compactPanel}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search subscription reminders..." />
      </div>

      {loading ? <LoadingSpinner label="Loading subscription reminders..." /> : null}
      {!loading && tab === "configurations" ? <ConfigurationTable items={items} onEdit={beginEdit} onAction={action} meta={meta} setQuery={setQuery} /> : null}
      {!loading && tab === "jobs" ? <JobTable items={items} onAction={action} meta={meta} setQuery={setQuery} /> : null}
      {!loading && tab === "logs" ? <LogTable items={items} meta={meta} setQuery={setQuery} /> : null}
    </div>
  );
}

function ReminderForm({ form, setForm, editing, onClose, onSave }) {
  function patch(path, value) {
    const next = clone(form);
    const keys = path.split(".");
    let current = next;
    keys.slice(0, -1).forEach((key) => {
      current[key] ??= {};
      current = current[key];
    });
    current[keys.at(-1)] = value;
    setForm(next);
  }

  function patchReminder(index, path, value) {
    const next = clone(form);
    const keys = path.split(".");
    let current = next.reminders[index];
    keys.slice(0, -1).forEach((key) => {
      current[key] ??= {};
      current = current[key];
    });
    current[keys.at(-1)] = value;
    setForm(next);
  }

  function addReminder() {
    setForm({
      ...form,
      reminders: [
        ...form.reminders,
        {
          ...clone(defaultReminders[1]),
          id: `reminder-${Date.now()}`,
          name: `Reminder ${form.reminders.length + 1}`,
          delayAmount: 48,
          delayUnit: "Hours",
        },
      ],
    });
  }

  function removeReminder(index) {
    setForm({ ...form, reminders: form.reminders.filter((_, itemIndex) => itemIndex !== index) });
  }

  return (
    <form className={ui.compactPanel} onSubmit={onSave}>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900">{editing?.id ? "Update Reminder" : "Create Reminder"}</h3>
          <p className={ui.muted}>Push notifications are also saved to the app Notification screen/history.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={addReminder}><Plus size={16} /> Add Stage</button>
          <button type="button" className={cn(ui.buttonBase, ui.buttonGhost)} onClick={onClose}>Close</button>
          <button className={cn(ui.buttonBase, ui.buttonPrimary)}><Save size={16} /> Save</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Field label="Reminder Name" value={form.reminderName} onChange={(value) => patch("reminderName", value)} />
        <Select label="Status" value={form.status} options={["enabled", "disabled"]} onChange={(value) => patch("status", value)} />
        <Select label="Platform" value={form.platform} options={["Both", "Android", "iOS", "Web"]} onChange={(value) => patch("platform", value)} />
        <Field label="Priority" type="number" value={form.priority} onChange={(value) => patch("priority", Number(value || 0))} />
      </div>

      <div className="mt-6 space-y-5">
        {form.reminders.map((reminder, index) => (
          <div key={reminder.id || index} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="grid flex-1 gap-3 lg:grid-cols-[auto_1fr]">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <input className={ui.checkbox} type="checkbox" checked={reminder.enabled !== false} onChange={(event) => patchReminder(index, "enabled", event.target.checked)} />
                  Enabled
                </label>
                <Field label="Stage Name" value={reminder.name} onChange={(value) => patchReminder(index, "name", value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-[120px_140px_auto]">
                <Field label="Delay" type="number" value={reminder.delayAmount} onChange={(value) => patchReminder(index, "delayAmount", Number(value || 0))} />
                <Select label="Unit" value={reminder.delayUnit} options={["Minutes", "Hours", "Days"]} onChange={(value) => patchReminder(index, "delayUnit", value)} />
                {form.reminders.length > 1 ? <button type="button" className={cn(ui.buttonBase, ui.buttonDanger, "self-end")} onClick={() => removeReminder(index)}><Trash2 size={16} /></button> : null}
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-700"><Bell size={16} /> Push and In-App</h4>
                <div className="grid gap-3 lg:grid-cols-2">
                  <Field label="Title" value={reminder.push.title} onChange={(value) => patchReminder(index, "push.title", value)} />
                  <Field label="CTA Text" value={reminder.push.ctaText} onChange={(value) => patchReminder(index, "push.ctaText", value)} />
                  <Textarea label="Message" value={reminder.push.message} onChange={(value) => patchReminder(index, "push.message", value)} />
                  <Field label="CTA Action" value={reminder.push.ctaAction} onChange={(value) => patchReminder(index, "push.ctaAction", value)} />
                </div>
              </section>
              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-700"><Mail size={16} /> Email</h4>
                <div className="grid gap-3 lg:grid-cols-2">
                  <Field label="Subject" value={reminder.email.subject} onChange={(value) => patchReminder(index, "email.subject", value)} />
                  <Field label="CTA Text" value={reminder.email.ctaText} onChange={(value) => patchReminder(index, "email.ctaText", value)} />
                  <Field label="CTA URL" value={reminder.email.ctaUrl} onChange={(value) => patchReminder(index, "email.ctaUrl", value)} />
                  <Field label="Template Key" value={reminder.email.templateKey} onChange={(value) => patchReminder(index, "email.templateKey", value)} />
                  <Textarea label="Body HTML" value={reminder.email.body} onChange={(value) => patchReminder(index, "email.body", value)} rows={8} />
                </div>
              </section>
            </div>
          </div>
        ))}
      </div>
    </form>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return <label className={ui.field}><span>{label}</span><input className={ui.input} type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Textarea({ label, value, onChange, rows = 4 }) {
  return <label className={cn(ui.field, "lg:col-span-2")}><span>{label}</span><textarea className={ui.textarea} rows={rows} value={value ?? ""} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Select({ label, value, options, onChange }) {
  return <label className={ui.field}><span>{label}</span><select className={ui.input} value={value ?? ""} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function ConfigurationTable({ items, onEdit, onAction, meta, setQuery }) {
  if (!items.length) return <EmptyState title="No subscription reminders" description="Create a reminder configuration to start automatic recovery." />;
  return (
    <div className={ui.tableWrap}><div className={ui.tableScroll}><table className={ui.table}>
      <thead><tr><th className={ui.tableHead}>Name</th><th className={ui.tableHead}>Stages</th><th className={ui.tableHead}>Status</th><th className={ui.tableHead}>Actions</th></tr></thead>
      <tbody>{items.map((item) => <tr key={item.id}>
        <td className={ui.tableCell}><div className="font-bold text-slate-900">{item.reminderName}</div><div className="text-xs text-slate-500">{item.platform || "Both"}</div></td>
        <td className={ui.tableCell}>{normalizeConfig(item).reminders.map((reminder) => `${reminder.name}: ${reminder.delayAmount} ${reminder.delayUnit}`).join("; ")}</td>
        <td className={ui.tableCell}><span className={badge(item.status)}>{item.status}</span></td>
        <td className={ui.tableCell}><div className="flex flex-wrap gap-2">
          <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => onEdit(item)}>Edit</button>
          <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => onAction(() => subscriptionReminderService.setConfigurationStatus(item.id, item.status === "enabled" ? "disabled" : "enabled"), "Status updated")}>{item.status === "enabled" ? <Pause size={16} /> : <Play size={16} />}</button>
          <button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => window.confirm("Delete this subscription reminder?") && onAction(() => subscriptionReminderService.deleteConfiguration(item.id), "Deleted")}>
            <Trash2 size={16} />
          </button>
        </div></td>
      </tr>)}</tbody>
    </table></div><Pagination meta={meta} onChange={(page) => setQuery((current) => ({ ...current, page }))} /></div>
  );
}

function JobTable({ items, onAction, meta, setQuery }) {
  if (!items.length) return <EmptyState title="No reminder jobs" description="A failed, cancelled, or abandoned payment will create immediate and scheduled jobs here." />;
  return (
    <div className={ui.tableWrap}><div className={ui.tableScroll}><table className={ui.table}>
      <thead><tr><th className={ui.tableHead}>User</th><th className={ui.tableHead}>Stage</th><th className={ui.tableHead}>Due</th><th className={ui.tableHead}>Status</th><th className={ui.tableHead}>Actions</th></tr></thead>
      <tbody>{items.map((item) => { const user = item.userId || {}; return <tr key={item.id}>
        <td className={ui.tableCell}><div className="font-bold text-slate-900">{user.name || "Learner"}</div><div className="text-xs text-slate-500">{user.email || user.mobile || item.userId}</div></td>
        <td className={ui.tableCell}>{item.stageName || item.stageId}</td>
        <td className={ui.tableCell}>{item.dueAt ? new Date(item.dueAt).toLocaleString() : "-"}</td>
        <td className={ui.tableCell}><span className={badge(item.status)}>{item.purchaseCompleted ? "completed" : item.status}</span></td>
        <td className={ui.tableCell}><div className="flex flex-wrap gap-2">
          <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => onAction(() => subscriptionReminderService.stop(item.id), "Reminder stopped")}>Stop</button>
          <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => onAction(() => subscriptionReminderService.restart(item.id), "Reminder restarted")}>Restart</button>
        </div></td>
      </tr>; })}</tbody>
    </table></div><Pagination meta={meta} onChange={(page) => setQuery((current) => ({ ...current, page }))} /></div>
  );
}

function LogTable({ items, meta, setQuery }) {
  if (!items.length) return <EmptyState title="No delivery logs" description="Push, email, and notification-history delivery attempts will appear here." />;
  return (
    <div className={ui.tableWrap}><div className={ui.tableScroll}><table className={ui.table}>
      <thead><tr><th className={ui.tableHead}>User</th><th className={ui.tableHead}>Stage</th><th className={ui.tableHead}>Push</th><th className={ui.tableHead}>Email</th><th className={ui.tableHead}>Date</th><th className={ui.tableHead}>Error</th></tr></thead>
      <tbody>{items.map((item) => { const user = item.userId || {}; return <tr key={item.id}>
        <td className={ui.tableCell}><div className="font-bold text-slate-900">{user.name || "Learner"}</div><div className="text-xs text-slate-500">{user.email || user.mobile || item.userId}</div></td>
        <td className={ui.tableCell}>{item.stageName || item.stageId}</td>
        <td className={ui.tableCell}>{item.pushStatus || "-"}</td>
        <td className={ui.tableCell}>{item.emailStatus || "-"}</td>
        <td className={ui.tableCell}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}</td>
        <td className={ui.tableCell}>{item.errorMessage || "-"}</td>
      </tr>; })}</tbody>
    </table></div><Pagination meta={meta} onChange={(page) => setQuery((current) => ({ ...current, page }))} /></div>
  );
}
