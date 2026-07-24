import { useEffect, useState } from "react";
import { Download, Pause, Play, Plus, Trash2 } from "lucide-react";
import { subscriptionReminderService } from "../api/subscriptionReminderService";
import { EmptyState } from "../components/common/EmptyState";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Pagination } from "../components/tables/Pagination";
import { SearchBar } from "../components/tables/SearchBar";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";

const emptyConfig = {
  reminderName: "",
  status: "enabled",
  channels: "Both",
  initialDelay: 30,
  repeatInterval: 24,
  delayUnit: "Hours",
  maximumReminderCount: 3,
  notificationTitle: "Complete your Krita subscription",
  notificationMessage: "Your premium plan is waiting. Tap to continue your purchase.",
  emailSubject: "Complete your Krita subscription",
  emailTemplate: "<p>Hi {{UserName}},</p><p>Your {{PlanName}} subscription is still available. <a href=\"{{PurchaseLink}}\">Complete your purchase</a>.</p>",
  platform: "Both",
  applicablePlan: "",
  targetUsers: "all",
  priority: 100,
};

function statusBadge(value) {
  if (value === "pending" || value === "enabled" || value === "sent" || value === "Success") {
    return "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase text-emerald-700";
  }
  return "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-600";
}

export function SubscriptionReminderPage() {
  const toast = useToast();
  const [tab, setTab] = useState("configuration");
  const [stats, setStats] = useState(null);
  const [configs, setConfigs] = useState([]);
  const [cancelled, setCancelled] = useState([]);
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [query, setQuery] = useState({ page: 1 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyConfig);

  async function load(activeTab = tab, nextQuery = query) {
    setLoading(true);
    try {
      const [statsResponse, listResponse] = await Promise.all([
        subscriptionReminderService.stats(),
        activeTab === "configuration"
          ? subscriptionReminderService.configurations({ ...nextQuery, search })
          : activeTab === "cancelled"
            ? subscriptionReminderService.cancelledUsers({ ...nextQuery, search })
            : subscriptionReminderService.logs({ ...nextQuery, search }),
      ]);
      setStats(statsResponse.data || null);
      setMeta(listResponse.meta || null);
      if (activeTab === "configuration") setConfigs(listResponse.data || []);
      if (activeTab === "cancelled") setCancelled(listResponse.data || []);
      if (activeTab === "logs") setLogs(listResponse.data || []);
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

  function beginEdit(item = null) {
    setEditing(item || {});
    setForm(item ? { ...emptyConfig, ...item } : emptyConfig);
    setTab("configuration");
  }

  async function save(event) {
    event.preventDefault();
    try {
      if (editing?.id) await subscriptionReminderService.updateConfiguration(editing.id, form);
      else await subscriptionReminderService.createConfiguration(form);
      toast.success(editing?.id ? "Reminder configuration updated" : "Reminder configuration created");
      setEditing(null);
      setForm(emptyConfig);
      await load("configuration", { page: 1 });
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

  function exportCsv() {
    const rows = cancelled.map((item) => {
      const user = item.userId || {};
      return [user.name || "", user.email || "", user.mobile || "", item.subscriptionPlan || "", item.eventTime || item.createdAt || "", item.reminderCount || 0, item.status || "", item.lastReminderDate || "", item.nextReminderDate || ""];
    });
    const csv = [["User", "Email", "Mobile", "Plan", "Cancelled Date", "Reminder Count", "Status", "Last Reminder", "Next Reminder"], ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "subscription-cancelled-users.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className={ui.compactPanel}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className={ui.eyebrow}>Subscription Management</div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Subscription Reminder</h2>
            <p className={ui.muted}>Configure abandonment recovery across push notifications and email.</p>
          </div>
          <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={() => beginEdit()}>
            <Plus size={16} /> New Template
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-6">
          {[
            ["Cancelled Today", stats?.cancelledToday],
            ["Pending", stats?.pendingReminders],
            ["Notifications Today", stats?.notificationSentToday],
            ["Emails Today", stats?.emailSentToday],
            ["Converted", stats?.convertedUsers],
            ["Conversion Rate", `${stats?.conversionRate || 0}%`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</div>
              <div className="mt-1 text-2xl font-black text-slate-950">{value ?? 0}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            ["configuration", "Reminder Configuration"],
            ["cancelled", "Cancelled Users"],
            ["logs", "Reminder Logs"],
            ["statistics", "Statistics"],
          ].map(([key, label]) => (
            <button key={key} className={cn(ui.buttonBase, tab === key ? ui.buttonPrimary : ui.buttonSecondary)} onClick={() => { setTab(key); setQuery({ page: 1 }); }}>{label}</button>
          ))}
        </div>
      </div>

      {editing ? (
        <form className={ui.compactPanel} onSubmit={save}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">{editing?.id ? "Edit Reminder Configuration" : "Create Reminder Configuration"}</h3>
            <button type="button" className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => setEditing(null)}>Close</button>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <label className={ui.field}><span>Reminder Name</span><input className={ui.input} value={form.reminderName} onChange={(e) => setForm({ ...form, reminderName: e.target.value })} /></label>
            <label className={ui.field}><span>Status</span><select className={ui.input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="enabled">Enabled</option><option value="disabled">Disabled</option></select></label>
            <label className={ui.field}><span>Channels</span><select className={ui.input} value={form.channels} onChange={(e) => setForm({ ...form, channels: e.target.value })}><option>Notification</option><option>Email</option><option>Both</option></select></label>
            <label className={ui.field}><span>Initial Delay</span><input className={ui.input} type="number" value={form.initialDelay} onChange={(e) => setForm({ ...form, initialDelay: e.target.value })} /></label>
            <label className={ui.field}><span>Repeat Interval</span><input className={ui.input} type="number" value={form.repeatInterval} onChange={(e) => setForm({ ...form, repeatInterval: e.target.value })} /></label>
            <label className={ui.field}><span>Delay Unit</span><select className={ui.input} value={form.delayUnit} onChange={(e) => setForm({ ...form, delayUnit: e.target.value })}><option>Minutes</option><option>Hours</option><option>Days</option></select></label>
            <label className={ui.field}><span>Maximum Reminder Count</span><input className={ui.input} type="number" value={form.maximumReminderCount} onChange={(e) => setForm({ ...form, maximumReminderCount: e.target.value })} /></label>
            <label className={ui.field}><span>Platform</span><select className={ui.input} value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}><option>Android</option><option>iOS</option><option>Both</option></select></label>
            <label className={ui.field}><span>Priority</span><input className={ui.input} type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} /></label>
            <label className={ui.field}><span>Applicable Plan</span><input className={ui.input} value={form.applicablePlan} onChange={(e) => setForm({ ...form, applicablePlan: e.target.value })} /></label>
            <label className={ui.field}><span>Target Users</span><select className={ui.input} value={form.targetUsers} onChange={(e) => setForm({ ...form, targetUsers: e.target.value })}><option value="all">All</option><option value="free">Free</option><option value="premium">Premium</option><option value="selected">Selected</option></select></label>
            <label className={ui.field}><span>Notification Title</span><input className={ui.input} value={form.notificationTitle} onChange={(e) => setForm({ ...form, notificationTitle: e.target.value })} /></label>
            <label className={cn(ui.field, "lg:col-span-3")}><span>Notification Message</span><textarea className={cn(ui.input, "min-h-24")} value={form.notificationMessage} onChange={(e) => setForm({ ...form, notificationMessage: e.target.value })} /></label>
            <label className={cn(ui.field, "lg:col-span-3")}><span>Email Subject</span><input className={ui.input} value={form.emailSubject} onChange={(e) => setForm({ ...form, emailSubject: e.target.value })} /></label>
            <label className={cn(ui.field, "lg:col-span-3")}><span>Email Template</span><textarea className={cn(ui.input, "min-h-56")} value={form.emailTemplate} onChange={(e) => setForm({ ...form, emailTemplate: e.target.value })} /></label>
            <div className="lg:col-span-3 text-xs font-semibold text-slate-500">Placeholders: {"{{UserName}} {{PlanName}} {{PlanPrice}} {{PurchaseLink}} {{SupportEmail}} {{CurrentDate}} {{ExpiryDate}}"}</div>
          </div>
          <div className="mt-4 flex justify-end"><button className={cn(ui.buttonBase, ui.buttonPrimary)}>Save Configuration</button></div>
        </form>
      ) : null}

      {tab !== "statistics" ? (
        <div className={ui.compactPanel}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search..." />
            {tab === "cancelled" ? <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={exportCsv}><Download size={16} /> Export CSV</button> : null}
          </div>
        </div>
      ) : null}

      {loading ? <LoadingSpinner label="Loading reminders..." /> : null}
      {!loading && tab === "configuration" ? <ConfigurationTable items={configs} onEdit={beginEdit} onAction={action} meta={meta} setQuery={setQuery} /> : null}
      {!loading && tab === "cancelled" ? <CancelledTable items={cancelled} onAction={action} meta={meta} setQuery={setQuery} /> : null}
      {!loading && tab === "logs" ? <LogsTable items={logs} meta={meta} setQuery={setQuery} /> : null}
      {!loading && tab === "statistics" ? <Statistics stats={stats} /> : null}
    </div>
  );
}

function ConfigurationTable({ items, onEdit, onAction, meta, setQuery }) {
  if (!items.length) return <EmptyState title="No reminder configurations" description="Create a template to start recovery automation." />;
  return (
    <div className={ui.tableWrap}><div className={ui.tableScroll}><table className={ui.table}>
      <thead><tr><th className={ui.tableHead}>Reminder</th><th className={ui.tableHead}>Channels</th><th className={ui.tableHead}>Delay</th><th className={ui.tableHead}>Platform</th><th className={ui.tableHead}>Status</th><th className={ui.tableHead}>Actions</th></tr></thead>
      <tbody>{items.map((item) => <tr key={item.id}>
        <td className={ui.tableCell}><div className="font-bold text-slate-900">{item.reminderName}</div><div className="text-xs text-slate-500">Max {item.maximumReminderCount} reminders</div></td>
        <td className={ui.tableCell}>{item.channels}</td><td className={ui.tableCell}>{item.initialDelay} {item.delayUnit}, repeats {item.repeatInterval}</td><td className={ui.tableCell}>{item.platform}</td>
        <td className={ui.tableCell}><span className={statusBadge(item.status)}>{item.status}</span></td>
        <td className={ui.tableCell}><div className="flex flex-wrap gap-2"><button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => onEdit(item)}>Edit</button><button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => onAction(() => subscriptionReminderService.setConfigurationStatus(item.id, item.status === "enabled" ? "disabled" : "enabled"), "Status updated")}>{item.status === "enabled" ? <Pause size={16} /> : <Play size={16} />}</button><button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => window.confirm("Delete this configuration?") && onAction(() => subscriptionReminderService.deleteConfiguration(item.id), "Configuration deleted")}><Trash2 size={16} /></button></div></td>
      </tr>)}</tbody>
    </table></div><Pagination meta={meta} onChange={(page) => setQuery((current) => ({ ...current, page }))} /></div>
  );
}

function CancelledTable({ items, onAction, meta, setQuery }) {
  if (!items.length) return <EmptyState title="No cancelled users" description="Tracked payment abandonment events will appear here." />;
  return (
    <div className={ui.tableWrap}><div className={ui.tableScroll}><table className={ui.table}>
      <thead><tr><th className={ui.tableHead}>User</th><th className={ui.tableHead}>Plan</th><th className={ui.tableHead}>Cancelled Date</th><th className={ui.tableHead}>Reminder Count</th><th className={ui.tableHead}>Purchase Status</th><th className={ui.tableHead}>Last Reminder</th><th className={ui.tableHead}>Next Reminder</th><th className={ui.tableHead}>Actions</th></tr></thead>
      <tbody>{items.map((item) => { const user = item.userId || {}; return <tr key={item.id}>
        <td className={ui.tableCell}><div className="font-bold text-slate-900">{user.name || "Learner"}</div><div className="text-xs text-slate-500">{user.email || user.mobile || item.userId}</div></td>
        <td className={ui.tableCell}>{item.subscriptionPlan || "-"}</td><td className={ui.tableCell}>{item.eventTime ? new Date(item.eventTime).toLocaleString() : "-"}</td><td className={ui.tableCell}>{item.reminderCount || 0}</td>
        <td className={ui.tableCell}><span className={statusBadge(item.status)}>{item.purchaseCompleted ? "Purchased" : item.status}</span></td><td className={ui.tableCell}>{item.lastReminderDate ? new Date(item.lastReminderDate).toLocaleString() : "-"}</td><td className={ui.tableCell}>{item.nextReminderDate ? new Date(item.nextReminderDate).toLocaleString() : "-"}</td>
        <td className={ui.tableCell}><div className="flex flex-wrap gap-2"><button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => onAction(() => subscriptionReminderService.stop(item.id), "Reminder stopped")}>Stop</button><button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => onAction(() => subscriptionReminderService.restart(item.id), "Reminder restarted")}>Restart</button></div></td>
      </tr>; })}</tbody>
    </table></div><Pagination meta={meta} onChange={(page) => setQuery((current) => ({ ...current, page }))} /></div>
  );
}

function LogsTable({ items, meta, setQuery }) {
  if (!items.length) return <EmptyState title="No reminder logs" description="Scheduler delivery attempts will appear here." />;
  return (
    <div className={ui.tableWrap}><div className={ui.tableScroll}><table className={ui.table}>
      <thead><tr><th className={ui.tableHead}>User</th><th className={ui.tableHead}>Notification Status</th><th className={ui.tableHead}>Email Status</th><th className={ui.tableHead}>Date</th><th className={ui.tableHead}>Error</th><th className={ui.tableHead}>Retry Count</th></tr></thead>
      <tbody>{items.map((item) => { const user = item.userId || {}; return <tr key={item.id}><td className={ui.tableCell}><div className="font-bold text-slate-900">{user.name || "Learner"}</div><div className="text-xs text-slate-500">{user.email || user.mobile || item.userId}</div></td><td className={ui.tableCell}>{item.notificationStatus}</td><td className={ui.tableCell}>{item.emailStatus}</td><td className={ui.tableCell}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}</td><td className={ui.tableCell}>{item.errorMessage || "-"}</td><td className={ui.tableCell}>{item.retryCount || 0}</td></tr>; })}</tbody>
    </table></div><Pagination meta={meta} onChange={(page) => setQuery((current) => ({ ...current, page }))} /></div>
  );
}

function Statistics({ stats }) {
  const bars = [
    ["Daily Cancellation", stats?.cancelledToday || 0],
    ["Daily Conversion", stats?.convertedUsers || 0],
    ["Notification Success", stats?.notificationSentToday || 0],
    ["Email Success", stats?.emailSentToday || 0],
    ["Recovery Percentage", stats?.conversionRate || 0],
  ];
  const max = Math.max(1, ...bars.map(([, value]) => Number(value || 0)));
  return <div className={ui.compactPanel}><div className="space-y-4">{bars.map(([label, value]) => <div key={label}><div className="mb-1 flex justify-between text-sm font-bold text-slate-700"><span>{label}</span><span>{value}{label.includes("Percentage") ? "%" : ""}</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-sky-600" style={{ width: `${Math.min(100, (Number(value || 0) / max) * 100)}%` }} /></div></div>)}</div></div>;
}
