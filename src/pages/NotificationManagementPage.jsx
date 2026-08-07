import { useEffect, useState } from "react";
import { Bell, Image, Plus, Save, Trash2, Upload } from "lucide-react";
import { notificationManagementService } from "../api/notificationManagementService";
import { uploadService } from "../api/uploadService";
import { cn, ui } from "../ui";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "https://adminapi.kritamcqs.com/api" : "http://localhost:3001/api");

const audienceOptions = [
  { value: "all", label: "All Users" },
  { value: "premium", label: "Premium Users" },
  { value: "nonPremium", label: "Non-Premium Users" },
  { value: "newRegistered", label: "New Registered Users" },
  { value: "active", label: "Active Users" },
];

const actionOptions = [
  { value: "dailyTest", label: "Open Daily Test Page" },
  { value: "weakAreas", label: "Open Weak Areas Page" },
  { value: "subscription", label: "Open Premium Page" },
  { value: "notifications", label: "Open Notifications Page" },
  { value: "custom", label: "Custom Link" },
];

const deliveryModeOptions = [
  { value: "app", label: "App Notification Only" },
  { value: "push", label: "Push Only" },
  { value: "app_push", label: "App + Push" },
  { value: "email", label: "Email Only" },
  { value: "both", label: "App + Email" },
  { value: "email_push", label: "Email + Push" },
  { value: "all", label: "App + Email + Push" },
];

const emptyReminder = {
  enabled: false,
  title: "",
  message: "",
  image: "",
  ctaAction: "notifications",
  ctaLink: "",
  audience: "all",
  deliveryMode: "app",
  schedules: [{ enabled: true, time: "09:00" }],
};

const emptyForm = {
  dailyTest: {
    ...emptyReminder,
    title: "Your Daily Test is waiting",
    message: "Complete today's Daily Test and keep your streak moving.",
    ctaAction: "dailyTest",
    schedules: [{ enabled: true, time: "09:00" }],
  },
  weakAreas: {
    ...emptyReminder,
    title: "Practice your Weak Areas",
    message: "Focused questions are ready for the topics that need attention.",
    ctaAction: "weakAreas",
    schedules: [{ enabled: true, time: "18:00" }],
  },
};

const defaultCancelledPaymentReminders = [
  {
    id: "immediate",
    name: "Immediate Reminder",
    enabled: true,
    delayValue: 0,
    delayUnit: "Minutes",
    title: "Your premium payment was not completed",
    message: "Complete your subscription now and continue your preparation without interruption.",
    pushTitle: "Your premium payment was not completed",
    pushMessage: "Complete your subscription now and continue your preparation without interruption.",
    inAppTitle: "Your premium payment was not completed",
    inAppMessage: "Complete your subscription now and continue your preparation without interruption.",
    image: "",
    deepLink: "/subscription",
    ctaText: "Complete Payment",
    emailSubject: "Complete your Krita MCQs premium payment",
    emailBody: "<p>Hi {{user_name}},</p><p>Your premium payment was not completed. You can still finish the payment and continue learning.</p>",
  },
  {
    id: "after-24-hours",
    name: "24 Hours Reminder",
    enabled: true,
    delayValue: 24,
    delayUnit: "Hours",
    title: "Your premium plan is still waiting",
    message: "Complete your payment to unlock premium practice, mock tests, and revision tools.",
    pushTitle: "Your premium plan is still waiting",
    pushMessage: "Complete your payment to unlock premium practice, mock tests, and revision tools.",
    inAppTitle: "Your premium plan is still waiting",
    inAppMessage: "Complete your payment to unlock premium practice, mock tests, and revision tools.",
    image: "",
    deepLink: "/subscription",
    ctaText: "Resume Payment",
    emailSubject: "Your Krita MCQs premium plan is still waiting",
    emailBody: "<p>Hi {{user_name}},</p><p>Your premium plan is still waiting. Complete your payment to unlock all premium features.</p>",
  },
];

const emptyCancelledPayment = {
  id: "",
  name: "Subscription Cancelled Payment Reminder",
  status: "disabled",
  priority: 10,
  reminders: defaultCancelledPaymentReminders,
};

function assetUrl(value) {
  if (!value || !String(value).startsWith("/uploads/")) return value;
  return `${API_BASE_URL.replace(/\/api\/?$/, "")}${value}`;
}

function normalizeReminder(value, fallback) {
  return {
    ...fallback,
    ...(value || {}),
    schedules: value?.schedules?.length ? value.schedules : fallback.schedules,
  };
}

function normalizeCancelledPayment(value = {}) {
  const reminders = Array.isArray(value.reminders) && value.reminders.length ? value.reminders : defaultCancelledPaymentReminders;
  return {
    ...emptyCancelledPayment,
    ...value,
    id: value.id || value._id || "",
    reminders: reminders.map((reminder, index) => ({
      ...(defaultCancelledPaymentReminders[index] || defaultCancelledPaymentReminders[1]),
      ...reminder,
      pushTitle: reminder.pushTitle || reminder.title || "",
      pushMessage: reminder.pushMessage || reminder.message || "",
      inAppTitle: reminder.inAppTitle || reminder.title || "",
      inAppMessage: reminder.inAppMessage || reminder.message || "",
      id: reminder.id || `reminder-${index + 1}`,
      name: reminder.name || `Reminder ${index + 1}`,
      enabled: reminder.enabled !== false,
    })),
  };
}

function formatLogDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function compactReason(value, fallback = "-") {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex min-h-10 items-center gap-3 rounded-full border px-3 py-1.5 text-sm font-bold transition",
        checked ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500",
      )}
    >
      <span className={cn("h-5 w-9 rounded-full p-0.5 transition", checked ? "bg-emerald-500" : "bg-slate-300")}>
        <span className={cn("block h-4 w-4 rounded-full bg-white transition", checked ? "translate-x-4" : "translate-x-0")} />
      </span>
      {label}
    </button>
  );
}

function ReminderCard({ id, title, subtitle, form, onPatch, onUpload }) {
  function patch(key, value) {
    onPatch(id, { ...form, [key]: value });
  }

  function patchSchedule(index, value) {
    patch("schedules", form.schedules.map((item, itemIndex) => (itemIndex === index ? { ...item, ...value } : item)));
  }

  return (
    <section className={ui.compactPanel}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className={ui.eyebrow}>{subtitle}</div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">{title}</h2>
        </div>
        <Toggle checked={form.enabled} onChange={(value) => patch("enabled", value)} label={form.enabled ? "Enabled" : "Disabled"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <label className={ui.field}>
          <span>Audience</span>
          <select className={ui.input} value={form.audience} onChange={(event) => patch("audience", event.target.value)}>
            {audienceOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className={ui.field}>
          <span>CTA Action</span>
          <select className={ui.input} value={form.ctaAction} onChange={(event) => patch("ctaAction", event.target.value)}>
            {actionOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className={ui.field}>
          <span>Delivery Mode</span>
          <select className={ui.input} value={form.deliveryMode || "app"} onChange={(event) => patch("deliveryMode", event.target.value)}>
            {deliveryModeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className={ui.field}>
          <span>CTA Link</span>
          <input className={ui.input} value={form.ctaLink} onChange={(event) => patch("ctaLink", event.target.value)} placeholder="/daily-test" />
        </label>
        <label className={ui.field}>
          <span>Notification Title</span>
          <input className={ui.input} value={form.title} onChange={(event) => patch("title", event.target.value)} />
        </label>
        <label className={cn(ui.field, "lg:col-span-2")}>
          <span>Notification Message</span>
          <textarea className={cn(ui.textarea, "min-h-24")} value={form.message} onChange={(event) => patch("message", event.target.value)} />
        </label>
        <div className={cn(ui.field, "lg:col-span-3")}>
          <span>Notification Image</span>
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
            <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
              {form.image ? <img src={assetUrl(form.image)} alt="" className="h-full w-full object-cover" /> : <Image size={22} className="text-slate-400" />}
            </div>
            <input className={ui.input} value={form.image} onChange={(event) => patch("image", event.target.value)} placeholder="/uploads/app-assets/reminder.png" />
            <label className={cn(ui.buttonBase, ui.buttonSecondary, "cursor-pointer whitespace-nowrap")}>
              <Upload size={16} />
              Upload
              <input className="hidden" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => event.target.files?.[0] && onUpload(id, event.target.files[0])} />
            </label>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-600">Reminder Schedules</h3>
          <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => patch("schedules", [...form.schedules, { enabled: true, time: "09:00" }])}>
            <Plus size={16} />
            Add Time
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {form.schedules.map((schedule, index) => (
            <div key={`${schedule.time}-${index}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <input className={ui.checkbox} type="checkbox" checked={schedule.enabled !== false} onChange={(event) => patchSchedule(index, { enabled: event.target.checked })} />
              <input className={ui.input} type="time" value={schedule.time || "09:00"} onChange={(event) => patchSchedule(index, { time: event.target.value })} />
              <button type="button" className={cn(ui.buttonBase, ui.buttonGhost, "px-3")} onClick={() => patch("schedules", form.schedules.filter((_, itemIndex) => itemIndex !== index))} aria-label="Remove schedule">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CancellationReminderLogs({ logs = [], pendingJobs = 0, selectedIds = [], onToggleLog, onToggleAllLogs, onDeleteLogs, deletingLogs, testUser, onTestUserChange, testing, onTest, onRefresh }) {
  const visibleIds = logs.map((log) => log.id || log._id).filter(Boolean);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  return (
    <section className={ui.compactPanel}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className={ui.eyebrow}>Testing Logs</div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">Subscription Cancellation Delivery Logs</h2>
          <p className={ui.muted}>Use this to confirm app event, in-app notification, FCM push, and email delivery for cancelled payments.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700">Pending Jobs: {pendingJobs}</div>
          <button type="button" className={cn(ui.buttonBase, ui.buttonDanger)} disabled={deletingLogs || !selectedIds.length} onClick={() => onDeleteLogs(selectedIds)}>Delete Selected</button>
          <button type="button" className={cn(ui.buttonBase, ui.buttonDanger)} disabled={deletingLogs || !logs.length} onClick={() => onDeleteLogs([], true)}>Clear Logs</button>
          <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={onRefresh}>Refresh Logs</button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
        <label className={ui.field}>
          <span>Test User Email / Mobile / ID</span>
          <input className={ui.input} value={testUser} onChange={(event) => onTestUserChange(event.target.value)} placeholder="student@example.com" />
        </label>
        <div className="flex items-end">
          <button type="button" className={cn(ui.buttonBase, ui.buttonPrimary, "w-full")} disabled={testing} onClick={onTest}>
            {testing ? "Testing..." : "Send Test Cancellation Reminder"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="px-4 py-3"><input className={ui.checkbox} type="checkbox" checked={allSelected} onChange={(event) => onToggleAllLogs(event.target.checked, visibleIds)} /></th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">In-App</th>
              <th className="px-4 py-3">Push</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Reason / Error</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {!logs.length ? (
              <tr><td className="px-4 py-6 text-center font-semibold text-slate-500" colSpan={9}>No cancellation reminder logs yet.</td></tr>
            ) : logs.map((log) => {
              const logId = log.id || log._id || "";
              const push = log.pushDelivery || {};
              const email = log.emailResult || {};
              const reason = compactReason(
                log.errorMessage || log.reason || log.pushReason || log.emailReason || email.reason || push.errors?.[0],
                "-",
              );
              return (
                <tr key={logId || `${log.createdAt}-${log.status}`} className="align-top">
                  <td className="px-4 py-3">{logId ? <input className={ui.checkbox} type="checkbox" checked={selectedIds.includes(logId)} onChange={(event) => onToggleLog(logId, event.target.checked)} /> : null}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">{formatLogDate(log.createdAt)}</td>
                  <td className="px-4 py-3"><div className="font-black text-slate-900">{log.stageName || log.stageId || "-"}</div><div className="text-xs text-slate-500">{log.userId || ""}</div></td>
                  <td className="px-4 py-3"><div className="font-bold text-slate-800">{log.status || "-"}</div><div className="text-xs text-slate-500">{log.eventType || "-"}</div></td>
                  <td className="px-4 py-3"><div className="font-bold text-slate-800">{log.inAppStatus || (log.status === "event_received" ? "event received" : "-")}</div><div className="text-xs text-slate-500">{log.inAppReason || ""}</div></td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800">{log.pushStatus || "-"}</div>
                    <div className="text-xs text-slate-500">sent {push.successCount || 0}, failed {push.failedCount || 0}, no token {push.noTokenCount || 0}</div>
                  </td>
                  <td className="px-4 py-3"><div className="font-bold text-slate-800">{log.emailStatus || (email.sent ? "sent" : email.skipped ? "skipped" : "-")}</div><div className="text-xs text-slate-500">{log.emailReason || email.reason || ""}</div></td>
                  <td className="min-w-64 px-4 py-3 text-slate-600">{reason}</td>
                  <td className="px-4 py-3">{logId ? <button type="button" className={cn(ui.buttonBase, ui.buttonDanger, "px-3")} disabled={deletingLogs} onClick={() => onDeleteLogs([logId])}>Delete</button> : null}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CancelledPaymentReminderCard({ form, onPatch, onUpload, onSave, onDelete, saving }) {
  function patch(key, value) {
    onPatch({ ...form, [key]: value });
  }

  function patchReminder(index, value) {
    patch("reminders", form.reminders.map((item, itemIndex) => (itemIndex === index ? { ...item, ...value } : item)));
  }

  function addReminder() {
    patch("reminders", [
      ...form.reminders,
      {
        ...defaultCancelledPaymentReminders[1],
        id: `reminder-${Date.now()}`,
        name: `Reminder ${form.reminders.length + 1}`,
        delayValue: 48,
        delayUnit: "Hours",
      },
    ]);
  }

  return (
    <section className={ui.compactPanel}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className={ui.eyebrow}>Payment Cancelled Users</div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">Subscription Cancelled Payment Reminder</h2>
          <p className={ui.muted}>Sends automatically when payment is cancelled or abandoned in the app: immediate reminder and 24 hours reminder by default.</p>
        </div>
        <Toggle checked={form.status === "enabled"} onChange={(value) => patch("status", value ? "enabled" : "disabled")} label={form.status === "enabled" ? "Enabled" : "Disabled"} />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <label className={ui.field}>
          <span>Name</span>
          <input className={ui.input} value={form.name} onChange={(event) => patch("name", event.target.value)} />
        </label>
        <label className={ui.field}>
          <span>Target Audience</span>
          <input className={ui.input} value="Payment Cancelled Users" readOnly />
        </label>
        <label className={ui.field}>
          <span>Priority</span>
          <input className={ui.input} type="number" min="1" max="100" value={form.priority} onChange={(event) => patch("priority", Number(event.target.value || 10))} />
        </label>
      </div>

      <div className="space-y-4">
        {form.reminders.map((reminder, index) => (
          <div key={reminder.id || index} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex items-center gap-2 text-sm font-black text-slate-700">
                <input className={ui.checkbox} type="checkbox" checked={reminder.enabled !== false} onChange={(event) => patchReminder(index, { enabled: event.target.checked })} />
                {reminder.name}
              </label>
              <div className="flex gap-2">
                {index > 1 ? <button type="button" className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => patch("reminders", form.reminders.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={16} /></button> : null}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              <label className={ui.field}><span>Reminder Name</span><input className={ui.input} value={reminder.name} onChange={(event) => patchReminder(index, { name: event.target.value })} /></label>
              <label className={ui.field}><span>Delay</span><input className={ui.input} type="number" min="0" value={reminder.delayValue} onChange={(event) => patchReminder(index, { delayValue: Number(event.target.value || 0) })} /></label>
              <label className={ui.field}><span>Delay Unit</span><select className={ui.input} value={reminder.delayUnit} onChange={(event) => patchReminder(index, { delayUnit: event.target.value })}><option>Minutes</option><option>Hours</option><option>Days</option></select></label>
              <label className={ui.field}><span>Deep Link</span><input className={ui.input} value={reminder.deepLink || "/subscription"} onChange={(event) => patchReminder(index, { deepLink: event.target.value })} /></label>
              <label className={ui.field}><span>Push Title</span><input className={ui.input} value={reminder.pushTitle || ""} onChange={(event) => patchReminder(index, { pushTitle: event.target.value, title: event.target.value })} /></label>
              <label className={cn(ui.field, "lg:col-span-3")}><span>Push Message</span><textarea className={cn(ui.textarea, "min-h-24")} value={reminder.pushMessage || ""} onChange={(event) => patchReminder(index, { pushMessage: event.target.value, message: event.target.value })} /></label>
              <label className={ui.field}><span>In-App Title</span><input className={ui.input} value={reminder.inAppTitle || ""} onChange={(event) => patchReminder(index, { inAppTitle: event.target.value })} /></label>
              <label className={cn(ui.field, "lg:col-span-3")}><span>In-App Message</span><textarea className={cn(ui.textarea, "min-h-24")} value={reminder.inAppMessage || ""} onChange={(event) => patchReminder(index, { inAppMessage: event.target.value })} /></label>
              <label className={ui.field}><span>CTA Text</span><input className={ui.input} value={reminder.ctaText || ""} onChange={(event) => patchReminder(index, { ctaText: event.target.value })} /></label>
              <label className={cn(ui.field, "lg:col-span-3")}><span>Image URL</span><div className="flex gap-3"><input className={ui.input} value={reminder.image || ""} onChange={(event) => patchReminder(index, { image: event.target.value })} /><label className={cn(ui.buttonBase, ui.buttonSecondary, "cursor-pointer whitespace-nowrap")}><Upload size={16} />Upload<input className="hidden" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => event.target.files?.[0] && onUpload(index, event.target.files[0])} /></label></div></label>
              <label className={ui.field}><span>Email Subject</span><input className={ui.input} value={reminder.emailSubject || ""} onChange={(event) => patchReminder(index, { emailSubject: event.target.value })} /></label>
              <label className={cn(ui.field, "lg:col-span-3")}><span>Email Body</span><textarea className={cn(ui.textarea, "min-h-24")} value={reminder.emailBody || ""} onChange={(event) => patchReminder(index, { emailBody: event.target.value })} /></label>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={addReminder}><Plus size={16} />Add Reminder</button>
        <div className="flex flex-wrap gap-3">
          {form.id ? <button type="button" className={cn(ui.buttonBase, ui.buttonDanger)} disabled={saving} onClick={onDelete}><Trash2 size={16} />Delete</button> : null}
          <button type="button" className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={saving} onClick={onSave}><Save size={16} />{saving ? "Saving..." : form.id ? "Update Reminder" : "Create Reminder"}</button>
        </div>
      </div>
    </section>
  );
}

export function NotificationManagementPage() {
  const [form, setForm] = useState(emptyForm);
  const [cancelledPaymentForm, setCancelledPaymentForm] = useState(emptyCancelledPayment);
  const [cancelledPaymentLogs, setCancelledPaymentLogs] = useState([]);
  const [cancelledPaymentPendingJobs, setCancelledPaymentPendingJobs] = useState(0);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState("");
  const [savingCancelledPayment, setSavingCancelledPayment] = useState(false);
  const [checking, setChecking] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [testType, setTestType] = useState("dailyTest");
  const [testDeliveryMode, setTestDeliveryMode] = useState("app");
  const [cancelledPaymentTestUser, setCancelledPaymentTestUser] = useState("");
  const [testingCancelledPayment, setTestingCancelledPayment] = useState(false);
  const [selectedCancellationLogIds, setSelectedCancellationLogIds] = useState([]);
  const [deletingCancellationLogs, setDeletingCancellationLogs] = useState(false);

  async function loadSettings() {
    const [response, cancelledPaymentResponse] = await Promise.all([
      notificationManagementService.get(),
      notificationManagementService.paymentCancelledAuto(),
    ]);
    const data = response.data || {};
    const configs = cancelledPaymentResponse.data?.configs || [];
    setForm({
      dailyTest: normalizeReminder(data.dailyTest, emptyForm.dailyTest),
      weakAreas: normalizeReminder(data.weakAreas, emptyForm.weakAreas),
    });
    setCancelledPaymentForm(normalizeCancelledPayment(configs[0] || {}));
    setCancelledPaymentLogs(cancelledPaymentResponse.data?.logs || []);
    setSelectedCancellationLogIds([]);
    setCancelledPaymentPendingJobs(Number(cancelledPaymentResponse.data?.pendingJobs || 0));
    setStatus("ready");
  }

  useEffect(() => {
    loadSettings()
      .catch((error) => {
        setStatus("error");
        setMessage(error.message);
      });
  }, []);

  async function refreshCancellationLogs() {
    setMessage("");
    try {
      const response = await notificationManagementService.paymentCancelledAuto();
      const configs = response.data?.configs || [];
      setCancelledPaymentForm(normalizeCancelledPayment(configs[0] || cancelledPaymentForm));
      setCancelledPaymentLogs(response.data?.logs || []);
      setSelectedCancellationLogIds([]);
      setCancelledPaymentPendingJobs(Number(response.data?.pendingJobs || 0));
      setMessage("Subscription cancellation logs refreshed.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function testCancelledPaymentReminder() {
    if (!cancelledPaymentTestUser.trim()) {
      setMessage("Enter a user email, mobile, or id to test subscription cancellation reminder.");
      return;
    }
    setTestingCancelledPayment(true);
    setMessage("");
    try {
      const response = await notificationManagementService.testPaymentCancelledAuto({
        user: cancelledPaymentTestUser.trim(),
        eventType: "payment_cancelled",
      });
      setCancelledPaymentLogs(response.data?.logs || []);
      setSelectedCancellationLogIds([]);
      setCancelledPaymentPendingJobs(Number(response.data?.pendingJobs || 0));
      const processed = response.data?.processed || [];
      const delivered = processed.reduce((sum, item) => sum + Number(item.pushDelivery?.successCount || 0), 0);
      const noToken = processed.reduce((sum, item) => sum + Number(item.pushDelivery?.noTokenCount || 0), 0);
      const failed = processed.reduce((sum, item) => sum + Number(item.pushDelivery?.failedCount || 0), 0);
      if (response.success === false) {
        setMessage(response.message || "Cancellation test could not run. Check logs below for exact reason.");
      } else {
        setMessage(`Cancellation test completed. Push sent: ${delivered}, failed: ${failed}, no token: ${noToken}. Check logs below for exact reason.`);
      }
    } catch (error) {
      const data = error.response?.data?.data;
      if (data?.logs) {
        setCancelledPaymentLogs(data.logs);
        setCancelledPaymentPendingJobs(Number(data.pendingJobs || 0));
      } else {
        await refreshCancellationLogs();
      }
      setMessage(error.response?.data?.message || error.message);
    } finally {
      setTestingCancelledPayment(false);
    }
  }

  function toggleCancellationLog(id, checked) {
    setSelectedCancellationLogIds((current) => (
      checked ? [...new Set([...current, id])] : current.filter((item) => item !== id)
    ));
  }

  function toggleAllCancellationLogs(checked, ids) {
    setSelectedCancellationLogIds(checked ? ids : []);
  }

  async function deleteCancellationLogs(ids = [], all = false) {
    if (all && !window.confirm("Delete all subscription cancellation logs?")) return;
    if (!all && !ids.length) {
      setMessage("Select at least one cancellation log to delete.");
      return;
    }
    setDeletingCancellationLogs(true);
    setMessage("");
    try {
      const response = await notificationManagementService.deletePaymentCancelledAutoLogs(all ? { all: true } : { ids });
      setCancelledPaymentLogs(response.data?.logs || []);
      setCancelledPaymentPendingJobs(Number(response.data?.pendingJobs || 0));
      setSelectedCancellationLogIds([]);
      setMessage(`${response.data?.deletedCount || 0} cancellation log(s) deleted.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setDeletingCancellationLogs(false);
    }
  }

  function patch(section, value) {
    setForm((current) => ({ ...current, [section]: value }));
  }

  async function uploadImage(section, file) {
    setUploading(section);
    setMessage("");
    try {
      const response = await uploadService.appImage(file, "notification-reminders");
      patch(section, { ...form[section], image: response.data?.url || response.url || "" });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUploading("");
    }
  }

  async function uploadCancelledPaymentImage(index, file) {
    setUploading(`cancelledPayment-${index}`);
    setMessage("");
    try {
      const response = await uploadService.appImage(file, "notification-reminders");
      const image = response.data?.url || response.url || "";
      setCancelledPaymentForm((current) => ({
        ...current,
        reminders: current.reminders.map((item, itemIndex) => (itemIndex === index ? { ...item, image } : item)),
      }));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUploading("");
    }
  }

  async function save() {
    setStatus("saving");
    setMessage("");
    try {
      const response = await notificationManagementService.update(form);
      const data = response.data || {};
      setForm({
        dailyTest: normalizeReminder(data.dailyTest, emptyForm.dailyTest),
        weakAreas: normalizeReminder(data.weakAreas, emptyForm.weakAreas),
      });
      setStatus("ready");
      setMessage("Notification reminder settings saved.");
    } catch (error) {
      setStatus("ready");
      setMessage(error.message);
    }
  }

  async function saveCancelledPaymentReminder() {
    setSavingCancelledPayment(true);
    setMessage("");
    try {
      const payload = normalizeCancelledPayment({
        ...cancelledPaymentForm,
        status: cancelledPaymentForm.status === "enabled" ? "enabled" : "disabled",
      });
      const response = payload.id
        ? await notificationManagementService.updatePaymentCancelledAuto(payload.id, payload)
        : await notificationManagementService.createPaymentCancelledAuto(payload);
      setCancelledPaymentForm(normalizeCancelledPayment(response.data || payload));
      await refreshCancellationLogs();
      setMessage("Subscription cancelled payment reminder saved.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSavingCancelledPayment(false);
    }
  }

  async function deleteCancelledPaymentReminder() {
    if (!cancelledPaymentForm.id || !window.confirm("Delete Subscription Cancellation Reminder?")) return;
    setSavingCancelledPayment(true);
    setMessage("");
    try {
      await notificationManagementService.deletePaymentCancelledAuto(cancelledPaymentForm.id);
      setCancelledPaymentForm(emptyCancelledPayment);
      await refreshCancellationLogs();
      setMessage("Subscription cancellation reminder deleted.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSavingCancelledPayment(false);
    }
  }

  function summarizeResult(data) {
    const parts = [];
    Object.values(data || {}).forEach((item) => {
      if (!item) return;
      parts.push(`${item.kind}: ${item.created || 0} records, ${item.skipped || 0} already sent, ${item.emailSent || 0} email sent, ${item.pushDelivered || 0} push delivered, ${item.pushNoToken || 0} no token`);
    });
    return parts.join(" | ") || "Reminder check completed.";
  }

  async function runReminderCheck(type = "all") {
    setChecking(type);
    setMessage("");
    try {
      const response = await notificationManagementService.runReminders({ type, force: true, deliveryMode: testDeliveryMode });
      setMessage(summarizeResult(response.data));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setChecking("");
    }
  }

  async function testUserReminder() {
    if (!testEmail.trim()) {
      setMessage("Enter a user email to send a test reminder.");
      return;
    }
    setChecking("testUser");
    setMessage("");
    try {
      const response = await notificationManagementService.testUser({ email: testEmail, type: testType, deliveryMode: testDeliveryMode });
      setMessage(summarizeResult(response.data));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setChecking("");
    }
  }

  if (status === "loading") {
    return <div className={ui.compactPanel}>Loading notification management...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <section className={ui.compactPanel}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className={ui.eyebrow}>App Notifications</div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Notification Management</h1>
            <p className={ui.muted}>Configure automated Daily Test and Weak Areas reminders for the mobile app.</p>
          </div>
          <button type="button" className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={status === "saving" || Boolean(uploading)} onClick={save}>
            <Save size={16} />
            {status === "saving" ? "Saving..." : "Save Settings"}
          </button>
        </div>
        {message ? <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">{message}</div> : null}
        {uploading ? <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><Bell size={15} /> Uploading image...</div> : null}
      </section>

      <section className={ui.compactPanel}>
        <div className="mb-4">
          <div className={ui.eyebrow}>Run / Test</div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">Reminder Delivery Check</h2>
          <p className={ui.muted}>Run the daily reminder processor for all eligible users or test one user by email.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <label className={ui.field}>
            <span>Testing Delivery Mode</span>
            <select className={ui.input} value={testDeliveryMode} onChange={(event) => setTestDeliveryMode(event.target.value)}>
              {deliveryModeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} disabled={Boolean(checking)} onClick={() => runReminderCheck("dailyTest")}>
            {checking === "dailyTest" ? "Checking..." : "Run Daily Test Reminder"}
          </button>
          <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} disabled={Boolean(checking)} onClick={() => runReminderCheck("weakAreas")}>
            {checking === "weakAreas" ? "Checking..." : "Run Weak Areas Reminder"}
          </button>
          <button type="button" className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={Boolean(checking)} onClick={() => runReminderCheck("all")}>
            {checking === "all" ? "Checking..." : "Run All Reminders"}
          </button>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Automatic daily checks active</div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px_auto]">
          <label className={ui.field}>
            <span>User Email</span>
            <input className={ui.input} value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder="student@example.com" />
          </label>
          <label className={ui.field}>
            <span>Reminder Type</span>
            <select className={ui.input} value={testType} onChange={(event) => setTestType(event.target.value)}>
              <option value="dailyTest">Daily Test</option>
              <option value="weakAreas">Weak Areas</option>
            </select>
          </label>
          <div className="flex items-end">
            <button type="button" className={cn(ui.buttonBase, ui.buttonPrimary, "w-full")} disabled={Boolean(checking)} onClick={testUserReminder}>
              {checking === "testUser" ? "Sending..." : "Send User Test"}
            </button>
          </div>
        </div>
      </section>

      <ReminderCard id="dailyTest" title="Daily Test Reminder" subtitle="Incomplete Daily Test Users" form={form.dailyTest} onPatch={patch} onUpload={uploadImage} />
      <ReminderCard id="weakAreas" title="Weak Areas Reminder" subtitle="Users With Pending Weak Areas" form={form.weakAreas} onPatch={patch} onUpload={uploadImage} />
      <CancelledPaymentReminderCard
        form={cancelledPaymentForm}
        onPatch={setCancelledPaymentForm}
        onUpload={uploadCancelledPaymentImage}
        onSave={saveCancelledPaymentReminder}
        onDelete={deleteCancelledPaymentReminder}
        saving={savingCancelledPayment}
      />
      <CancellationReminderLogs
        logs={cancelledPaymentLogs}
        pendingJobs={cancelledPaymentPendingJobs}
        selectedIds={selectedCancellationLogIds}
        onToggleLog={toggleCancellationLog}
        onToggleAllLogs={toggleAllCancellationLogs}
        onDeleteLogs={deleteCancellationLogs}
        deletingLogs={deletingCancellationLogs}
        testUser={cancelledPaymentTestUser}
        onTestUserChange={setCancelledPaymentTestUser}
        testing={testingCancelledPayment}
        onTest={testCancelledPaymentReminder}
        onRefresh={refreshCancellationLogs}
      />
    </div>
  );
}
