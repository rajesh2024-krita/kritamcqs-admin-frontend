import { useEffect, useState } from "react";
import { Bell, Image, Plus, Save, Trash2, Upload, Send, RefreshCw, Clock, Users, Target, Mail, Smartphone, Zap, Settings, AlertCircle, CheckCircle, XCircle, Play, Pause, Calendar, Link, Type, Layout, Eye, EyeOff } from "lucide-react";
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

function Toggle({ checked, onChange, label, size = "sm" }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border transition-all",
        size === "sm" ? "px-2 py-0.5 text-sm" : "px-3 py-1 text-[10px]",
        checked ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500",
      )}
    >
      <span className={cn(
        "rounded-full p-0.5 transition",
        size === "sm" ? "h-4 w-7" : "h-5 w-9",
        checked ? "bg-emerald-500" : "bg-slate-300"
      )}>
        <span className={cn(
          "block rounded-full bg-white transition",
          size === "sm" ? "h-3 w-3" : "h-4 w-4",
          checked ? "translate-x-3" : "translate-x-0"
        )} />
      </span>
      {label}
    </button>
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

  // Compact input classes
  const compactInput = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
  const compactSelect = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none";
  const compactTextarea = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y min-h-[40px]";

  if (status === "loading") {
    return <div className="bg-white rounded-lg border border-slate-200/60 p-4 text-center text-xs text-slate-500">Loading notification management...</div>;
  }

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
              <h1 className="text-sm font-semibold text-slate-900">Notification Management</h1>
              <p className="text-xs text-slate-500">Configure automated reminders for the mobile app</p>
            </div>
          </div>
          <button className="inline-flex items-center gap-0.5 px-2.5 py-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-[9px] font-medium rounded-lg transition-all shadow-sm shadow-indigo-500/25" disabled={status === "saving" || Boolean(uploading)} onClick={save}>
            <Save size={10} /> {status === "saving" ? "Saving..." : "Save"}
          </button>
        </div>
        {message && (
          <div className="mt-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[9px] font-medium text-indigo-700">
            {message}
          </div>
        )}
        {uploading && (
          <div className="mt-1 text-sm text-slate-400">Uploading image...</div>
        )}
      </div>

      {/* Run/Test Section */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm space-y-2">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Zap size={14} className="text-indigo-600" />
          <h2 className="text-xs font-semibold text-slate-900">Reminder Delivery Check</h2>
        </div>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-0.5">
            <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Test Delivery Mode</label>
            <select className={compactSelect} value={testDeliveryMode} onChange={(event) => setTestDeliveryMode(event.target.value)}>
              {deliveryModeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
          <button className="inline-flex items-center justify-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 rounded transition-colors disabled:opacity-50" disabled={Boolean(checking)} onClick={() => runReminderCheck("dailyTest")}>
            {checking === "dailyTest" ? "..." : "Run Daily Test"}
          </button>
          <button className="inline-flex items-center justify-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 rounded transition-colors disabled:opacity-50" disabled={Boolean(checking)} onClick={() => runReminderCheck("weakAreas")}>
            {checking === "weakAreas" ? "..." : "Run Weak Areas"}
          </button>
          <button className="inline-flex items-center justify-center gap-0.5 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50" disabled={Boolean(checking)} onClick={() => runReminderCheck("all")}>
            {checking === "all" ? "..." : "Run All"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-[1fr_150px_auto]">
          <div className="flex flex-col gap-0.5">
            <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">User Email</label>
            <input className={compactInput} value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder="student@example.com" />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Type</label>
            <select className={compactSelect} value={testType} onChange={(event) => setTestType(event.target.value)}>
              <option value="dailyTest">Daily Test</option>
              <option value="weakAreas">Weak Areas</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="inline-flex items-center justify-center gap-0.5 px-2.5 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 w-full" disabled={Boolean(checking)} onClick={testUserReminder}>
              <Send size={9} /> {checking === "testUser" ? "..." : "Test User"}
            </button>
          </div>
        </div>

        <div className="text-sm text-emerald-600 bg-emerald-50 rounded px-2 py-0.5 border border-emerald-200">Automatic daily checks active</div>
      </div>

      {/* Daily Test Reminder Card */}
      <ReminderCard 
        id="dailyTest" 
        title="Daily Test Reminder" 
        subtitle="Incomplete Daily Test Users" 
        form={form.dailyTest} 
        onPatch={patch} 
        onUpload={uploadImage}
        compactInput={compactInput}
        compactSelect={compactSelect}
        compactTextarea={compactTextarea}
      />

      {/* Weak Areas Reminder Card */}
      <ReminderCard 
        id="weakAreas" 
        title="Weak Areas Reminder" 
        subtitle="Users With Pending Weak Areas" 
        form={form.weakAreas} 
        onPatch={patch} 
        onUpload={uploadImage}
        compactInput={compactInput}
        compactSelect={compactSelect}
        compactTextarea={compactTextarea}
      />

      {/* Cancelled Payment Reminder Card */}
      <CancelledPaymentReminderCard
        form={cancelledPaymentForm}
        onPatch={setCancelledPaymentForm}
        onUpload={uploadCancelledPaymentImage}
        onSave={saveCancelledPaymentReminder}
        onDelete={deleteCancelledPaymentReminder}
        saving={savingCancelledPayment}
        compactInput={compactInput}
        compactSelect={compactSelect}
        compactTextarea={compactTextarea}
      />

      {/* Cancellation Reminder Logs */}
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
        compactInput={compactInput}
        compactSelect={compactSelect}
      />
    </div>
  );
}

// Reminder Card Component
function ReminderCard({ id, title, subtitle, form, onPatch, onUpload, compactInput, compactSelect, compactTextarea }) {
  function patch(key, value) {
    onPatch(id, { ...form, [key]: value });
  }

  function patchSchedule(index, value) {
    patch("schedules", form.schedules.map((item, itemIndex) => (itemIndex === index ? { ...item, ...value } : item)));
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <div className="text-sm font-medium text-indigo-600 uppercase tracking-wider">{subtitle}</div>
          <h2 className="text-xs font-semibold text-slate-900">{title}</h2>
        </div>
        <Toggle checked={form.enabled} onChange={(value) => patch("enabled", value)} label={form.enabled ? "Enabled" : "Disabled"} size="sm" />
      </div>

      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
        <div className="flex flex-col gap-0.5">
          <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Audience</label>
          <select className={compactSelect} value={form.audience} onChange={(event) => patch("audience", event.target.value)}>
            {audienceOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">CTA Action</label>
          <select className={compactSelect} value={form.ctaAction} onChange={(event) => patch("ctaAction", event.target.value)}>
            {actionOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Delivery Mode</label>
          <select className={compactSelect} value={form.deliveryMode || "app"} onChange={(event) => patch("deliveryMode", event.target.value)}>
            {deliveryModeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">CTA Link</label>
          <input className={compactInput} value={form.ctaLink} onChange={(event) => patch("ctaLink", event.target.value)} placeholder="/daily-test" />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Title</label>
          <input className={compactInput} value={form.title} onChange={(event) => patch("title", event.target.value)} />
        </div>
        <div className="flex flex-col gap-0.5 sm:col-span-2">
          <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Message</label>
          <textarea className={compactTextarea} rows={2} value={form.message} onChange={(event) => patch("message", event.target.value)} />
        </div>
        <div className="flex flex-col gap-0.5 sm:col-span-3">
          <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Image</label>
          <div className="flex gap-1">
            <input className={cn(compactInput, "flex-1")} value={form.image} onChange={(event) => patch("image", event.target.value)} placeholder="/uploads/..." />
            <label className={cn("inline-flex items-center gap-0.5 px-2 py-0.5 text-sm font-medium rounded transition-colors cursor-pointer", "bg-slate-100 hover:bg-slate-200 text-slate-700")}>
              <Upload size={8} /> Upload
              <input className="hidden" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => event.target.files?.[0] && onUpload(id, event.target.files[0])} />
            </label>
          </div>
          {form.image && <img src={assetUrl(form.image)} alt="Preview" className="mt-1 h-16 w-28 rounded border border-slate-200 object-cover" />}
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Schedules</span>
          <button type="button" className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 rounded transition-colors" onClick={() => patch("schedules", [...form.schedules, { enabled: true, time: "09:00" }])}>
            <Plus size={8} /> Add
          </button>
        </div>
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {form.schedules.map((schedule, index) => (
            <div key={`${schedule.time}-${index}`} className="flex items-center gap-1 bg-slate-50 rounded-lg border border-slate-200/50 px-2 py-1">
              <input className="h-3 w-3 rounded border-slate-300 text-indigo-600 focus:ring-1 focus:ring-indigo-500/20" type="checkbox" checked={schedule.enabled !== false} onChange={(event) => patchSchedule(index, { enabled: event.target.checked })} />
              <input className={cn(compactInput, "flex-1")} type="time" value={schedule.time || "09:00"} onChange={(event) => patchSchedule(index, { time: event.target.value })} />
              <button type="button" className="p-0.5 text-rose-500 hover:bg-rose-50 rounded transition-colors" onClick={() => patch("schedules", form.schedules.filter((_, itemIndex) => itemIndex !== index))}>
                <Trash2 size={9} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Cancelled Payment Reminder Card
function CancelledPaymentReminderCard({ form, onPatch, onUpload, onSave, onDelete, saving, compactInput, compactSelect, compactTextarea }) {
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
    <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <div className="text-sm font-medium text-indigo-600 uppercase tracking-wider">Payment Cancelled Users</div>
          <h2 className="text-xs font-semibold text-slate-900">Cancelled Payment Reminder</h2>
        </div>
        <Toggle checked={form.status === "enabled"} onChange={(value) => patch("status", value ? "enabled" : "disabled")} label={form.status === "enabled" ? "Enabled" : "Disabled"} size="sm" />
      </div>

      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
        <div className="flex flex-col gap-0.5">
          <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Name</label>
          <input className={compactInput} value={form.name} onChange={(event) => patch("name", event.target.value)} />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Audience</label>
          <input className={cn(compactInput, "bg-slate-100")} value="Payment Cancelled Users" readOnly />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Priority</label>
          <input className={compactInput} type="number" min="1" max="100" value={form.priority} onChange={(event) => patch("priority", Number(event.target.value || 10))} />
        </div>
      </div>

      <div className="space-y-1.5">
        {form.reminders.map((reminder, index) => (
          <div key={reminder.id || index} className="bg-white rounded-lg border border-slate-200/50 p-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
              <label className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700">
                <input className="h-3 w-3 rounded border-slate-300 text-indigo-600 focus:ring-1 focus:ring-indigo-500/20" type="checkbox" checked={reminder.enabled !== false} onChange={(event) => patchReminder(index, { enabled: event.target.checked })} />
                {reminder.name}
              </label>
              {index > 1 && (
                <button type="button" className="p-0.5 text-rose-500 hover:bg-rose-50 rounded transition-colors" onClick={() => patch("reminders", form.reminders.filter((_, itemIndex) => itemIndex !== index))}>
                  <Trash2 size={9} />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 space-y-3">
              <div className="flex flex-col gap-0.5">
                <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Delay</label>
                <input className={compactInput} type="number" min="0" value={reminder.delayValue} onChange={(event) => patchReminder(index, { delayValue: Number(event.target.value || 0) })} />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Unit</label>
                <select className={compactSelect} value={reminder.delayUnit} onChange={(event) => patchReminder(index, { delayUnit: event.target.value })}>
                  <option>Minutes</option><option>Hours</option><option>Days</option>
                </select>
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Deep Link</label>
                <input className={compactInput} value={reminder.deepLink || "/subscription"} onChange={(event) => patchReminder(index, { deepLink: event.target.value })} />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">CTA Text</label>
                <input className={compactInput} value={reminder.ctaText || ""} onChange={(event) => patchReminder(index, { ctaText: event.target.value })} />
              </div>
              <div className="flex flex-col gap-0.5 sm:col-span-2">
                <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Push Title</label>
                <input className={compactInput} value={reminder.pushTitle || ""} onChange={(event) => patchReminder(index, { pushTitle: event.target.value, title: event.target.value })} />
              </div>
              <div className="flex flex-col gap-0.5 sm:col-span-2">
                <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Push Message</label>
                <textarea className={compactTextarea} rows={2} value={reminder.pushMessage || ""} onChange={(event) => patchReminder(index, { pushMessage: event.target.value, message: event.target.value })} />
              </div>
              <div className="flex flex-col gap-0.5 sm:col-span-2">
                <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">In-App Title</label>
                <input className={compactInput} value={reminder.inAppTitle || ""} onChange={(event) => patchReminder(index, { inAppTitle: event.target.value })} />
              </div>
              <div className="flex flex-col gap-0.5 sm:col-span-2">
                <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">In-App Message</label>
                <textarea className={compactTextarea} rows={2} value={reminder.inAppMessage || ""} onChange={(event) => patchReminder(index, { inAppMessage: event.target.value })} />
              </div>
              <div className="flex flex-col gap-0.5 sm:col-span-2">
                <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Image</label>
                <div className="flex gap-1">
                  <input className={cn(compactInput, "flex-1")} value={reminder.image || ""} onChange={(event) => patchReminder(index, { image: event.target.value })} />
                  <label className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 text-sm font-medium rounded transition-colors cursor-pointer", "bg-slate-100 hover:bg-slate-200 text-slate-700")}>
                    <Upload size={7} /> Upload
                    <input className="hidden" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => event.target.files?.[0] && onUpload(index, event.target.files[0])} />
                  </label>
                </div>
              </div>
              <div className="flex flex-col gap-0.5 sm:col-span-2">
                <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Email Subject</label>
                <input className={compactInput} value={reminder.emailSubject || ""} onChange={(event) => patchReminder(index, { emailSubject: event.target.value })} />
              </div>
              <div className="flex flex-col gap-0.5 sm:col-span-2">
                <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Email Body</label>
                <textarea className={compactTextarea} rows={3} value={reminder.emailBody || ""} onChange={(event) => patchReminder(index, { emailBody: event.target.value })} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <button type="button" className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 rounded transition-colors" onClick={addReminder}>
          <Plus size={8} /> Add Reminder
        </button>
        <div className="flex gap-1">
          {form.id && (
            <button type="button" className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-medium rounded transition-colors disabled:opacity-50" disabled={saving} onClick={onDelete}>
              <Trash2 size={9} /> Delete
            </button>
          )}
          <button type="button" className="inline-flex items-center gap-0.5 px-2.5 py-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm shadow-indigo-500/25 disabled:opacity-50" disabled={saving} onClick={onSave}>
            <Save size={9} /> {saving ? "Saving..." : form.id ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Cancellation Reminder Logs Component
function CancellationReminderLogs({ 
  logs = [], 
  pendingJobs = 0, 
  selectedIds = [], 
  onToggleLog, 
  onToggleAllLogs, 
  onDeleteLogs, 
  deletingLogs, 
  testUser, 
  onTestUserChange, 
  testing, 
  onTest, 
  onRefresh,
  compactInput,
  compactSelect
}) {
  const visibleIds = logs.map((log) => log.id || log._id).filter(Boolean);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  return (
    <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <div className="text-sm font-medium text-indigo-600 uppercase tracking-wider">Testing Logs</div>
          <h2 className="text-xs font-semibold text-slate-900">Cancellation Delivery Logs</h2>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-sm font-medium text-slate-600">Pending: {pendingJobs}</span>
          <button className="flex justify-between items-center gap-2 px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-medium rounded transition-colors disabled:opacity-50" disabled={deletingLogs || !selectedIds.length} onClick={() => onDeleteLogs(selectedIds)}>
            <Trash2 size={16} /> Delete
          </button>
          <button className="flex justify-between items-center gap-2 px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 rounded transition-colors" onClick={onRefresh}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-0.5">
          <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Test User</label>
          <input className={compactInput} value={testUser} onChange={(event) => onTestUserChange(event.target.value)} placeholder="student@example.com" />
        </div>
        <div className="flex items-end">
          <button className="inline-flex items-center justify-center gap-0.5 px-2.5 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 w-full" disabled={testing} onClick={onTest}>
            <Send size={9} /> {testing ? "Testing..." : "Send Test"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-1.5 py-1 text-left"><input className="h-3 w-3 rounded border-slate-300 text-indigo-600 focus:ring-1 focus:ring-indigo-500/20" type="checkbox" checked={allSelected} onChange={(event) => onToggleAllLogs(event.target.checked, visibleIds)} /></th>
              <th className="px-1.5 py-1 text-left text-sm font-normal uppercase tracking-wider text-slate-400">Time</th>
              <th className="px-1.5 py-1 text-left text-sm font-normal uppercase tracking-wider text-slate-400">Stage</th>
              <th className="px-1.5 py-1 text-left text-sm font-normal uppercase tracking-wider text-slate-400">Event</th>
              <th className="px-1.5 py-1 text-left text-sm font-normal uppercase tracking-wider text-slate-400">In-App</th>
              <th className="px-1.5 py-1 text-left text-sm font-normal uppercase tracking-wider text-slate-400">Push</th>
              <th className="px-1.5 py-1 text-left text-sm font-normal uppercase tracking-wider text-slate-400">Email</th>
              <th className="px-1.5 py-1 text-left text-sm font-normal uppercase tracking-wider text-slate-400">Error</th>
              <th className="px-1.5 py-1 text-left text-sm font-normal uppercase tracking-wider text-slate-400">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!logs.length ? (
              <tr><td className="px-4 py-3 text-center text-sm text-slate-400" colSpan={9}>No cancellation reminder logs yet.</td></tr>
            ) : logs.map((log) => {
              const logId = log.id || log._id || "";
              const push = log.pushDelivery || {};
              const email = log.emailResult || {};
              const reason = compactReason(log.errorMessage || log.reason || log.pushReason || log.emailReason || email.reason || push.errors?.[0], "-");
              return (
                <tr key={logId || `${log.createdAt}-${log.status}`} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-1.5 py-3">{logId ? <input className="h-3 w-3 rounded border-slate-300 text-indigo-600 focus:ring-1 focus:ring-indigo-500/20" type="checkbox" checked={selectedIds.includes(logId)} onChange={(event) => onToggleLog(logId, event.target.checked)} /> : null}</td>
                  <td className="px-1.5 py-3 text-sm text-slate-600">{formatLogDate(log.createdAt)}</td>
                  <td className="px-1.5 py-3 text-sm text-slate-700">{log.stageName || log.stageId || "-"}</td>
                  <td className="px-1.5 py-3 text-sm text-slate-700">{log.status || "-"}</td>
                  <td className="px-1.5 py-3 text-sm text-slate-600">{log.inAppStatus || (log.status === "event_received" ? "received" : "-")}</td>
                  <td className="px-1.5 py-3 text-sm text-slate-600">sent {push.successCount || 0}, failed {push.failedCount || 0}</td>
                  <td className="px-1.5 py-3 text-sm text-slate-600">{log.emailStatus || (email.sent ? "sent" : email.skipped ? "skipped" : "-")}</td>
                  <td className="px-1.5 py-3 text-sm text-slate-500 max-w-[150px] truncate">{reason}</td>
                  <td className="px-1.5 py-3">{logId && <button className="px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-medium rounded transition-colors disabled:opacity-50" disabled={deletingLogs} onClick={() => onDeleteLogs([logId])}>Delete</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}