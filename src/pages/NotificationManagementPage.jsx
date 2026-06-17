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

const emptyReminder = {
  enabled: false,
  title: "",
  message: "",
  image: "",
  ctaAction: "notifications",
  ctaLink: "",
  audience: "all",
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

export function NotificationManagementPage() {
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState("");
  const [checking, setChecking] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [testType, setTestType] = useState("dailyTest");

  useEffect(() => {
    notificationManagementService.get()
      .then((response) => {
        const data = response.data || {};
        setForm({
          dailyTest: normalizeReminder(data.dailyTest, emptyForm.dailyTest),
          weakAreas: normalizeReminder(data.weakAreas, emptyForm.weakAreas),
        });
        setStatus("ready");
      })
      .catch((error) => {
        setStatus("error");
        setMessage(error.message);
      });
  }, []);

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

  function summarizeResult(data) {
    const parts = [];
    Object.values(data || {}).forEach((item) => {
      if (!item) return;
      parts.push(`${item.kind}: ${item.created || 0} created, ${item.skipped || 0} already sent, ${item.emailSent || 0} email sent`);
    });
    return parts.join(" | ") || "Reminder check completed.";
  }

  async function runReminderCheck(type = "all") {
    setChecking(type);
    setMessage("");
    try {
      const response = await notificationManagementService.runReminders({ type, force: true });
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
      const response = await notificationManagementService.testUser({ email: testEmail, type: testType });
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
              {checking === "testUser" ? "Sending..." : "Send User Email Test"}
            </button>
          </div>
        </div>
      </section>

      <ReminderCard id="dailyTest" title="Daily Test Reminder" subtitle="Incomplete Daily Test Users" form={form.dailyTest} onPatch={patch} onUpload={uploadImage} />
      <ReminderCard id="weakAreas" title="Weak Areas Reminder" subtitle="Users With Pending Weak Areas" form={form.weakAreas} onPatch={patch} onUpload={uploadImage} />
    </div>
  );
}
