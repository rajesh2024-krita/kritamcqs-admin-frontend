import { useEffect, useMemo, useState } from "react";
import { Download, Eye, Pause, Play, Plus, Save, Trash2 } from "lucide-react";
import { subscriptionReminderService } from "../api/subscriptionReminderService";
import { EmptyState } from "../components/common/EmptyState";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Pagination } from "../components/tables/Pagination";
import { SearchBar } from "../components/tables/SearchBar";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";

const deepLinkHint = "Use /subscription for app routing, https://app.kritamcqs.com/cta?target=%2Fsubscription for email/store fallback, or kritamcqs://subscription for app-only deep links.";

const defaultReminders = [
  {
    id: "immediate",
    name: "Reminder 1 - Immediate",
    enabled: true,
    delayAmount: 0,
    delayUnit: "Minutes",
    push: {
      title: "Your Premium Access Is Waiting",
      message: "Complete your ₹499 purchase and unlock 6 months of 7,000+ MCQs, PYQs and weekly NEET/JEE-pattern mock tests.",
      ctaText: "Complete Purchase",
      ctaAction: "/subscription",
    },
    email: {
      subject: "Continue Your NEET/JEE Preparation",
      body: `<p>Hi {{StudentName}},</p><p>You were close to activating Krita NEET JEE Premium, but your purchase was not completed.</p><p>Get 6 months of complete Premium access for ₹499 and continue preparing with:</p><ul><li>7,000+ NEET and JEE MCQs</li><li>Last 10 years' previous-year questions</li><li>Chapter-wise and topic-wise practice</li><li>Detailed answers and clear explanations</li><li>Weak-area identification and progress tracking</li><li>Weekly mock tests following the NEET/JEE exam pattern</li></ul><p>That works out to approximately ₹83 per month for complete exam-focused practice.</p><p>Don't stop after identifying your weak chapters. Practise them, improve your accuracy and track your progress regularly.</p><p>Your Premium access will be activated after successful payment.</p><p>Best wishes,<br/>Team Krita NEET JEE</p>`,
      ctaText: "Complete My ₹499 Purchase",
      ctaUrl: "/subscription",
    },
  },
  {
    id: "after-24-hours",
    name: "Reminder 2 - After 24 Hours",
    enabled: true,
    delayAmount: 24,
    delayUnit: "Hours",
    push: {
      title: "Improve Your Weak NEET Topics",
      message: "Don't stop after identifying your weak chapters. Unlock complete practice, PYQs and weekly mock tests for ₹499 for 6 months.",
      ctaText: "Unlock Premium",
      ctaAction: "/subscription",
    },
    email: {
      subject: "Continue Your NEET/JEE Preparation",
      body: `<p>Hi {{StudentName}},</p><p>Your Krita NEET JEE Premium access is still waiting. Complete your ₹499 purchase to unlock MCQs, PYQs, weak-area tracking and weekly NEET/JEE-pattern mock tests.</p><p>Keep practising your weak chapters and track your progress regularly.</p><p>Best wishes,<br/>Team Krita NEET JEE</p>`,
      ctaText: "Complete My ₹499 Purchase",
      ctaUrl: "/subscription",
    },
  },
];

const emptyConfig = {
  reminderName: "Premium Checkout Recovery",
  status: "enabled",
  channels: "Both",
  platform: "Both",
  applicablePlan: "Premium ₹499 / 6 Months",
  targetUsers: "all",
  priority: 100,
  maximumReminderCount: 2,
  reminders: defaultReminders,
};

const emptyFreeUserCta = {
  enabled: true,
  eyebrow: "NEET & JEE Unlock",
  title: "Go Premium",
  description: "Unlock unlimited questions, weak area analysis, and smart revision.",
  imageUrl: "",
  ctaText: "View Plans",
  ctaLink: "/subscription",
};

function normalizeForm(item) {
  if (!item) return structuredClone(emptyConfig);
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

function statusBadge(value) {
  if (["pending", "enabled", "sent", "Success"].includes(value)) return "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase text-emerald-700";
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
  const [form, setForm] = useState(() => structuredClone(emptyConfig));
  const [freeUserCta, setFreeUserCta] = useState(emptyFreeUserCta);

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

  async function loadFreeUserCta() {
    try {
      const response = await subscriptionReminderService.freeUserCta();
      setFreeUserCta({ ...emptyFreeUserCta, ...(response.data || {}) });
    } catch (error) {
      toast.error(error.message);
    }
  }

  useEffect(() => {
    void load(tab, query);
  }, [tab, query.page]);

  useEffect(() => {
    void loadFreeUserCta();
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = { page: 1 };
      setQuery(next);
      void load(tab, next);
    }, 350);
    return () => window.clearTimeout(id);
  }, [search]);

  const enabledReminderCount = useMemo(() => form.reminders.filter((item) => item.enabled !== false).length, [form.reminders]);

  function beginEdit(item = null) {
    setEditing(item || {});
    setForm(normalizeForm(item));
    setTab("configuration");
  }

  async function save(event) {
    event.preventDefault();
    const payload = { ...form, maximumReminderCount: enabledReminderCount || form.maximumReminderCount || 1 };
    try {
      if (editing?.id) await subscriptionReminderService.updateConfiguration(editing.id, payload);
      else await subscriptionReminderService.createConfiguration(payload);
      toast.success(editing?.id ? "Reminder configuration updated" : "Reminder configuration created");
      setEditing(null);
      setForm(structuredClone(emptyConfig));
      await load("configuration", { page: 1 });
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function saveFreeUserCta(event) {
    event.preventDefault();
    try {
      const response = await subscriptionReminderService.saveFreeUserCta(freeUserCta);
      setFreeUserCta({ ...emptyFreeUserCta, ...(response.data || {}) });
      toast.success("Free user subscription CTA saved");
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
            <p className={ui.muted}>Configure abandoned checkout recovery with push notifications and email templates.</p>
          </div>
          <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={() => beginEdit()}>
            <Plus size={16} /> New Template
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-6">
          {[["Cancelled Today", stats?.cancelledToday], ["Pending", stats?.pendingReminders], ["Push Today", stats?.notificationSentToday], ["Emails Today", stats?.emailSentToday], ["Converted", stats?.convertedUsers], ["Conversion Rate", `${stats?.conversionRate || 0}%`]].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</div>
              <div className="mt-1 text-2xl font-black text-slate-950">{value ?? 0}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {[["configuration", "Reminder Configuration"], ["cancelled", "Cancelled Users"], ["logs", "Reminder Logs"], ["statistics", "Statistics"]].map(([key, label]) => (
            <button key={key} className={cn(ui.buttonBase, tab === key ? ui.buttonPrimary : ui.buttonSecondary)} onClick={() => { setTab(key); setQuery({ page: 1 }); }}>{label}</button>
          ))}
        </div>
      </div>

      <form className={ui.compactPanel} onSubmit={saveFreeUserCta}>
        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className={ui.eyebrow}>Dashboard Premium CTA</div>
            <h3 className="text-lg font-black text-slate-900">Free User Subscription Card</h3>
            <p className={ui.muted}>Shown below the Daily Test card only for free users. Tapping it opens subscription plans.</p>
          </div>
          <button className={cn(ui.buttonBase, ui.buttonPrimary)}><Save size={16} /> Save CTA</button>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Select label="Status" value={freeUserCta.enabled ? "enabled" : "disabled"} options={["enabled", "disabled"]} onChange={(value) => setFreeUserCta((current) => ({ ...current, enabled: value === "enabled" }))} />
          <Field label="Eyebrow" value={freeUserCta.eyebrow} onChange={(value) => setFreeUserCta((current) => ({ ...current, eyebrow: value }))} />
          <Field label="Title" value={freeUserCta.title} onChange={(value) => setFreeUserCta((current) => ({ ...current, title: value }))} />
          <Textarea label="Description" value={freeUserCta.description} onChange={(value) => setFreeUserCta((current) => ({ ...current, description: value }))} />
          <Field label="Image URL" value={freeUserCta.imageUrl} onChange={(value) => setFreeUserCta((current) => ({ ...current, imageUrl: value }))} />
          <Field label="CTA Text" value={freeUserCta.ctaText} onChange={(value) => setFreeUserCta((current) => ({ ...current, ctaText: value }))} />
          <Field label="CTA Link" value={freeUserCta.ctaLink} onChange={(value) => setFreeUserCta((current) => ({ ...current, ctaLink: value }))} />
        </div>
      </form>

      {editing ? <ReminderForm form={form} setForm={setForm} editing={editing} onClose={() => setEditing(null)} onSave={save} /> : null}

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

function ReminderForm({ form, setForm, editing, onClose, onSave }) {
  function patch(path, value) {
    const keys = path.split(".");
    const next = structuredClone(form);
    let current = next;
    keys.slice(0, -1).forEach((key) => {
      current[key] ??= {};
      current = current[key];
    });
    current[keys.at(-1)] = value;
    setForm(next);
  }

  function patchReminder(index, path, value) {
    const next = structuredClone(form);
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
          ...structuredClone(defaultReminders[1]),
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
          <h3 className="text-lg font-black text-slate-900">{editing?.id ? "Edit Reminder Configuration" : "Create Reminder Configuration"}</h3>
          <p className="mt-1 text-sm text-slate-500">{deepLinkHint}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={addReminder}><Plus size={16} /> Add Reminder</button>
          <button type="button" className={cn(ui.buttonBase, ui.buttonGhost)} onClick={onClose}>Close</button>
          <button className={cn(ui.buttonBase, ui.buttonPrimary)}><Save size={16} /> Save Configuration</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Field label="Configuration Name" value={form.reminderName} onChange={(value) => patch("reminderName", value)} />
        <Select label="Status" value={form.status} options={["enabled", "disabled"]} onChange={(value) => patch("status", value)} />
        <Select label="Platform" value={form.platform} options={["Android", "iOS", "Both"]} onChange={(value) => patch("platform", value)} />
        <Field label="Priority" type="number" value={form.priority} onChange={(value) => patch("priority", Number(value || 0))} />
        <Field label="Applicable Plan" value={form.applicablePlan} onChange={(value) => patch("applicablePlan", value)} />
        <Select label="Target Users" value={form.targetUsers} options={["all", "free", "premium", "selected"]} onChange={(value) => patch("targetUsers", value)} />
      </div>

      <div className="mt-6 space-y-5">
        {form.reminders.map((reminder, index) => (
          <div key={reminder.id || index} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <input className={ui.checkbox} type="checkbox" checked={reminder.enabled !== false} onChange={(event) => patchReminder(index, "enabled", event.target.checked)} />
                <Field label="Reminder Name" value={reminder.name} onChange={(value) => patchReminder(index, "name", value)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Field label="Delay" type="number" value={reminder.delayAmount} onChange={(value) => patchReminder(index, "delayAmount", Number(value || 0))} />
                <Select label="Delay Unit" value={reminder.delayUnit} options={["Minutes", "Hours", "Days"]} onChange={(value) => patchReminder(index, "delayUnit", value)} />
                {form.reminders.length > 1 ? <button type="button" className={cn(ui.buttonBase, ui.buttonDanger, "self-end")} onClick={() => removeReminder(index)}><Trash2 size={16} /></button> : null}
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <TemplateSection title="Push Notification" reminder={reminder.push} onChange={(field, value) => patchReminder(index, `push.${field}`, value)} ctaLabel="CTA Action / Deep Link" />
                <EmailSection reminder={reminder.email} onChange={(field, value) => patchReminder(index, `email.${field}`, value)} />
              </div>
              <PreviewPanel reminder={reminder} />
            </div>
          </div>
        ))}
      </div>
    </form>
  );
}

function TemplateSection({ title, reminder, onChange, ctaLabel }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-700">{title}</h4>
      <div className="grid gap-3 lg:grid-cols-2">
        <Field label="Title" value={reminder.title} onChange={(value) => onChange("title", value)} />
        <Field label="CTA Button Text" value={reminder.ctaText} onChange={(value) => onChange("ctaText", value)} />
        <Textarea label="Message" value={reminder.message} onChange={(value) => onChange("message", value)} />
        <Field label={ctaLabel} value={reminder.ctaAction} onChange={(value) => onChange("ctaAction", value)} />
      </div>
    </div>
  );
}

function EmailSection({ reminder, onChange }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-700">Email</h4>
      <div className="grid gap-3 lg:grid-cols-2">
        <Field label="Subject" value={reminder.subject} onChange={(value) => onChange("subject", value)} />
        <Field label="CTA Button Text" value={reminder.ctaText} onChange={(value) => onChange("ctaText", value)} />
        <Field label="CTA URL / Deep Link" value={reminder.ctaUrl} onChange={(value) => onChange("ctaUrl", value)} />
        <Textarea label="Email Body (Rich Text / HTML)" value={reminder.body} onChange={(value) => onChange("body", value)} rows={10} />
        <p className="text-xs font-semibold text-slate-500 lg:col-span-2">Placeholders: {"{{StudentName}} {{UserName}} {{PlanName}} {{PlanPrice}} {{PurchaseLink}} {{SupportEmail}}"}</p>
      </div>
    </div>
  );
}

function PreviewPanel({ reminder }) {
  return (
    <div className="sticky top-24 h-fit rounded-lg border border-sky-100 bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900"><Eye size={16} /> Preview</div>
      <div className="space-y-4">
        <PreviewCard title="Push and Notification Center" headline={reminder.push.title} message={reminder.push.message} cta={reminder.push.ctaText} compact />
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-black uppercase tracking-wider text-slate-500">Email</div>
          <h5 className="mt-2 text-sm font-black text-slate-950">{reminder.email.subject}</h5>
          <div className="prose prose-sm mt-3 max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: reminder.email.body || "<p>Email body preview</p>" }} />
          <div className="mt-3 inline-flex rounded-lg bg-sky-600 px-4 py-2 text-xs font-black text-white">{reminder.email.ctaText}</div>
        </div>
      </div>
    </div>
  );
}

function PreviewCard({ title, headline, message, cta, compact = false }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-black uppercase tracking-wider text-slate-500">{title}</div>
      <h5 className="mt-2 text-sm font-black text-slate-950">{headline}</h5>
      <p className={cn("mt-1 text-sm text-slate-600", compact && "line-clamp-3")}>{message}</p>
      <div className="mt-3 inline-flex rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-black text-white">{cta}</div>
    </div>
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
  if (!items.length) return <EmptyState title="No reminder configurations" description="Create a template to start recovery automation." />;
  return (
    <div className={ui.tableWrap}><div className={ui.tableScroll}><table className={ui.table}>
      <thead><tr><th className={ui.tableHead}>Reminder</th><th className={ui.tableHead}>Templates</th><th className={ui.tableHead}>Timing</th><th className={ui.tableHead}>Platform</th><th className={ui.tableHead}>Status</th><th className={ui.tableHead}>Actions</th></tr></thead>
      <tbody>{items.map((item) => {
        const reminders = normalizeForm(item).reminders;
        return <tr key={item.id}>
          <td className={ui.tableCell}><div className="font-bold text-slate-900">{item.reminderName}</div><div className="text-xs text-slate-500">Max {item.maximumReminderCount || reminders.length} reminders</div></td>
          <td className={ui.tableCell}>{reminders.filter((reminder) => reminder.enabled !== false).length} active templates</td>
          <td className={ui.tableCell}>{reminders.map((reminder) => `${reminder.name}: ${reminder.delayAmount} ${reminder.delayUnit}`).join("; ")}</td>
          <td className={ui.tableCell}>{item.platform}</td>
          <td className={ui.tableCell}><span className={statusBadge(item.status)}>{item.status}</span></td>
          <td className={ui.tableCell}><div className="flex flex-wrap gap-2"><button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => onEdit(item)}>Edit</button><button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => onAction(() => subscriptionReminderService.setConfigurationStatus(item.id, item.status === "enabled" ? "disabled" : "enabled"), "Status updated")}>{item.status === "enabled" ? <Pause size={16} /> : <Play size={16} />}</button><button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => window.confirm("Delete this configuration?") && onAction(() => subscriptionReminderService.deleteConfiguration(item.id), "Configuration deleted")}><Trash2 size={16} /></button></div></td>
        </tr>;
      })}</tbody>
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
  const bars = [["Daily Cancellation", stats?.cancelledToday || 0], ["Daily Conversion", stats?.convertedUsers || 0], ["Push Success", stats?.notificationSentToday || 0], ["Email Success", stats?.emailSentToday || 0], ["Recovery Percentage", stats?.conversionRate || 0]];
  const max = Math.max(1, ...bars.map(([, value]) => Number(value || 0)));
  return <div className={ui.compactPanel}><div className="space-y-4">{bars.map(([label, value]) => <div key={label}><div className="mb-1 flex justify-between text-sm font-bold text-slate-700"><span>{label}</span><span>{value}{label.includes("Percentage") ? "%" : ""}</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-sky-600" style={{ width: `${Math.min(100, (Number(value || 0) / max) * 100)}%` }} /></div></div>)}</div></div>;
}
