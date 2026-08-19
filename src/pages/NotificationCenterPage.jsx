import { useEffect, useMemo, useState } from "react";
import { notificationService } from "../api/notificationService";
import { emailTemplateService } from "../api/emailTemplateService";
import { ctaConfigService } from "../api/ctaConfigService";
import { cn, ui } from "../ui";
import {
  Bell,
  Send,
  FileText,
  Calendar,
  Clock,
  BarChart3,
  Settings,
  Users,
  Target,
  Mail,
  MessageSquare,
  Zap,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  StopCircle,
  TrendingUp,
  Award,
  Crown,
  User,
  Smartphone,
  Link,
  Image,
  Type,
  Layout,
  ChevronDown,
  ChevronRight,
  Copy,
  Save,
  Filter,
  Search
} from "lucide-react";

const targetOptions = [
  { value: "all", label: "All Users" },
  { value: "free", label: "Free Users" },
  { value: "premium", label: "Premium Users" },
  { value: "neet", label: "NEET Users" },
  { value: "jee", label: "JEE Users" },
  { value: "active", label: "Active Users" },
  { value: "inactive", label: "Inactive Users" },
  { value: "payment_pending", label: "Payment Pending Users" },
  { value: "selected", label: "Selected Users" },
];

const categoryOptions = [
  { value: "exam", label: "Exam" },
  { value: "offer", label: "Offer" },
  { value: "subscription", label: "Subscription" },
  { value: "revision", label: "Revision" },
  { value: "mock_test", label: "Mock Test" },
  { value: "system", label: "System" },
  { value: "custom", label: "Custom" },
];

const deepLinks = ["/daily-test", "/mock-tests", "/revision", "/weak-areas", "/subscription", "/notifications", "/dashboard"];
const deliveryOptions = [
  { value: "notification", label: "Push Notification" },
  { value: "email", label: "Email Only" },
  { value: "both", label: "Push + Email" },
];
const automationChannelOptions = [
  { value: "in_app", label: "In-App" },
  { value: "push", label: "Push" },
  { value: "email", label: "Email" },
];
const weekDayOptions = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const emptyTemplate = {
  name: "",
  title: "",
  message: "",
  image: "",
  deepLink: "/notifications",
  ctaConfigId: "",
  ctaText: "",
  targetType: "all",
  category: "custom",
  sound: "default",
  priority: "high",
  status: true,
};

const emptySend = {
  templateId: "",
  campaignName: "",
  deliveryType: "notification",
  title: "",
  message: "",
  image: "",
  deepLink: "/notifications",
  ctaConfigId: "",
  ctaText: "",
  targetScreen: "",
  emailTemplateId: "",
  emailTemplateKey: "",
  emailSubject: "",
  emailBody: "",
  targetType: "all",
  selectedUsers: "",
  category: "custom",
  sound: "default",
  priority: "high",
  scheduleDate: "",
  recurring: false,
  recurrence: "none",
  recurrenceInterval: 1,
  recurrenceUnit: "Days",
  action: "send",
};

const emptyTest = {
  deliveryType: "both",
  testTarget: "admin",
  title: "Krita test notification",
  message: "This is a test notification from Krita MCQs.",
  deepLink: "/notifications",
  emailTemplateId: "",
  emailTemplateKey: "",
  emailSubject: "Krita test email",
  emailBody: "<p>This is a test email from Krita MCQs.</p>",
  selectedUsers: "",
  testEmail: "",
  category: "custom",
};

const emptyAutomation = {
  campaignName: "",
  scheduleType: "weekly",
  weeklyDays: [1],
  monthlyDay: 1,
  scheduleTime: "09:00",
  timezone: "Asia/Kolkata",
  deliveryChannels: ["in_app", "push"],
  title: "",
  message: "",
  image: "",
  deepLink: "/notifications",
  ctaConfigId: "",
  ctaText: "",
  targetScreen: "",
  emailTemplateId: "",
  emailTemplateKey: "",
  emailSubject: "",
  emailBody: "",
  targetType: "all",
  selectedUsers: "",
  category: "custom",
  sound: "default",
  priority: "high",
  automationEnabled: true,
};

function toInputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function selectedUserValues(value = "") {
  return String(value || "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function deliverySummaryMessage(response, fallback = "Notification request completed.") {
  const data = response?.data || {};
  const push = data.delivery || {};
  const email = data.emailDelivery || {};
  const parts = [];
  if (Number(push.sentCount || 0) || Number(push.successCount || 0) || Number(push.failedCount || 0) || Number(push.noTokenCount || 0)) {
    parts.push(`Push: ${Number(push.successCount || 0)} sent, ${Number(push.failedCount || 0)} failed`);
  }
  if (Number(email.emailSentCount || 0) || Number(email.emailFailedCount || 0) || Number(email.emailSkippedCount || 0)) {
    parts.push(`Email: ${Number(email.emailSentCount || 0)} sent, ${Number(email.emailFailedCount || 0)} failed`);
  }
  return parts.length ? parts.join(" | ") : response?.message || fallback;
}

function channelLabel(channels = [], fallback = "") {
  const values = Array.isArray(channels) ? channels : [];
  if (values.length) {
    return values
      .map((value) => automationChannelOptions.find((item) => item.value === value)?.label || value)
      .join(" + ");
  }
  if (fallback === "email") return "Email";
  if (fallback === "both") return "In-App + Push + Email";
  return "In-App + Push";
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function sameKolkataDate(left, right) {
  const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" };
  return left.toLocaleDateString("en-CA", options) === right.toLocaleDateString("en-CA", options);
}

function formatNextSend(value, now = new Date()) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const time = date.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" });
  if (sameKolkataDate(date, now)) return `Today, ${time}`;
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRemaining(value, now = new Date()) {
  if (!value) return "-";
  const date = new Date(value);
  const diff = date.getTime() - now.getTime();
  if (!Number.isFinite(diff)) return "-";
  if (diff <= 0) return "Due now";
  const totalMinutes = Math.ceil(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes || !parts.length) parts.push(`${minutes}m`);
  return parts.join(" ");
}

export function NotificationCenterPage() {
  const [tab, setTab] = useState("send");
  const [templates, setTemplates] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [ctaConfigs, setCtaConfigs] = useState([]);
  const [history, setHistory] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [automationTimezone, setAutomationTimezone] = useState("Asia/Kolkata");
  const [automationAudienceCount, setAutomationAudienceCount] = useState(0);
  const [nowTick, setNowTick] = useState(() => new Date());
  const [stats, setStats] = useState(null);
  const [audiences, setAudiences] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [templateForm, setTemplateForm] = useState(emptyTemplate);
  const [editingTemplateId, setEditingTemplateId] = useState("");
  const [editingCampaignId, setEditingCampaignId] = useState("");
  const [sendForm, setSendForm] = useState(emptySend);
  const [testForm, setTestForm] = useState(emptyTest);
  const [automationForm, setAutomationForm] = useState(emptyAutomation);
  const [editingAutomationId, setEditingAutomationId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadAll() {
    const [templateResponse, historyResponse, scheduledResponse, statsResponse, ctaResponse, audienceResponse, automationResponse] = await Promise.all([
      notificationService.templates(),
      notificationService.history({ limit: 50 }),
      notificationService.scheduled(),
      notificationService.stats(),
      ctaConfigService.list({ channel: "push", isActive: true }),
      notificationService.audiences(),
      notificationService.automations(),
    ]);
    setTemplates(templateResponse.data || []);
    try {
      const emailTemplateResponse = await emailTemplateService.catalog();
      setEmailTemplates((emailTemplateResponse.data?.templates || []).filter((item) => item.status?.isActive !== false));
    } catch {
      setEmailTemplates([]);
    }
    setHistory(historyResponse.data || []);
    setScheduled(scheduledResponse.data || []);
    setAutomations(automationResponse.data || []);
    setAutomationTimezone(automationResponse.timezone || "Asia/Kolkata");
    setStats(statsResponse.data || null);
    setCtaConfigs(ctaResponse.data || []);
    setAudiences(audienceResponse.data || []);
  }

  useEffect(() => {
    loadAll().catch((error) => setMessage(error.message));
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNowTick(new Date()), 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  const currentCampaignForm = sendForm;
  const setCurrentCampaignForm = setSendForm;
  const currentEditingCampaignId = editingCampaignId;
  const automationShouldInApp = automationForm.deliveryChannels.includes("in_app");
  const automationShouldPush = automationForm.deliveryChannels.includes("push");
  const automationShouldEmail = automationForm.deliveryChannels.includes("email");

  const activeTemplate = useMemo(
    () => templates.find((item) => String(item.id || item._id) === String(currentCampaignForm.templateId)),
    [templates, currentCampaignForm.templateId],
  );

  const activeEmailTemplate = useMemo(
    () => emailTemplates.find((item) => String(item.id || item.status?.templateId || item.key) === String(currentCampaignForm.emailTemplateId)),
    [emailTemplates, currentCampaignForm.emailTemplateId],
  );
  const activeAutomationEmailTemplate = useMemo(
    () => emailTemplates.find((item) => String(item.id || item.status?.templateId || item.key) === String(automationForm.emailTemplateId)),
    [emailTemplates, automationForm.emailTemplateId],
  );

  useEffect(() => {
    if (!activeTemplate) return;
    setCurrentCampaignForm((current) => ({
      ...current,
      title: activeTemplate.title || "",
      message: activeTemplate.message || "",
      image: activeTemplate.image || "",
      deepLink: activeTemplate.deepLink || "/notifications",
      ctaConfigId: activeTemplate.ctaConfigId || "",
      ctaText: activeTemplate.ctaText || "",
      targetType: activeTemplate.targetType || "all",
      category: activeTemplate.category || "custom",
      sound: activeTemplate.sound || "default",
      priority: activeTemplate.priority || "high",
    }));
  }, [activeTemplate, setCurrentCampaignForm]);

  useEffect(() => {
    if (!activeEmailTemplate) return;
    setCurrentCampaignForm((current) => ({
      ...current,
      emailTemplateKey: activeEmailTemplate.key || "",
      emailSubject: activeEmailTemplate.subject || "",
      emailBody: activeEmailTemplate.htmlContent || activeEmailTemplate.textContent || "",
    }));
  }, [activeEmailTemplate, setCurrentCampaignForm]);

  useEffect(() => {
    if (!activeAutomationEmailTemplate) return;
    setAutomationForm((current) => ({
      ...current,
      emailTemplateKey: activeAutomationEmailTemplate.key || "",
      emailSubject: activeAutomationEmailTemplate.subject || "",
      emailBody: activeAutomationEmailTemplate.htmlContent || activeAutomationEmailTemplate.textContent || "",
    }));
  }, [activeAutomationEmailTemplate]);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await notificationService.audienceCount({
          targetType: automationForm.targetType,
          selectedUsers: automationForm.selectedUsers,
        });
        if (!cancelled) setAutomationAudienceCount(response.data?.count || 0);
      } catch (error) {
        if (!cancelled) setMessage(error.message);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [automationForm.targetType, automationForm.selectedUsers]);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setUserLoading(true);
      try {
        const response = await notificationService.users({ q: userSearch, targetType: currentCampaignForm.targetType, limit: 200 });
        if (!cancelled) setUserResults(response.data || []);
      } catch (error) {
        if (!cancelled) setMessage(error.message);
      } finally {
        if (!cancelled) setUserLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [currentCampaignForm.targetType, userSearch]);

  const selectedUserList = useMemo(() => selectedUserValues(currentCampaignForm.selectedUsers), [currentCampaignForm.selectedUsers]);
  const selectedUserSet = useMemo(() => new Set(selectedUserList), [selectedUserList]);
  const shouldSendNotification = ["notification", "both"].includes(currentCampaignForm.deliveryType);
  const shouldSendEmail = ["email", "both"].includes(currentCampaignForm.deliveryType);

  function setSelectedUserList(values) {
    const unique = [...new Set(values.map((item) => String(item || "").trim()).filter(Boolean))];
    setCurrentCampaignForm((current) => ({ ...current, selectedUsers: unique.join("\n") }));
  }

  function addSelectedUser(user) {
    setSelectedUserList([...selectedUserList, user.id || user.email || user.mobile]);
  }

  function selectVisibleUsers() {
    setSelectedUserList([...selectedUserList, ...userResults.map((user) => user.id || user.email || user.mobile)]);
  }

  function removeSelectedUser(value) {
    setSelectedUserList(selectedUserList.filter((item) => item !== value));
  }

  function applyCtaConfig(id, target = "send") {
    const selected = ctaConfigs.find((item) => String(item.id || item._id) === String(id));
    const patch = !id ? { ctaConfigId: "" } : {
      ctaConfigId: selected?.id || selected?._id || "",
      ctaText: selected?.ctaText || "",
      deepLink: selected?.ctaUrl || "/notifications",
    };
    if (target === "template") setTemplateForm((current) => ({ ...current, ...patch }));
    else setCurrentCampaignForm((current) => ({ ...current, ...patch }));
  }

  async function createCtaFromSendForm() {
    if (!currentCampaignForm.ctaText.trim() || !currentCampaignForm.deepLink.trim()) {
      setMessage("Enter CTA text and deep link first.");
      return;
    }
    setBusy(true);
    try {
      const response = await ctaConfigService.create({
        name: `${currentCampaignForm.campaignName || currentCampaignForm.title || currentCampaignForm.ctaText} CTA`,
        channel: "push",
        ctaText: currentCampaignForm.ctaText,
        ctaType: "custom_url",
        ctaUrl: currentCampaignForm.deepLink,
        openIn: "app",
      });
      const item = response.data;
      setCtaConfigs((current) => [item, ...current]);
      setCurrentCampaignForm((current) => ({ ...current, ctaConfigId: item?.id || item?._id || "" }));
      setMessage("Reusable push CTA created.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveTemplate(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (editingTemplateId) await notificationService.updateTemplate(editingTemplateId, templateForm);
      else await notificationService.createTemplate(templateForm);
      setTemplateForm(emptyTemplate);
      setEditingTemplateId("");
      await loadAll();
      setMessage("Template saved.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function sendNotification(event) {
    event.preventDefault();
    if (currentCampaignForm.targetType === "selected" && selectedUserList.length === 0) {
      setMessage("Select at least one user before sending.");
      return;
    }
    const payload = {
      ...currentCampaignForm,
      notificationType: "standard",
      scheduleDate: currentCampaignForm.scheduleDate ? new Date(currentCampaignForm.scheduleDate).toISOString() : "",
    };
    setBusy(true);
    setMessage("");
    try {
      let response;
      if (currentEditingCampaignId && currentCampaignForm.action !== "send") {
        response = await notificationService.updateScheduled(editingCampaignId, {
          ...payload,
          status: currentCampaignForm.action === "schedule" ? "pending" : "draft",
        });
      } else {
        response = await notificationService.send(payload);
        if (editingCampaignId && currentCampaignForm.action === "send") {
          await notificationService.cancelScheduled(editingCampaignId);
        }
      }
      await loadAll();
      setMessage(deliverySummaryMessage(response));
      if (currentCampaignForm.action === "send" || editingCampaignId) {
        setSendForm(emptySend);
        setEditingCampaignId("");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  function editCampaign(item) {
    setEditingCampaignId(item.id || item._id);
    const nextForm = {
      ...emptySend,
      ...item,
      action: item.status === "draft" ? "draft" : "schedule",
      scheduleDate: toInputDate(item.scheduleDate),
      selectedUsers: Array.isArray(item.selectedUsers) ? item.selectedUsers.join("\n") : item.selectedUsers || "",
    };
    setSendForm(nextForm);
    setTab("send");
  }

  async function cancelSchedule(id) {
    setBusy(true);
    try {
      await notificationService.cancelScheduled(id);
      await loadAll();
      setMessage("Scheduled notification cancelled.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function pauseSchedule(id) {
    setBusy(true);
    try {
      await notificationService.pauseScheduled(id);
      await loadAll();
      setMessage("Scheduled notification paused.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function resumeSchedule(id) {
    setBusy(true);
    try {
      await notificationService.resumeScheduled(id);
      await loadAll();
      setMessage("Scheduled notification resumed.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function sendTestNotification(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await notificationService.test(testForm);
      await loadAll();
      setMessage(deliverySummaryMessage(response, "Test notification processed."));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function processScheduled() {
    setBusy(true);
    try {
      await notificationService.processScheduled();
      await loadAll();
      setMessage("Due scheduled notifications processed.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  function toggleAutomationChannel(channel) {
    setAutomationForm((current) => {
      const currentSet = new Set(current.deliveryChannels);
      if (currentSet.has(channel)) currentSet.delete(channel);
      else currentSet.add(channel);
      return { ...current, deliveryChannels: [...currentSet] };
    });
  }

  function toggleAutomationDay(day) {
    setAutomationForm((current) => {
      const currentSet = new Set(current.weeklyDays.map(Number));
      if (currentSet.has(day)) currentSet.delete(day);
      else currentSet.add(day);
      return { ...current, weeklyDays: [...currentSet].sort((left, right) => left - right) };
    });
  }

  function automationPayload() {
    return {
      ...automationForm,
      action: "automate",
      timezone: automationForm.timezone || automationTimezone,
      monthlyDay: Number(automationForm.monthlyDay || 1),
      weeklyDays: automationForm.weeklyDays.map(Number),
      selectedUsers: automationForm.selectedUsers,
    };
  }

  async function saveAutomation(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const payload = automationPayload();
      if (editingAutomationId) await notificationService.updateAutomation(editingAutomationId, payload);
      else await notificationService.createAutomation(payload);
      setAutomationForm({ ...emptyAutomation, timezone: automationTimezone });
      setEditingAutomationId("");
      await loadAll();
      setMessage("Automated notification saved.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  function editAutomation(item) {
    setEditingAutomationId(item.id || item._id);
    setAutomationForm({
      ...emptyAutomation,
      ...item,
      timezone: item.timezone || automationTimezone,
      weeklyDays: Array.isArray(item.weeklyDays) && item.weeklyDays.length ? item.weeklyDays.map(Number) : [1],
      monthlyDay: item.monthlyDay || 1,
      deliveryChannels: Array.isArray(item.deliveryChannels) && item.deliveryChannels.length ? item.deliveryChannels : ["in_app", "push"],
      selectedUsers: Array.isArray(item.selectedUsers) ? item.selectedUsers.join("\n") : item.selectedUsers || "",
      automationEnabled: item.automationEnabled !== false && item.status !== "paused",
    });
    setTab("automated");
  }

  async function setAutomationStatus(item, enabled) {
    setBusy(true);
    try {
      await notificationService.setAutomationStatus(item.id || item._id, { enabled });
      await loadAll();
      setMessage(enabled ? "Automation enabled." : "Automation disabled.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteAutomation(item) {
    const ok = window.confirm("Are you sure you want to delete this automated notification?");
    if (!ok) return;
    setBusy(true);
    try {
      await notificationService.deleteAutomation(item.id || item._id);
      await loadAll();
      setMessage("Automated notification deleted.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  // Compact input classes
  const compactInput = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
  const compactSelect = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none";
  const compactTextarea = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y min-h-[40px]";

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
              <h1 className="text-sm font-semibold text-slate-900">Notification Center</h1>
              <p className="text-xs text-slate-500">Manage templates, campaigns, and automated notifications</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[9px] font-medium text-slate-700 rounded transition-colors" onClick={loadAll} disabled={busy}>
              <RefreshCw size={10} /> Refresh
            </button>
          </div>
        </div>
        {message && (
          <div className="mt-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[9px] font-medium text-indigo-700">
            {message}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-1 shadow-sm flex flex-wrap gap-0.5">
        {[
          ["send", "Send", Send],
          ["templates", "Templates", FileText],
          ["automated", "Automated", Settings],
          ["scheduled", "Scheduled", Calendar],
          ["history", "History", Clock],
          ["test", "Test", Zap],
          ["stats", "Stats", BarChart3],
        ].map(([key, label, Icon]) => {
          const isActive = tab === key;
          return (
            <button
              key={key}
              type="button"
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-medium rounded-lg transition-all",
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/25"
                  : "text-slate-600 hover:bg-slate-100"
              )}
              onClick={() => setTab(key)}
            >
              <Icon size={10} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Send Tab */}
      {tab === "send" && (
        <form className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm space-y-3" onSubmit={sendNotification}>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Send size={14} className="text-indigo-600" />
            <h2 className="text-xs font-semibold text-slate-900">{editingCampaignId ? "Edit Campaign" : "Create Campaign"}</h2>
          </div>

          {/* Audience Cards */}
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {audiences.map((item) => (
              <button
                key={item.value}
                type="button"
                className={cn(
                  "rounded-lg border p-2 text-left transition-all",
                  currentCampaignForm.targetType === item.value
                    ? "border-indigo-300 bg-indigo-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                )}
                onClick={() => setCurrentCampaignForm((current) => ({ ...current, targetType: item.value }))}
              >
                <div className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">
                  {targetOptions.find((option) => option.value === item.value)?.label || item.value}
                </div>
                <div className="text-sm font-bold text-slate-900">{item.count || 0}</div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Campaign Name</label>
              <input className={compactInput} value={currentCampaignForm.campaignName} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, campaignName: event.target.value }))} placeholder="August campaign" />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Delivery</label>
              <select className={compactSelect} value={currentCampaignForm.deliveryType} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, deliveryType: event.target.value }))}>
                {deliveryOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Template</label>
              <select className={compactSelect} value={currentCampaignForm.templateId} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, templateId: event.target.value }))}>
                <option value="">Custom</option>
                {templates.filter((item) => item.status !== false).map((item) => <option key={item.id || item._id} value={item.id || item._id}>{item.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Audience</label>
              <select className={compactSelect} value={currentCampaignForm.targetType} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, targetType: event.target.value }))}>
                {targetOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Category</label>
              <select className={compactSelect} value={currentCampaignForm.category} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, category: event.target.value }))}>
                {categoryOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Sound</label>
              <select className={compactSelect} value={currentCampaignForm.sound} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, sound: event.target.value }))}>
                <option value="default">Default</option><option value="custom">Custom</option><option value="silent">Silent</option>
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Priority</label>
              <select className={compactSelect} value={currentCampaignForm.priority} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, priority: event.target.value }))}>
                <option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option>
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Action</label>
              <select className={compactSelect} value={currentCampaignForm.action} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, action: event.target.value }))}>
                <option value="send">Send Now</option><option value="schedule">Schedule</option><option value="draft">Save Draft</option>
              </select>
            </div>
            {currentCampaignForm.action === "schedule" && (
              <div className="flex flex-col gap-0.5">
                <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Schedule Date</label>
                <input className={compactInput} type="datetime-local" value={currentCampaignForm.scheduleDate} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, scheduleDate: event.target.value }))} required />
              </div>
            )}
          </div>

          {/* Notification Content */}
          {shouldSendNotification && (
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[7px] font-medium text-slate-500 uppercase tracking-wider mb-1">Notification Content</div>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Title</label>
                  <input className={compactInput} value={currentCampaignForm.title} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, title: event.target.value }))} required={shouldSendNotification} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Image URL</label>
                  <input className={compactInput} value={currentCampaignForm.image} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, image: event.target.value }))} />
                </div>
                <div className="flex flex-col gap-0.5 sm:col-span-2">
                  <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Message</label>
                  <textarea className={compactTextarea} rows={3} value={currentCampaignForm.message} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, message: event.target.value }))} required={shouldSendNotification} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">CTA Text</label>
                  <input className={compactInput} value={currentCampaignForm.ctaText} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, ctaText: event.target.value }))} placeholder="Learn More" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Deep Link</label>
                  <input className={compactInput} value={currentCampaignForm.deepLink} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, deepLink: event.target.value }))} placeholder="/dashboard" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Managed CTA</label>
                  <select className={compactSelect} value={currentCampaignForm.ctaConfigId} onChange={(event) => applyCtaConfig(event.target.value)}>
                    <option value="">Custom</option>
                    {ctaConfigs.map((item) => <option key={item.id || item._id} value={item.id || item._id}>{item.name}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="button" className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[8px] font-medium text-slate-700 rounded transition-colors" onClick={createCtaFromSendForm}>
                    <Plus size={9} /> Save as CTA
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Email Content */}
          {shouldSendEmail && (
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[7px] font-medium text-slate-500 uppercase tracking-wider mb-1">Email Content</div>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Email Template</label>
                  <select className={compactSelect} value={currentCampaignForm.emailTemplateId} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, emailTemplateId: event.target.value }))}>
                    <option value="">Custom</option>
                    {emailTemplates.map((item) => <option key={item.id || item.status?.templateId || item.key} value={item.id || item.status?.templateId || item.key}>{item.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Email Subject</label>
                  <input className={compactInput} value={currentCampaignForm.emailSubject} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, emailSubject: event.target.value }))} required={shouldSendEmail} />
                </div>
                <div className="flex flex-col gap-0.5 sm:col-span-2">
                  <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Email Body</label>
                  <textarea className={compactTextarea} rows={4} value={currentCampaignForm.emailBody} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, emailBody: event.target.value }))} required={shouldSendEmail} />
                </div>
              </div>
            </div>
          )}

          {/* Selected Users */}
          {currentCampaignForm.targetType === "selected" && (
            <div className="pt-2 border-t border-slate-100">
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Search Users</label>
                  <input className={compactInput} placeholder="Search name, email, mobile..." value={userSearch} onChange={(event) => setUserSearch(event.target.value)} />
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                    {userLoading && <div className="p-2 text-[8px] text-slate-500">Searching...</div>}
                    {!userLoading && !userResults.length && <div className="p-2 text-[8px] text-slate-500">No users found</div>}
                    {userResults.map((user) => {
                      const selected = selectedUserSet.has(user.id);
                      return (
                        <button
                          key={user.id}
                          type="button"
                          className={cn(
                            "flex w-full items-center justify-between gap-2 border-b border-slate-100 px-2 py-1.5 text-left transition last:border-b-0",
                            selected ? "bg-indigo-50" : "hover:bg-slate-50"
                          )}
                          onClick={() => addSelectedUser(user)}
                          disabled={selected}
                        >
                          <span className="text-[8px] font-medium text-slate-900 truncate">{user.name || user.email || user.mobile}</span>
                          <span className={cn(
                            "px-1 py-0.5 rounded text-[6px] font-medium",
                            user.tokenCount > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                          )}>
                            {user.tokenCount > 0 ? `${user.tokenCount} token` : "No token"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-1">
                    <button type="button" className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-[7px] font-medium text-slate-700 rounded transition-colors" onClick={selectVisibleUsers}>Select Visible</button>
                    <button type="button" className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-[7px] font-medium text-slate-700 rounded transition-colors" onClick={() => setSelectedUserList([])}>Clear</button>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Selected Users</label>
                  <textarea className={compactTextarea} rows={4} value={currentCampaignForm.selectedUsers} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, selectedUsers: event.target.value }))} placeholder="IDs, emails, or mobiles" />
                  <div className="flex flex-wrap gap-0.5">
                    {selectedUserList.map((value) => (
                      <button key={value} type="button" className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 rounded text-[7px] font-medium text-indigo-700" onClick={() => removeSelectedUser(value)}>
                        {value} <X size={8} className="inline" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-1 border-t border-slate-100">
            <button className={cn(
              "inline-flex items-center gap-0.5 px-3 py-0.5 text-[8px] font-medium rounded-lg transition-all",
              "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm shadow-indigo-500/25",
              busy && "opacity-50 cursor-not-allowed"
            )} disabled={busy} type="submit">
              <Send size={9} /> {busy ? "Working..." : currentCampaignForm.action === "send" ? "Send Now" : currentCampaignForm.action === "schedule" ? "Schedule" : "Save Draft"}
            </button>
          </div>
        </form>
      )}

      {/* Templates Tab */}
      {tab === "templates" && (
        <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm space-y-3">
          <form onSubmit={saveTemplate} className="space-y-2">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <FileText size={14} className="text-indigo-600" />
              <h2 className="text-xs font-semibold text-slate-900">{editingTemplateId ? "Edit Template" : "Create Template"}</h2>
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              <div className="flex flex-col gap-0.5">
                <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Name</label>
                <input className={compactInput} value={templateForm.name} onChange={(event) => setTemplateForm((current) => ({ ...current, name: event.target.value }))} required />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Title</label>
                <input className={compactInput} value={templateForm.title} onChange={(event) => setTemplateForm((current) => ({ ...current, title: event.target.value }))} required />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Audience</label>
                <select className={compactSelect} value={templateForm.targetType} onChange={(event) => setTemplateForm((current) => ({ ...current, targetType: event.target.value }))}>
                  {targetOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-0.5 sm:col-span-3">
                <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Message</label>
                <textarea className={compactTextarea} rows={3} value={templateForm.message} onChange={(event) => setTemplateForm((current) => ({ ...current, message: event.target.value }))} required />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Image URL</label>
                <input className={compactInput} value={templateForm.image} onChange={(event) => setTemplateForm((current) => ({ ...current, image: event.target.value }))} />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Deep Link</label>
                <input className={compactInput} value={templateForm.deepLink} onChange={(event) => setTemplateForm((current) => ({ ...current, deepLink: event.target.value }))} />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">CTA Text</label>
                <input className={compactInput} value={templateForm.ctaText} onChange={(event) => setTemplateForm((current) => ({ ...current, ctaText: event.target.value }))} />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Category</label>
                <select className={compactSelect} value={templateForm.category} onChange={(event) => setTemplateForm((current) => ({ ...current, category: event.target.value }))}>
                  {categoryOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Managed CTA</label>
                <select className={compactSelect} value={templateForm.ctaConfigId} onChange={(event) => applyCtaConfig(event.target.value, "template")}>
                  <option value="">Custom</option>
                  {ctaConfigs.map((item) => <option key={item.id || item._id} value={item.id || item._id}>{item.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-1">
              <button className={cn(
                "inline-flex items-center gap-0.5 px-2.5 py-0.5 text-[8px] font-medium rounded-lg transition-all",
                "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm shadow-indigo-500/25",
                busy && "opacity-50 cursor-not-allowed"
              )} disabled={busy} type="submit">
                <Save size={9} /> {editingTemplateId ? "Update" : "Save"}
              </button>
              {editingTemplateId && (
                <button type="button" className="px-2.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-[8px] font-medium text-slate-700 rounded-lg transition-colors" onClick={() => { setEditingTemplateId(""); setTemplateForm(emptyTemplate); }}>
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="pt-2 border-t border-slate-100">
            <div className="text-[7px] font-medium text-slate-500 uppercase tracking-wider mb-1">Saved Templates ({templates.length})</div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((item) => (
                <div key={item.id || item._id} className="bg-slate-50 rounded-lg border border-slate-200/50 p-2">
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <div className="text-[9px] font-semibold text-slate-900 truncate">{item.name}</div>
                      <div className="text-[7px] text-slate-400">{item.title}</div>
                    </div>
                    <div className="flex gap-0.5">
                      <button className="p-0.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" onClick={() => { setEditingTemplateId(item.id || item._id); setTemplateForm({ ...emptyTemplate, ...item }); }}>
                        <Edit size={10} />
                      </button>
                      <button className="p-0.5 text-rose-600 hover:bg-rose-50 rounded transition-colors" onClick={async () => { await notificationService.deleteTemplate(item.id || item._id); await loadAll(); }}>
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    <span className={cn(
                      "px-1 py-0.5 rounded text-[6px] font-medium",
                      item.status !== false ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    )}>
                      {item.status !== false ? "Active" : "Inactive"}
                    </span>
                    <span className="px-1 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[6px] font-medium">{item.targetType}</span>
                  </div>
                </div>
              ))}
              {!templates.length && <div className="col-span-full text-[9px] text-slate-400 text-center py-4">No templates created yet</div>}
            </div>
          </div>
        </div>
      )}

      {/* Automated Tab */}
      {tab === "automated" && (
        <div className="space-y-3">
          <form className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm space-y-2" onSubmit={saveAutomation}>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Settings size={14} className="text-indigo-600" />
              <h2 className="text-xs font-semibold text-slate-900">{editingAutomationId ? "Edit Automation" : "Create Automation"}</h2>
              {editingAutomationId && (
                <button type="button" className="ml-auto px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[8px] font-medium text-slate-700 rounded transition-colors" onClick={() => { setEditingAutomationId(""); setAutomationForm({ ...emptyAutomation, timezone: automationTimezone }); }}>
                  Cancel
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              <div className="flex flex-col gap-0.5">
                <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Name</label>
                <input className={compactInput} value={automationForm.campaignName} onChange={(event) => setAutomationForm((current) => ({ ...current, campaignName: event.target.value }))} required />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Schedule</label>
                <select className={compactSelect} value={automationForm.scheduleType} onChange={(event) => setAutomationForm((current) => ({ ...current, scheduleType: event.target.value }))}>
                  <option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Time</label>
                <input className={compactInput} type="time" value={automationForm.scheduleTime} onChange={(event) => setAutomationForm((current) => ({ ...current, scheduleTime: event.target.value }))} required />
              </div>
            </div>

            {/* Weekly Days */}
            {automationForm.scheduleType === "weekly" && (
              <div className="flex flex-wrap gap-1">
                {weekDayOptions.map((day) => (
                  <label key={day.value} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[7px] font-medium text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="checkbox" className="h-3 w-3 rounded border-slate-300 text-indigo-600 focus:ring-1 focus:ring-indigo-500/20" checked={automationForm.weeklyDays.map(Number).includes(day.value)} onChange={() => toggleAutomationDay(day.value)} />
                    {day.label.slice(0, 3)}
                  </label>
                ))}
              </div>
            )}

            {/* Monthly Day */}
            {automationForm.scheduleType === "monthly" && (
              <div className="flex flex-col gap-0.5 max-w-[120px]">
                <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Day of Month</label>
                <input className={compactInput} type="number" min="1" max="31" value={automationForm.monthlyDay} onChange={(event) => setAutomationForm((current) => ({ ...current, monthlyDay: event.target.value }))} required />
              </div>
            )}

            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              <div className="flex flex-col gap-0.5">
                <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Channels</label>
                <div className="flex flex-wrap gap-1">
                  {automationChannelOptions.map((channel) => (
                    <label key={channel.value} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[7px] font-medium text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors">
                      <input type="checkbox" className="h-3 w-3 rounded border-slate-300 text-indigo-600 focus:ring-1 focus:ring-indigo-500/20" checked={automationForm.deliveryChannels.includes(channel.value)} onChange={() => toggleAutomationChannel(channel.value)} />
                      {channel.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Audience</label>
                <select className={compactSelect} value={automationForm.targetType} onChange={(event) => setAutomationForm((current) => ({ ...current, targetType: event.target.value }))}>
                  {targetOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Status</label>
                <select className={compactSelect} value={automationForm.automationEnabled ? "enabled" : "disabled"} onChange={(event) => setAutomationForm((current) => ({ ...current, automationEnabled: event.target.value === "enabled" }))}>
                  <option value="enabled">Enabled</option><option value="disabled">Disabled</option>
                </select>
              </div>
            </div>

            {/* Notification Content */}
            {(automationShouldInApp || automationShouldPush) && (
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[7px] font-medium text-slate-500 uppercase tracking-wider mb-1">Notification Content</div>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Title</label>
                    <input className={compactInput} value={automationForm.title} onChange={(event) => setAutomationForm((current) => ({ ...current, title: event.target.value }))} required={automationShouldInApp || automationShouldPush} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Deep Link</label>
                    <input className={compactInput} value={automationForm.deepLink} onChange={(event) => setAutomationForm((current) => ({ ...current, deepLink: event.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-0.5 sm:col-span-2">
                    <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Message</label>
                    <textarea className={compactTextarea} rows={3} value={automationForm.message} onChange={(event) => setAutomationForm((current) => ({ ...current, message: event.target.value }))} required={automationShouldInApp || automationShouldPush} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">CTA Text</label>
                    <input className={compactInput} value={automationForm.ctaText} onChange={(event) => setAutomationForm((current) => ({ ...current, ctaText: event.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Category</label>
                    <select className={compactSelect} value={automationForm.category} onChange={(event) => setAutomationForm((current) => ({ ...current, category: event.target.value }))}>
                      {categoryOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Email Content */}
            {automationShouldEmail && (
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[7px] font-medium text-slate-500 uppercase tracking-wider mb-1">Email Content</div>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Email Template</label>
                    <select className={compactSelect} value={automationForm.emailTemplateId} onChange={(event) => setAutomationForm((current) => ({ ...current, emailTemplateId: event.target.value }))}>
                      <option value="">Custom</option>
                      {emailTemplates.map((item) => <option key={item.id || item.status?.templateId || item.key} value={item.id || item.status?.templateId || item.key}>{item.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Email Subject</label>
                    <input className={compactInput} value={automationForm.emailSubject} onChange={(event) => setAutomationForm((current) => ({ ...current, emailSubject: event.target.value }))} required={automationShouldEmail} />
                  </div>
                  <div className="flex flex-col gap-0.5 sm:col-span-2">
                    <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Email Body</label>
                    <textarea className={compactTextarea} rows={4} value={automationForm.emailBody} onChange={(event) => setAutomationForm((current) => ({ ...current, emailBody: event.target.value }))} required={automationShouldEmail} />
                  </div>
                </div>
              </div>
            )}

            {/* Selected Users */}
            {automationForm.targetType === "selected" && (
              <div className="pt-2 border-t border-slate-100">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Selected Users</label>
                  <textarea className={compactTextarea} rows={3} value={automationForm.selectedUsers} onChange={(event) => setAutomationForm((current) => ({ ...current, selectedUsers: event.target.value }))} placeholder="IDs, emails, or mobiles" />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
              <div className="text-[8px] text-slate-500">Audience: <span className="font-semibold text-slate-700">{automationAudienceCount}</span> users</div>
              <button className={cn(
                "ml-auto inline-flex items-center gap-0.5 px-2.5 py-0.5 text-[8px] font-medium rounded-lg transition-all",
                "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm shadow-indigo-500/25",
                busy && "opacity-50 cursor-not-allowed"
              )} disabled={busy} type="submit">
                <Save size={9} /> {editingAutomationId ? "Update" : "Save"}
              </button>
            </div>
          </form>

          {/* Automations List */}
          <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings size={12} className="text-indigo-600" />
                <span className="text-[8px] font-medium text-slate-600">Automated Notifications</span>
              </div>
              <span className="text-[7px] text-slate-400">{automations.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-slate-100 text-[8px]">
                <thead className="bg-slate-50/50">
                  <tr>
                    {["Name", "Schedule", "Audience", "Channels", "Status", "Next Send", "Actions"].map((x) => (
                      <th key={x} className="px-2 py-1 text-left text-[7px] font-bold uppercase tracking-wider text-slate-400">{x}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {automations.map((item) => (
                    <tr key={item.id || item._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-2 py-1.5 text-[8px] font-medium text-slate-900">{item.campaignName || item.title || "-"}</td>
                      <td className="px-2 py-1.5 text-[7px] text-slate-600">{item.scheduleLabel || `${item.scheduleType} ${item.scheduleTime || ""}`}</td>
                      <td className="px-2 py-1.5 text-[7px] text-slate-600">{targetOptions.find((opt) => opt.value === item.targetType)?.label || item.targetType}</td>
                      <td className="px-2 py-1.5 text-[7px] text-slate-600">{channelLabel(item.deliveryChannels, item.deliveryType)}</td>
                      <td className="px-2 py-1.5">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[6px] font-medium",
                          item.automationEnabled !== false && item.status !== "paused" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        )}>
                          {item.automationEnabled !== false && item.status !== "paused" ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-[7px] text-slate-500">{formatNextSend(item.nextScheduledAt || item.nextSendAt || item.scheduleDate, nowTick)}</td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-0.5">
                          <button className="p-0.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" onClick={() => editAutomation(item)}>
                            <Edit size={10} />
                          </button>
                          <button className="p-0.5 text-rose-600 hover:bg-rose-50 rounded transition-colors" onClick={() => deleteAutomation(item)}>
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!automations.length && (
                    <tr>
                      <td colSpan={7} className="px-4 py-4 text-center text-[8px] text-slate-400">No automated notifications</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Tab */}
      {tab === "scheduled" && (
        <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={12} className="text-indigo-600" />
              <span className="text-[8px] font-medium text-slate-600">Scheduled Notifications</span>
            </div>
            <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[7px] font-medium rounded transition-colors" onClick={processScheduled} disabled={busy}>
              <Play size={8} /> Process Due
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-100 text-[8px]">
              <thead className="bg-slate-50/50">
                <tr>
                  {["Campaign", "Delivery", "Audience", "Schedule", "Status", "Actions"].map((x) => (
                    <th key={x} className="px-2 py-1 text-left text-[7px] font-bold uppercase tracking-wider text-slate-400">{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scheduled.map((item) => (
                  <tr key={item.id || item._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-2 py-1.5 text-[8px] font-medium text-slate-900">{item.campaignName || item.title || "-"}</td>
                    <td className="px-2 py-1.5 text-[7px] text-slate-600">{item.deliveryType || "notification"}</td>
                    <td className="px-2 py-1.5 text-[7px] text-slate-600">{targetOptions.find((opt) => opt.value === item.targetType)?.label || item.targetType}</td>
                    <td className="px-2 py-1.5 text-[7px] text-slate-500">
                      {item.scheduleDate ? toInputDate(item.scheduleDate).replace("T", " ") : "-"}
                      {item.recurring && ` | ${item.recurrence}`}
                    </td>
                    <td className="px-2 py-1.5">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[6px] font-medium",
                        item.status === "pending" ? "bg-amber-100 text-amber-700" :
                        item.status === "paused" ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-500"
                      )}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-0.5">
                        {["pending", "draft", "paused"].includes(item.status) && (
                          <button className="p-0.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" onClick={() => editCampaign(item)}>
                            <Edit size={10} />
                          </button>
                        )}
                        {item.status === "pending" && (
                          <button className="p-0.5 text-amber-600 hover:bg-amber-50 rounded transition-colors" onClick={() => pauseSchedule(item.id || item._id)}>
                            <Pause size={10} />
                          </button>
                        )}
                        {item.status === "paused" && (
                          <button className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors" onClick={() => resumeSchedule(item.id || item._id)}>
                            <Play size={10} />
                          </button>
                        )}
                        {["pending", "draft", "paused"].includes(item.status) && (
                          <button className="p-0.5 text-rose-600 hover:bg-rose-50 rounded transition-colors" onClick={() => cancelSchedule(item.id || item._id)}>
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!scheduled.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-center text-[8px] text-slate-400">No scheduled notifications</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === "history" && (
        <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2">
            <Clock size={12} className="text-indigo-600" />
            <span className="text-[8px] font-medium text-slate-600">Delivery History</span>
            <span className="text-[7px] text-slate-400 ml-auto">{history.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-100 text-[8px]">
              <thead className="bg-slate-50/50">
                <tr>
                  {["Campaign", "Delivery", "Audience", "Push Sent", "Push Delivered", "Email Sent", "Failed", "Status"].map((x) => (
                    <th key={x} className="px-2 py-1 text-left text-[7px] font-bold uppercase tracking-wider text-slate-400">{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((item) => (
                  <tr key={item.id || item._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-2 py-1.5 text-[8px] font-medium text-slate-900">{item.campaignName || item.title || "-"}</td>
                    <td className="px-2 py-1.5 text-[7px] text-slate-600">{item.deliveryType || "notification"}</td>
                    <td className="px-2 py-1.5 text-[7px] text-slate-600">{targetOptions.find((opt) => opt.value === item.targetType)?.label || item.targetType}</td>
                    <td className="px-2 py-1.5 text-[7px] text-slate-600">{item.sentCount || 0}</td>
                    <td className="px-2 py-1.5 text-[7px] text-slate-600">{item.successCount || 0}</td>
                    <td className="px-2 py-1.5 text-[7px] text-slate-600">{item.emailSentCount || 0}</td>
                    <td className="px-2 py-1.5 text-[7px] text-rose-600">{Number(item.failedCount || 0) + Number(item.emailFailedCount || 0)}</td>
                    <td className="px-2 py-1.5">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[6px] font-medium",
                        item.status === "sent" ? "bg-emerald-100 text-emerald-700" :
                        item.status === "failed" ? "bg-rose-100 text-rose-700" :
                        "bg-slate-100 text-slate-500"
                      )}>
                        {item.status || "draft"}
                      </span>
                    </td>
                  </tr>
                ))}
                {!history.length && (
                  <tr>
                    <td colSpan={8} className="px-4 py-4 text-center text-[8px] text-slate-400">No delivery history</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Test Tab */}
      {tab === "test" && (
        <form className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm space-y-2" onSubmit={sendTestNotification}>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Zap size={14} className="text-indigo-600" />
            <h2 className="text-xs font-semibold text-slate-900">Test Notification</h2>
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Delivery</label>
              <select className={compactSelect} value={testForm.deliveryType} onChange={(event) => setTestForm((current) => ({ ...current, deliveryType: event.target.value }))}>
                {deliveryOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Target</label>
              <select className={compactSelect} value={testForm.testTarget} onChange={(event) => setTestForm((current) => ({ ...current, testTarget: event.target.value }))}>
                <option value="admin">Admin Device</option><option value="selected">Test User</option><option value="email">Email</option>
              </select>
            </div>
            {testForm.testTarget === "selected" && (
              <div className="flex flex-col gap-0.5">
                <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">User</label>
                <input className={compactInput} value={testForm.selectedUsers} onChange={(event) => setTestForm((current) => ({ ...current, selectedUsers: event.target.value }))} placeholder="User ID or email" />
              </div>
            )}
            {testForm.testTarget === "email" && (
              <div className="flex flex-col gap-0.5">
                <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Email</label>
                <input className={compactInput} type="email" value={testForm.testEmail} onChange={(event) => setTestForm((current) => ({ ...current, testEmail: event.target.value }))} placeholder="test@example.com" />
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Title</label>
              <input className={compactInput} value={testForm.title} onChange={(event) => setTestForm((current) => ({ ...current, title: event.target.value }))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Deep Link</label>
              <input className={compactInput} value={testForm.deepLink} onChange={(event) => setTestForm((current) => ({ ...current, deepLink: event.target.value }))} />
            </div>
            <div className="flex flex-col gap-0.5 sm:col-span-2">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Message</label>
              <textarea className={compactTextarea} rows={3} value={testForm.message} onChange={(event) => setTestForm((current) => ({ ...current, message: event.target.value }))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Email Subject</label>
              <input className={compactInput} value={testForm.emailSubject} onChange={(event) => setTestForm((current) => ({ ...current, emailSubject: event.target.value }))} />
            </div>
            <div className="flex flex-col gap-0.5 sm:col-span-2">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Email Body</label>
              <textarea className={compactTextarea} rows={4} value={testForm.emailBody} onChange={(event) => setTestForm((current) => ({ ...current, emailBody: event.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end pt-1 border-t border-slate-100">
            <button className={cn(
              "inline-flex items-center gap-0.5 px-3 py-0.5 text-[8px] font-medium rounded-lg transition-all",
              "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm shadow-indigo-500/25",
              busy && "opacity-50 cursor-not-allowed"
            )} disabled={busy} type="submit">
              <Send size={9} /> Send Test
            </button>
          </div>
        </form>
      )}

      {/* Stats Tab */}
      {tab === "stats" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              ["Total", stats?.totalNotifications || 0],
              ["Today", stats?.todayNotifications || 0],
              ["Delivered", stats?.delivered || 0],
              ["Failed", stats?.failed || 0],
              ["Device Tokens", stats?.activeDeviceTokens || 0],
            ].map(([label, value]) => (
              <div key={label} className="bg-white rounded-lg border border-slate-200/60 px-3 py-2 shadow-sm">
                <div className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">{label}</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{value}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
            <div className="text-[8px] font-medium text-slate-600 mb-2">Sent Trend</div>
            <div className="space-y-1">
              {(stats?.sentTrend || []).map((item) => (
                <div key={item._id} className="flex items-center justify-between bg-slate-50 rounded px-2 py-1 text-[7px]">
                  <span className="font-medium text-slate-700">{item._id}</span>
                  <span className="text-slate-500">Sent {item.sent || 0} | Delivered {item.delivered || 0} | Failed {item.failed || 0}</span>
                </div>
              ))}
              {!stats?.sentTrend?.length && <div className="text-[7px] text-slate-400 text-center py-2">No trend data available</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}