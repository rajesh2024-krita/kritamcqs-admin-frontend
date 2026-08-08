import { useEffect, useMemo, useState } from "react";
import { notificationService } from "../api/notificationService";
import { emailTemplateService } from "../api/emailTemplateService";
import { ctaConfigService } from "../api/ctaConfigService";
import { cn, ui } from "../ui";

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
  { value: "both", label: "Push Notification + Email" },
];
const automationChannelOptions = [
  { value: "in_app", label: "In-App Notification" },
  { value: "push", label: "Push Notification" },
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
    parts.push(`Notification delivered: ${Number(push.successCount || 0)}, failed: ${Number(push.failedCount || 0)}, no token: ${Number(push.noTokenCount || 0)}`);
  }
  if (Number(email.emailSentCount || 0) || Number(email.emailFailedCount || 0) || Number(email.emailSkippedCount || 0)) {
    parts.push(`Email sent: ${Number(email.emailSentCount || 0)}, failed: ${Number(email.emailFailedCount || 0)}, skipped: ${Number(email.emailSkippedCount || 0)}`);
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
  return date.toLocaleString();
}

export function NotificationCenterPage() {
  const [tab, setTab] = useState("send");
  const [templates, setTemplates] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [ctaConfigs, setCtaConfigs] = useState([]);
  const [history, setHistory] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [automationHistory, setAutomationHistory] = useState([]);
  const [automationTimezone, setAutomationTimezone] = useState("Asia/Kolkata");
  const [automationAudienceCount, setAutomationAudienceCount] = useState(0);
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
      setMessage("Select at least one user before sending a test push.");
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
    const ok = window.confirm("Are you sure you want to delete this automated notification? This will stop all future scheduled notifications.");
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

  async function showAutomationHistory(item) {
    setBusy(true);
    try {
      const response = await notificationService.automationHistory(item.id || item._id, { limit: 20 });
      setAutomationHistory(response.data || []);
      setMessage(`Loaded execution history for ${item.campaignName || item.title || "automation"}.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <div className={ui.eyebrow}>Push Notifications</div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Notification Center</h1>
            <p className={ui.muted}>Manage templates, send push notifications, schedule campaigns, and review delivery history.</p>
          </div>
          <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={loadAll} disabled={busy}>Refresh</button>
        </div>
        {message ? <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">{message}</div> : null}
      </section>

      <section className={ui.panel}>
        <div className="grid gap-3 md:grid-cols-7">
          {[
            ["send", "Send Notification"],
            ["templates", "Templates"],
            ["automated", "Scheduled / Automated Notifications"],
            ["scheduled", "Scheduled"],
            ["history", "History"],
            ["test", "Testing"],
            ["stats", "Stats"],
          ].map(([key, label]) => (
            <button key={key} type="button" className={cn(ui.buttonBase, tab === key ? ui.buttonPrimary : ui.buttonSecondary)} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>
      </section>

      {tab === "send" ? (
        <>
        <form className={ui.panel} onSubmit={sendNotification}>
          <h2 className="mb-4 text-xl font-black text-slate-900">
            {editingCampaignId ? "Edit Campaign" : "Create Campaign"}
          </h2>
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            {audiences.map((item) => (
              <button key={item.value} type="button" className={cn("rounded-xl border px-4 py-3 text-left", currentCampaignForm.targetType === item.value ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-slate-50")} onClick={() => setCurrentCampaignForm((current) => ({ ...current, targetType: item.value }))}>
                <span className={ui.eyebrow}>{targetOptions.find((option) => option.value === item.value)?.label || item.value}</span>
                <span className="mt-1 block text-2xl font-black text-slate-900">{item.count || 0}</span>
              </button>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <label className={ui.field}><span>Campaign Name</span><input className={ui.input} value={currentCampaignForm.campaignName} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, campaignName: event.target.value }))} placeholder="August premium announcement" /></label>
            <label className={ui.field}><span>Delivery Channel</span><select className={ui.input} value={currentCampaignForm.deliveryType} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, deliveryType: event.target.value }))}>{deliveryOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className={ui.field}><span>Use Template</span><select className={ui.input} value={currentCampaignForm.templateId} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, templateId: event.target.value }))}><option value="">Custom Notification</option>{templates.filter((item) => item.status !== false).map((item) => <option key={item.id || item._id} value={item.id || item._id}>{item.name}</option>)}</select></label>
            <label className={ui.field}><span>Target Audience</span><select className={ui.input} value={currentCampaignForm.targetType} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, targetType: event.target.value }))}>{targetOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className={ui.field}><span>Category</span><select className={ui.input} value={currentCampaignForm.category} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, category: event.target.value }))}>{categoryOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            {shouldSendNotification ? <>
              <label className={ui.field}><span>Notification Title</span><input className={ui.input} value={currentCampaignForm.title} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, title: event.target.value }))} required={shouldSendNotification} /></label>
              <label className={cn(ui.field, "lg:col-span-3")}><span>Notification Message</span><textarea className={ui.textarea} value={currentCampaignForm.message} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, message: event.target.value }))} required={shouldSendNotification} /></label>
              <label className={ui.field}><span>Managed CTA</span><select className={ui.input} value={currentCampaignForm.ctaConfigId} onChange={(event) => applyCtaConfig(event.target.value)}><option value="">Custom CTA / None</option>{ctaConfigs.map((item) => <option key={item.id || item._id} value={item.id || item._id}>{item.name} - {item.ctaText}</option>)}</select></label>
              <label className={ui.field}><span>CTA Button Text</span><input className={ui.input} value={currentCampaignForm.ctaText} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, ctaText: event.target.value }))} placeholder="Open App" /></label>
              <label className={ui.field}><span>CTA Action / Deep Link</span><input className={ui.input} list="notification-deep-links" value={currentCampaignForm.deepLink} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, deepLink: event.target.value }))} /><datalist id="notification-deep-links">{deepLinks.map((item) => <option key={item} value={item} />)}</datalist></label>
              <label className={ui.field}><span>Target Screen</span><input className={ui.input} value={currentCampaignForm.targetScreen} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, targetScreen: event.target.value }))} placeholder="subscription" /></label>
              <div className="flex items-end"><button type="button" className={cn(ui.buttonBase, ui.buttonSecondary, "w-full")} onClick={createCtaFromSendForm}>Save As New CTA</button></div>
              <label className={ui.field}><span>Image URL</span><input className={ui.input} value={currentCampaignForm.image} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, image: event.target.value }))} /></label>
            </> : null}
            {shouldSendEmail ? <>
              <label className={ui.field}><span>Email Template</span><select className={ui.input} value={currentCampaignForm.emailTemplateId} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, emailTemplateId: event.target.value }))} required={shouldSendEmail}><option value="">Select Email Template</option>{emailTemplates.map((item) => <option key={item.id || item.status?.templateId || item.key} value={item.id || item.status?.templateId || item.key}>{item.name}</option>)}</select></label>
              <label className={cn(ui.field, "lg:col-span-2")}><span>Email Subject</span><input className={ui.input} value={currentCampaignForm.emailSubject} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, emailSubject: event.target.value }))} required={shouldSendEmail} /></label>
              <label className={cn(ui.field, "lg:col-span-3")}><span>Email Body</span><textarea className={cn(ui.textarea, "min-h-56")} value={currentCampaignForm.emailBody} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, emailBody: event.target.value }))} required={shouldSendEmail} /></label>
            </> : null}
            <label className={ui.field}><span>Sound</span><select className={ui.input} value={currentCampaignForm.sound} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, sound: event.target.value }))}><option value="default">Default</option><option value="custom">Custom</option><option value="silent">Silent</option></select></label>
            <label className={ui.field}><span>Priority</span><select className={ui.input} value={currentCampaignForm.priority} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, priority: event.target.value }))}><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select></label>
            <label className={ui.field}><span>Action</span><select className={ui.input} value={currentCampaignForm.action} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, action: event.target.value }))}><option value="send">Send Immediately</option><option value="schedule">Schedule</option><option value="draft">Save Draft</option></select></label>
            {currentCampaignForm.action === "schedule" ? <label className={ui.field}><span>Schedule Date</span><input className={ui.input} type="datetime-local" value={currentCampaignForm.scheduleDate} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, scheduleDate: event.target.value }))} required /></label> : null}
            {currentCampaignForm.action === "schedule" ? (
              <>
                <label className={ui.field}><span>Recurring</span><select className={ui.input} value={currentCampaignForm.recurring ? currentCampaignForm.recurrence : "none"} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, recurring: event.target.value !== "none", recurrence: event.target.value }))}><option value="none">No Repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="custom">Custom Interval</option></select></label>
                {currentCampaignForm.recurring && currentCampaignForm.recurrence === "custom" ? <><label className={ui.field}><span>Interval</span><input className={ui.input} type="number" min="1" value={currentCampaignForm.recurrenceInterval} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, recurrenceInterval: event.target.value }))} /></label><label className={ui.field}><span>Interval Unit</span><select className={ui.input} value={currentCampaignForm.recurrenceUnit} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, recurrenceUnit: event.target.value }))}><option>Minutes</option><option>Hours</option><option>Days</option></select></label></> : null}
              </>
            ) : null}
            {currentCampaignForm.targetType ? (
              <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                  <div className="space-y-3">
                    <label className={ui.field}>
                      <span>Search / Select Users</span>
                      <input className={ui.input} placeholder="Search name, email, mobile, or user id" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} />
                    </label>
                    <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                      {userLoading ? <div className="p-4 text-sm font-semibold text-slate-500">Searching...</div> : null}
                      {!userLoading && !userResults.length ? <div className="p-4 text-sm font-semibold text-slate-500">No users found.</div> : null}
                      {userResults.map((user) => {
                        const selected = selectedUserSet.has(user.id);
                        return (
                          <button
                            key={user.id}
                            type="button"
                            className={cn("flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-sky-50", selected ? "bg-sky-50" : "bg-white")}
                            onClick={() => addSelectedUser(user)}
                            disabled={selected}
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-black text-slate-900">{user.name || user.email || user.mobile || user.id}</span>
                              <span className="block truncate text-xs text-slate-500">{user.email || "No email"} | {user.mobile || "No mobile"}</span>
                              <span className="mt-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{user.examMode || "No mode"} | {user.subscriptionType}</span>
                            </span>
                            <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-black", user.tokenCount > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                              {user.tokenCount > 0 ? `${user.tokenCount} token` : "No token"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={selectVisibleUsers} disabled={!userResults.length}>Select Visible</button>
                      <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => setSelectedUserList([])} disabled={!selectedUserList.length}>Clear Selected</button>
                    </div>
                    <label className={ui.field}>
                      <span>Selected Users</span>
                      <textarea className={ui.textarea} placeholder="User IDs, emails, or mobiles separated by comma/new line" value={currentCampaignForm.selectedUsers} onChange={(event) => setCurrentCampaignForm((current) => ({ ...current, selectedUsers: event.target.value }))} />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedUserList.map((value) => (
                        <button key={value} type="button" className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-black text-sky-800 shadow-sm" onClick={() => removeSelectedUser(value)}>
                          {value} x
                        </button>
                      ))}
                    </div>
                    <p className={ui.muted}>For selected campaigns, add user IDs, emails, or mobiles. Push requires a device token; email requires an email address.</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {shouldSendNotification ? <PreviewCard title="Notification Preview" heading={currentCampaignForm.title || "Notification title"} body={currentCampaignForm.message || "Notification message"} cta={currentCampaignForm.ctaText || currentCampaignForm.deepLink} /> : null}
            {shouldSendEmail ? <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className={ui.eyebrow}>Email Preview</div><h3 className="text-base font-black text-slate-950">{currentCampaignForm.emailSubject || "Email subject"}</h3><div className="prose prose-sm mt-3 max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: currentCampaignForm.emailBody || "<p>Select an email template to preview.</p>" }} /></div> : null}
          </div>
          <div className="mt-5 flex justify-end">
            <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={busy}>
              {busy ? "Working..." : currentCampaignForm.action === "send" ? "Send Immediately" : currentCampaignForm.action === "schedule" ? "Schedule Campaign" : "Save Draft"}
            </button>
          </div>
        </form>
        </>
      ) : null}

      {tab === "templates" ? (
        <section className={ui.panel}>
          <form onSubmit={saveTemplate} className="mb-6 grid gap-4 lg:grid-cols-3">
            <label className={ui.field}><span>Template Name</span><input className={ui.input} value={templateForm.name} onChange={(event) => setTemplateForm((current) => ({ ...current, name: event.target.value }))} required /></label>
            <label className={ui.field}><span>Title</span><input className={ui.input} value={templateForm.title} onChange={(event) => setTemplateForm((current) => ({ ...current, title: event.target.value }))} required /></label>
            <label className={ui.field}><span>Default Audience</span><select className={ui.input} value={templateForm.targetType} onChange={(event) => setTemplateForm((current) => ({ ...current, targetType: event.target.value }))}>{targetOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className={cn(ui.field, "lg:col-span-3")}><span>Message</span><textarea className={ui.textarea} value={templateForm.message} onChange={(event) => setTemplateForm((current) => ({ ...current, message: event.target.value }))} required /></label>
            <label className={ui.field}><span>Image URL</span><input className={ui.input} value={templateForm.image} onChange={(event) => setTemplateForm((current) => ({ ...current, image: event.target.value }))} /></label>
            <label className={ui.field}><span>Managed CTA</span><select className={ui.input} value={templateForm.ctaConfigId} onChange={(event) => applyCtaConfig(event.target.value, "template")}><option value="">Custom CTA / None</option>{ctaConfigs.map((item) => <option key={item.id || item._id} value={item.id || item._id}>{item.name} - {item.ctaText}</option>)}</select></label>
            <label className={ui.field}><span>Deep Link</span><input className={ui.input} value={templateForm.deepLink} onChange={(event) => setTemplateForm((current) => ({ ...current, deepLink: event.target.value }))} /></label>
            <label className={ui.field}><span>CTA Text</span><input className={ui.input} value={templateForm.ctaText} onChange={(event) => setTemplateForm((current) => ({ ...current, ctaText: event.target.value }))} /></label>
            <label className={ui.field}><span>Category</span><select className={ui.input} value={templateForm.category} onChange={(event) => setTemplateForm((current) => ({ ...current, category: event.target.value }))}>{categoryOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <div className="flex items-end gap-3 lg:col-span-3"><button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={busy}>{editingTemplateId ? "Update Template" : "Save Template"}</button>{editingTemplateId ? <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => { setEditingTemplateId(""); setTemplateForm(emptyTemplate); }}>Cancel</button> : null}</div>
          </form>
          <SimpleTable columns={["Name", "Title", "Audience", "Status", "Actions"]} rows={templates.map((item) => [
            item.name,
            item.title,
            item.targetType,
            item.status === false ? "Inactive" : "Active",
            <div className="flex gap-2" key={item.id || item._id}><button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => { setEditingTemplateId(item.id || item._id); setTemplateForm({ ...emptyTemplate, ...item }); }}>Edit</button><button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={async () => { await notificationService.deleteTemplate(item.id || item._id); await loadAll(); }}>Delete</button></div>,
          ])} />
        </section>
      ) : null}

      {tab === "automated" ? (
        <section className="flex flex-col gap-6">
          <form className={ui.panel} onSubmit={saveAutomation}>
            <div className={ui.sectionHead}>
              <div>
                <h2 className="text-xl font-black text-slate-900">{editingAutomationId ? "Edit Automated Notification" : "Create Automated Notification"}</h2>
                <p className={ui.muted}>Timezone: {automationForm.timezone || automationTimezone}</p>
              </div>
              {editingAutomationId ? <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => { setEditingAutomationId(""); setAutomationForm({ ...emptyAutomation, timezone: automationTimezone }); }}>Cancel Edit</button> : null}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <label className={ui.field}><span>Notification Name</span><input className={ui.input} value={automationForm.campaignName} onChange={(event) => setAutomationForm((current) => ({ ...current, campaignName: event.target.value }))} required /></label>
              <label className={ui.field}><span>Schedule Type</span><select className={ui.input} value={automationForm.scheduleType} onChange={(event) => setAutomationForm((current) => ({ ...current, scheduleType: event.target.value }))}><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label>
              <label className={ui.field}><span>Time</span><input className={ui.input} type="time" value={automationForm.scheduleTime} onChange={(event) => setAutomationForm((current) => ({ ...current, scheduleTime: event.target.value }))} required /></label>

              {automationForm.scheduleType === "weekly" ? (
                <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className={ui.eyebrow}>Weekly Days</div>
                  <div className="grid gap-2 md:grid-cols-4 lg:grid-cols-7">
                    {weekDayOptions.map((day) => (
                      <label key={day.value} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                        <input type="checkbox" className={ui.checkbox} checked={automationForm.weeklyDays.map(Number).includes(day.value)} onChange={() => toggleAutomationDay(day.value)} />
                        {day.label}
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <label className={ui.field}><span>Day Of Month</span><input className={ui.input} type="number" min="1" max="31" value={automationForm.monthlyDay} onChange={(event) => setAutomationForm((current) => ({ ...current, monthlyDay: event.target.value }))} required /></label>
              )}

              <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className={ui.eyebrow}>Delivery Type</div>
                <div className="grid gap-2 md:grid-cols-3">
                  {automationChannelOptions.map((channel) => (
                    <label key={channel.value} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                      <input type="checkbox" className={ui.checkbox} checked={automationForm.deliveryChannels.includes(channel.value)} onChange={() => toggleAutomationChannel(channel.value)} />
                      {channel.label}
                    </label>
                  ))}
                </div>
              </div>

              <label className={ui.field}><span>Target Audience</span><select className={ui.input} value={automationForm.targetType} onChange={(event) => setAutomationForm((current) => ({ ...current, targetType: event.target.value }))}>{targetOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
              <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">
                <div className={ui.eyebrow}>Audience Count</div>
                <div className="text-2xl font-black text-slate-900">{automationAudienceCount}</div>
              </div>
              <label className={ui.field}><span>Enable Automation</span><select className={ui.input} value={automationForm.automationEnabled ? "enabled" : "disabled"} onChange={(event) => setAutomationForm((current) => ({ ...current, automationEnabled: event.target.value === "enabled" }))}><option value="enabled">Enabled</option><option value="disabled">Disabled</option></select></label>
              {automationForm.targetType === "selected" ? <label className={cn(ui.field, "lg:col-span-3")}><span>Selected Users</span><textarea className={ui.textarea} value={automationForm.selectedUsers} onChange={(event) => setAutomationForm((current) => ({ ...current, selectedUsers: event.target.value }))} placeholder="User IDs, emails, or mobiles separated by comma/new line" /></label> : null}

              {(automationShouldInApp || automationShouldPush) ? (
                <>
                  <label className={ui.field}><span>Notification Title</span><input className={ui.input} value={automationForm.title} onChange={(event) => setAutomationForm((current) => ({ ...current, title: event.target.value }))} required={automationShouldInApp || automationShouldPush} /></label>
                  <label className={cn(ui.field, "lg:col-span-2")}><span>Notification Message</span><textarea className={ui.textarea} value={automationForm.message} onChange={(event) => setAutomationForm((current) => ({ ...current, message: event.target.value }))} required={automationShouldInApp || automationShouldPush} /></label>
                  <label className={ui.field}><span>Deep Link</span><input className={ui.input} list="notification-deep-links" value={automationForm.deepLink} onChange={(event) => setAutomationForm((current) => ({ ...current, deepLink: event.target.value }))} /></label>
                  <label className={ui.field}><span>CTA Text</span><input className={ui.input} value={automationForm.ctaText} onChange={(event) => setAutomationForm((current) => ({ ...current, ctaText: event.target.value }))} /></label>
                  <label className={ui.field}><span>Category</span><select className={ui.input} value={automationForm.category} onChange={(event) => setAutomationForm((current) => ({ ...current, category: event.target.value }))}>{categoryOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                </>
              ) : null}

              {automationShouldEmail ? (
                <>
                  <label className={ui.field}><span>Email Template</span><select className={ui.input} value={automationForm.emailTemplateId} onChange={(event) => setAutomationForm((current) => ({ ...current, emailTemplateId: event.target.value }))}><option value="">Custom Email</option>{emailTemplates.map((item) => <option key={item.id || item.status?.templateId || item.key} value={item.id || item.status?.templateId || item.key}>{item.name || item.key}</option>)}</select></label>
                  <label className={cn(ui.field, "lg:col-span-2")}><span>Email Subject</span><input className={ui.input} value={automationForm.emailSubject} onChange={(event) => setAutomationForm((current) => ({ ...current, emailSubject: event.target.value }))} required={automationShouldEmail} /></label>
                  <label className={cn(ui.field, "lg:col-span-3")}><span>Email Body / Template</span><textarea className={ui.textarea} value={automationForm.emailBody} onChange={(event) => setAutomationForm((current) => ({ ...current, emailBody: event.target.value }))} required={automationShouldEmail} /></label>
                </>
              ) : null}
            </div>

            <div className="mt-5 flex justify-end">
              <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={busy}>{busy ? "Saving..." : editingAutomationId ? "Update Automation" : "Save Automation"}</button>
            </div>
          </form>

          <section className={ui.panel}>
            <SimpleTable columns={["Notification Name", "Schedule Type", "Schedule", "Target Audience", "Audience Count", "Delivery Type", "Status", "Last Sent", "Next Send", "Actions"]} rows={automations.map((item) => [
              item.campaignName || item.title || item.emailSubject,
              item.scheduleType,
              item.scheduleLabel || "-",
              targetOptions.find((option) => option.value === item.targetType)?.label || item.targetType,
              item.audienceCount || 0,
              channelLabel(item.deliveryChannels, item.deliveryType),
              item.automationEnabled === false || item.status === "paused" ? "Disabled" : "Enabled",
              formatDateTime(item.lastSentAt || item.sentAt),
              formatDateTime(item.nextSendAt || item.scheduleDate),
              <div key={item.id || item._id} className="flex flex-wrap gap-2">
                <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => editAutomation(item)}>Edit</button>
                <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => setAutomationStatus(item, item.automationEnabled === false || item.status === "paused")}>{item.automationEnabled === false || item.status === "paused" ? "Enable" : "Disable"}</button>
                <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => showAutomationHistory(item)}>History</button>
                <button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => deleteAutomation(item)}>Delete</button>
              </div>,
            ])} />
          </section>

          {automationHistory.length ? (
            <section className={ui.panel}>
              <h2 className="mb-4 text-xl font-black text-slate-900">Automation Execution History</h2>
              <SimpleTable columns={["Automation", "Scheduled", "Executed", "Audience", "Targeted", "Success", "Failed", "Channels", "Status"]} rows={automationHistory.map((item) => [
                item.campaignName,
                formatDateTime(item.scheduledFor),
                formatDateTime(item.executedAt || item.sentAt),
                item.targetType,
                Number(item.sentCount || 0) + Number(item.emailSentCount || 0) + Number(item.noTokenCount || 0) + Number(item.emailSkippedCount || 0),
                Number(item.successCount || 0) + Number(item.emailSentCount || 0),
                Number(item.failedCount || 0) + Number(item.emailFailedCount || 0) + Number(item.emailSkippedCount || 0),
                channelLabel(item.deliveryChannels, item.deliveryType),
                item.status,
              ])} />
            </section>
          ) : null}
        </section>
      ) : null}

      {tab === "scheduled" ? (
        <section className={ui.panel}>
          <div className="mb-4 flex justify-end"><button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={processScheduled} disabled={busy}>Process Due Now</button></div>
          <SimpleTable columns={["Campaign", "Delivery", "Audience", "Schedule", "Status", "Actions"]} rows={scheduled.map((item) => [
            item.campaignName || item.title || item.emailSubject,
            item.deliveryType || "notification",
            item.targetType,
            `${item.scheduleDate ? toInputDate(item.scheduleDate).replace("T", " ") : "-"}${item.recurring ? ` | ${item.recurrence}${item.recurrence === "custom" ? ` ${item.recurrenceInterval} ${item.recurrenceUnit}` : ""}` : ""}`,
            item.status,
            <div key={item.id || item._id} className="flex flex-wrap gap-2">
              {["pending", "draft", "paused"].includes(item.status) ? <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => editCampaign(item)}>Edit</button> : null}
              {item.status === "pending" ? <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => pauseSchedule(item.id || item._id)}>Pause</button> : null}
              {item.status === "paused" ? <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => resumeSchedule(item.id || item._id)}>Resume</button> : null}
              {["pending", "draft", "paused"].includes(item.status) ? <button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => cancelSchedule(item.id || item._id)}>Delete</button> : null}
            </div>,
          ])} />
        </section>
      ) : null}

      {tab === "test" ? (
        <form className={ui.panel} onSubmit={sendTestNotification}>
          <h2 className="mb-4 text-xl font-black text-slate-900">Notification Testing</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            <label className={ui.field}><span>Delivery Channel</span><select className={ui.input} value={testForm.deliveryType} onChange={(event) => setTestForm((current) => ({ ...current, deliveryType: event.target.value }))}>{deliveryOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className={ui.field}><span>Test Target</span><select className={ui.input} value={testForm.testTarget} onChange={(event) => setTestForm((current) => ({ ...current, testTarget: event.target.value }))}><option value="admin">Current Admin Device</option><option value="selected">Test User</option><option value="email">Specific Email</option></select></label>
            <label className={ui.field}><span>Test User</span><input className={ui.input} value={testForm.selectedUsers} onChange={(event) => setTestForm((current) => ({ ...current, selectedUsers: event.target.value }))} placeholder="User id, email, or mobile" /></label>
            <label className={ui.field}><span>Specific Email</span><input className={ui.input} type="email" value={testForm.testEmail} onChange={(event) => setTestForm((current) => ({ ...current, testEmail: event.target.value }))} placeholder="test@example.com" /></label>
            <label className={ui.field}><span>Push Title</span><input className={ui.input} value={testForm.title} onChange={(event) => setTestForm((current) => ({ ...current, title: event.target.value }))} /></label>
            <label className={cn(ui.field, "lg:col-span-2")}><span>Push Message</span><input className={ui.input} value={testForm.message} onChange={(event) => setTestForm((current) => ({ ...current, message: event.target.value }))} /></label>
            <label className={ui.field}><span>Deep Link</span><input className={ui.input} value={testForm.deepLink} onChange={(event) => setTestForm((current) => ({ ...current, deepLink: event.target.value }))} /></label>
            <label className={cn(ui.field, "lg:col-span-2")}><span>Email Subject</span><input className={ui.input} value={testForm.emailSubject} onChange={(event) => setTestForm((current) => ({ ...current, emailSubject: event.target.value }))} /></label>
            <label className={cn(ui.field, "lg:col-span-3")}><span>Email Body</span><textarea className={ui.textarea} value={testForm.emailBody} onChange={(event) => setTestForm((current) => ({ ...current, emailBody: event.target.value }))} /></label>
          </div>
          <div className="mt-5 flex justify-end"><button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={busy}>{busy ? "Sending..." : "Send Test"}</button></div>
        </form>
      ) : null}

      {tab === "history" ? (
        <section className={ui.panel}>
          <SimpleTable columns={["Campaign", "Delivery", "Audience", "Push Sent", "Push Delivered", "Email Sent", "Failed", "Status"]} rows={history.map((item) => [
            item.campaignName || item.title || item.emailSubject,
            item.deliveryType || "notification",
            item.targetType,
            item.sentCount || 0,
            item.successCount || 0,
            item.emailSentCount || 0,
            Number(item.failedCount || 0) + Number(item.emailFailedCount || 0) + Number(item.emailSkippedCount || 0),
            item.status,
          ])} />
        </section>
      ) : null}

      {tab === "stats" ? (
        <section className={ui.panel}>
          <div className="grid gap-4 md:grid-cols-5">
            {[
              ["Total", stats?.totalNotifications || 0],
              ["Today", stats?.todayNotifications || 0],
              ["Delivered", stats?.delivered || 0],
              ["Failed", stats?.failed || 0],
              ["Device Tokens", stats?.activeDeviceTokens || 0],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className={ui.eyebrow}>{label}</div><div className="mt-2 text-2xl font-black text-slate-900">{value}</div></div>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-lg font-black text-slate-900">Notification Sent Trend</h3>
            <div className="space-y-2">
              {(stats?.sentTrend || []).map((item) => <div key={item._id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"><span>{item._id}</span><span>Sent {item.sent || 0} | Delivered {item.delivered || 0} | Failed {item.failed || 0}</span></div>)}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SimpleTable({ columns, rows }) {
  return (
    <div className={ui.tableWrap}>
      <div className={ui.tableScroll}>
        <table className={ui.table}>
          <thead><tr>{columns.map((column) => <th key={column} className={ui.tableHead}>{column}</th>)}</tr></thead>
          <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className={ui.tableCell}>{cell}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

function PreviewCard({ title, heading, body, cta }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className={ui.eyebrow}>{title}</div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-base font-black text-slate-950">{heading}</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{body}</p>
        {cta ? <div className="mt-3 inline-flex rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white">{cta}</div> : null}
      </div>
    </div>
  );
}
