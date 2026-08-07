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

const defaultPaymentCancelledReminders = [
  {
    id: "immediate",
    name: "Reminder 1 - Immediate",
    enabled: true,
    delayValue: 0,
    delayUnit: "Minutes",
    title: "Your premium payment was not completed",
    message: "You can still complete your subscription and continue your preparation without interruption.",
    image: "",
    deepLink: "/subscription",
    ctaConfigId: "",
    ctaText: "Complete Payment",
    emailTemplateId: "",
    emailTemplateKey: "notification_reminder",
    emailSubject: "Complete your Krita MCQs premium payment",
    emailBody: "<p>Hi {{user_name}},</p><p>Your premium payment was not completed. You can still finish the payment and continue learning.</p><p><a href=\"{{payment_link}}\">Complete Payment</a></p>",
  },
  {
    id: "after-24-hours",
    name: "Reminder 2 - 24 Hours",
    enabled: true,
    delayValue: 24,
    delayUnit: "Hours",
    title: "Your premium plan is still waiting",
    message: "Complete your payment to unlock premium practice, mock tests, and revision tools.",
    image: "",
    deepLink: "/subscription",
    ctaConfigId: "",
    ctaText: "Resume Payment",
    emailTemplateId: "",
    emailTemplateKey: "notification_reminder",
    emailSubject: "Your Krita MCQs premium plan is still waiting",
    emailBody: "<p>Hi {{user_name}},</p><p>Your premium plan is still waiting. Complete your payment to unlock all premium features.</p><p><a href=\"{{payment_link}}\">Resume Payment</a></p>",
  },
];

const emptyPaymentCancelledAuto = {
  name: "Payment Cancelled Auto Notification",
  status: "disabled",
  priority: 10,
  reminders: defaultPaymentCancelledReminders,
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

export function NotificationCenterPage() {
  const [tab, setTab] = useState("send");
  const [templates, setTemplates] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [ctaConfigs, setCtaConfigs] = useState([]);
  const [history, setHistory] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [paymentAutoConfigs, setPaymentAutoConfigs] = useState([]);
  const [paymentAutoLogs, setPaymentAutoLogs] = useState([]);
  const [paymentAutoPendingJobs, setPaymentAutoPendingJobs] = useState(0);
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
  const [paymentAutoForm, setPaymentAutoForm] = useState(emptyPaymentCancelledAuto);
  const [editingPaymentAutoId, setEditingPaymentAutoId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadAll() {
    const [templateResponse, historyResponse, scheduledResponse, statsResponse, ctaResponse, audienceResponse, paymentAutoResponse] = await Promise.all([
      notificationService.templates(),
      notificationService.history({ limit: 50 }),
      notificationService.scheduled(),
      notificationService.stats(),
      ctaConfigService.list({ channel: "push", isActive: true }),
      notificationService.audiences(),
      notificationService.paymentCancelledAuto(),
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
    setStats(statsResponse.data || null);
    setCtaConfigs(ctaResponse.data || []);
    setAudiences(audienceResponse.data || []);
    setPaymentAutoConfigs(paymentAutoResponse.data?.configs || []);
    setPaymentAutoLogs(paymentAutoResponse.data?.logs || []);
    setPaymentAutoPendingJobs(Number(paymentAutoResponse.data?.pendingJobs || 0));
  }

  useEffect(() => {
    loadAll().catch((error) => setMessage(error.message));
  }, []);

  const activeTemplate = useMemo(
    () => templates.find((item) => String(item.id || item._id) === String(sendForm.templateId)),
    [templates, sendForm.templateId],
  );

  const activeEmailTemplate = useMemo(
    () => emailTemplates.find((item) => String(item.id || item.status?.templateId || item.key) === String(sendForm.emailTemplateId)),
    [emailTemplates, sendForm.emailTemplateId],
  );

  useEffect(() => {
    if (!activeTemplate) return;
    setSendForm((current) => ({
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
  }, [activeTemplate]);

  useEffect(() => {
    if (!activeEmailTemplate) return;
    setSendForm((current) => ({
      ...current,
      emailTemplateKey: activeEmailTemplate.key || "",
      emailSubject: activeEmailTemplate.subject || "",
      emailBody: activeEmailTemplate.htmlContent || activeEmailTemplate.textContent || "",
    }));
  }, [activeEmailTemplate]);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setUserLoading(true);
      try {
        const response = await notificationService.users({ q: userSearch, targetType: sendForm.targetType, limit: 200 });
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
  }, [sendForm.targetType, userSearch]);

  const selectedUserList = useMemo(() => selectedUserValues(sendForm.selectedUsers), [sendForm.selectedUsers]);
  const selectedUserSet = useMemo(() => new Set(selectedUserList), [selectedUserList]);
  const shouldSendNotification = ["notification", "both"].includes(sendForm.deliveryType);
  const shouldSendEmail = ["email", "both"].includes(sendForm.deliveryType);

  function setSelectedUserList(values) {
    const unique = [...new Set(values.map((item) => String(item || "").trim()).filter(Boolean))];
    setSendForm((current) => ({ ...current, selectedUsers: unique.join("\n") }));
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
    else setSendForm((current) => ({ ...current, ...patch }));
  }

  async function createCtaFromSendForm() {
    if (!sendForm.ctaText.trim() || !sendForm.deepLink.trim()) {
      setMessage("Enter CTA text and deep link first.");
      return;
    }
    setBusy(true);
    try {
      const response = await ctaConfigService.create({
        name: `${sendForm.campaignName || sendForm.title || sendForm.ctaText} CTA`,
        channel: "push",
        ctaText: sendForm.ctaText,
        ctaType: "custom_url",
        ctaUrl: sendForm.deepLink,
        openIn: "app",
      });
      const item = response.data;
      setCtaConfigs((current) => [item, ...current]);
      setSendForm((current) => ({ ...current, ctaConfigId: item?.id || item?._id || "" }));
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
    if (sendForm.targetType === "selected" && selectedUserList.length === 0) {
      setMessage("Select at least one user before sending a test push.");
      return;
    }
    const payload = {
      ...sendForm,
      scheduleDate: sendForm.scheduleDate ? new Date(sendForm.scheduleDate).toISOString() : "",
    };
    setBusy(true);
    setMessage("");
    try {
      let response;
      if (editingCampaignId && sendForm.action !== "send") {
        response = await notificationService.updateScheduled(editingCampaignId, {
          ...payload,
          status: sendForm.action === "schedule" ? "pending" : "draft",
        });
      } else {
        response = await notificationService.send(payload);
        if (editingCampaignId && sendForm.action === "send") {
          await notificationService.cancelScheduled(editingCampaignId);
        }
      }
      await loadAll();
      setMessage(deliverySummaryMessage(response));
      if (sendForm.action === "send" || editingCampaignId) {
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
    setSendForm({
      ...emptySend,
      ...item,
      action: item.status === "draft" ? "draft" : "schedule",
      scheduleDate: toInputDate(item.scheduleDate),
      selectedUsers: Array.isArray(item.selectedUsers) ? item.selectedUsers.join("\n") : item.selectedUsers || "",
    });
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

  function normalizePaymentAutoForm(item = {}) {
    return {
      ...emptyPaymentCancelledAuto,
      ...item,
      reminders: Array.isArray(item.reminders) && item.reminders.length ? item.reminders : defaultPaymentCancelledReminders,
    };
  }

  function patchPaymentAuto(key, value) {
    setPaymentAutoForm((current) => ({ ...current, [key]: value }));
  }

  function patchPaymentAutoReminder(index, patch) {
    setPaymentAutoForm((current) => ({
      ...current,
      reminders: current.reminders.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }));
  }

  function addPaymentAutoReminder() {
    setPaymentAutoForm((current) => ({
      ...current,
      reminders: [
        ...current.reminders,
        {
          ...defaultPaymentCancelledReminders[1],
          id: `reminder-${Date.now()}`,
          name: `Reminder ${current.reminders.length + 1}`,
          delayValue: 48,
          delayUnit: "Hours",
        },
      ],
    }));
  }

  function removePaymentAutoReminder(index) {
    setPaymentAutoForm((current) => ({ ...current, reminders: current.reminders.filter((_, itemIndex) => itemIndex !== index) }));
  }

  async function savePaymentAuto(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (editingPaymentAutoId) await notificationService.updatePaymentCancelledAuto(editingPaymentAutoId, paymentAutoForm);
      else await notificationService.createPaymentCancelledAuto(paymentAutoForm);
      setPaymentAutoForm(emptyPaymentCancelledAuto);
      setEditingPaymentAutoId("");
      await loadAll();
      setMessage("Payment Cancelled Auto Notification saved.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function togglePaymentAuto(item) {
    setBusy(true);
    try {
      await notificationService.setPaymentCancelledAutoStatus(item.id || item._id, item.status === "enabled" ? "disabled" : "enabled");
      await loadAll();
      setMessage("Payment Cancelled Auto Notification status updated.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deletePaymentAuto(id) {
    if (!window.confirm("Delete this Payment Cancelled Auto Notification?")) return;
    setBusy(true);
    try {
      await notificationService.deletePaymentCancelledAuto(id);
      await loadAll();
      setMessage("Payment Cancelled Auto Notification deleted.");
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
            ["scheduled", "Scheduled"],
            ["payment-auto", "Payment Cancelled"],
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
        <form className={ui.panel} onSubmit={sendNotification}>
          <h2 className="mb-4 text-xl font-black text-slate-900">{editingCampaignId ? "Edit Campaign" : "Create Campaign"}</h2>
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            {audiences.map((item) => (
              <button key={item.value} type="button" className={cn("rounded-xl border px-4 py-3 text-left", sendForm.targetType === item.value ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-slate-50")} onClick={() => setSendForm((current) => ({ ...current, targetType: item.value }))}>
                <span className={ui.eyebrow}>{targetOptions.find((option) => option.value === item.value)?.label || item.value}</span>
                <span className="mt-1 block text-2xl font-black text-slate-900">{item.count || 0}</span>
              </button>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <label className={ui.field}><span>Campaign Name</span><input className={ui.input} value={sendForm.campaignName} onChange={(event) => setSendForm((current) => ({ ...current, campaignName: event.target.value }))} placeholder="August premium announcement" /></label>
            <label className={ui.field}><span>Delivery Channel</span><select className={ui.input} value={sendForm.deliveryType} onChange={(event) => setSendForm((current) => ({ ...current, deliveryType: event.target.value }))}>{deliveryOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className={ui.field}><span>Use Template</span><select className={ui.input} value={sendForm.templateId} onChange={(event) => setSendForm((current) => ({ ...current, templateId: event.target.value }))}><option value="">Custom Notification</option>{templates.filter((item) => item.status !== false).map((item) => <option key={item.id || item._id} value={item.id || item._id}>{item.name}</option>)}</select></label>
            <label className={ui.field}><span>Target Audience</span><select className={ui.input} value={sendForm.targetType} onChange={(event) => setSendForm((current) => ({ ...current, targetType: event.target.value }))}>{targetOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className={ui.field}><span>Category</span><select className={ui.input} value={sendForm.category} onChange={(event) => setSendForm((current) => ({ ...current, category: event.target.value }))}>{categoryOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            {shouldSendNotification ? <>
              <label className={ui.field}><span>Notification Title</span><input className={ui.input} value={sendForm.title} onChange={(event) => setSendForm((current) => ({ ...current, title: event.target.value }))} required={shouldSendNotification} /></label>
              <label className={cn(ui.field, "lg:col-span-3")}><span>Notification Message</span><textarea className={ui.textarea} value={sendForm.message} onChange={(event) => setSendForm((current) => ({ ...current, message: event.target.value }))} required={shouldSendNotification} /></label>
              <label className={ui.field}><span>Managed CTA</span><select className={ui.input} value={sendForm.ctaConfigId} onChange={(event) => applyCtaConfig(event.target.value)}><option value="">Custom CTA / None</option>{ctaConfigs.map((item) => <option key={item.id || item._id} value={item.id || item._id}>{item.name} - {item.ctaText}</option>)}</select></label>
              <label className={ui.field}><span>CTA Button Text</span><input className={ui.input} value={sendForm.ctaText} onChange={(event) => setSendForm((current) => ({ ...current, ctaText: event.target.value }))} placeholder="Open App" /></label>
              <label className={ui.field}><span>CTA Action / Deep Link</span><input className={ui.input} list="notification-deep-links" value={sendForm.deepLink} onChange={(event) => setSendForm((current) => ({ ...current, deepLink: event.target.value }))} /><datalist id="notification-deep-links">{deepLinks.map((item) => <option key={item} value={item} />)}</datalist></label>
              <label className={ui.field}><span>Target Screen</span><input className={ui.input} value={sendForm.targetScreen} onChange={(event) => setSendForm((current) => ({ ...current, targetScreen: event.target.value }))} placeholder="subscription" /></label>
              <div className="flex items-end"><button type="button" className={cn(ui.buttonBase, ui.buttonSecondary, "w-full")} onClick={createCtaFromSendForm}>Save As New CTA</button></div>
              <label className={ui.field}><span>Image URL</span><input className={ui.input} value={sendForm.image} onChange={(event) => setSendForm((current) => ({ ...current, image: event.target.value }))} /></label>
            </> : null}
            {shouldSendEmail ? <>
              <label className={ui.field}><span>Email Template</span><select className={ui.input} value={sendForm.emailTemplateId} onChange={(event) => setSendForm((current) => ({ ...current, emailTemplateId: event.target.value }))} required={shouldSendEmail}><option value="">Select Email Template</option>{emailTemplates.map((item) => <option key={item.id || item.status?.templateId || item.key} value={item.id || item.status?.templateId || item.key}>{item.name}</option>)}</select></label>
              <label className={cn(ui.field, "lg:col-span-2")}><span>Email Subject</span><input className={ui.input} value={sendForm.emailSubject} onChange={(event) => setSendForm((current) => ({ ...current, emailSubject: event.target.value }))} required={shouldSendEmail} /></label>
              <label className={cn(ui.field, "lg:col-span-3")}><span>Email Body</span><textarea className={cn(ui.textarea, "min-h-56")} value={sendForm.emailBody} onChange={(event) => setSendForm((current) => ({ ...current, emailBody: event.target.value }))} required={shouldSendEmail} /></label>
            </> : null}
            <label className={ui.field}><span>Sound</span><select className={ui.input} value={sendForm.sound} onChange={(event) => setSendForm((current) => ({ ...current, sound: event.target.value }))}><option value="default">Default</option><option value="custom">Custom</option><option value="silent">Silent</option></select></label>
            <label className={ui.field}><span>Priority</span><select className={ui.input} value={sendForm.priority} onChange={(event) => setSendForm((current) => ({ ...current, priority: event.target.value }))}><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select></label>
            <label className={ui.field}><span>Action</span><select className={ui.input} value={sendForm.action} onChange={(event) => setSendForm((current) => ({ ...current, action: event.target.value }))}><option value="send">Send Immediately</option><option value="schedule">Schedule</option><option value="draft">Save Draft</option></select></label>
            {sendForm.action === "schedule" ? <label className={ui.field}><span>Schedule Date</span><input className={ui.input} type="datetime-local" value={sendForm.scheduleDate} onChange={(event) => setSendForm((current) => ({ ...current, scheduleDate: event.target.value }))} required /></label> : null}
            {sendForm.action === "schedule" ? (
              <>
                <label className={ui.field}><span>Recurring</span><select className={ui.input} value={sendForm.recurring ? sendForm.recurrence : "none"} onChange={(event) => setSendForm((current) => ({ ...current, recurring: event.target.value !== "none", recurrence: event.target.value }))}><option value="none">No Repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="custom">Custom Interval</option></select></label>
                {sendForm.recurring && sendForm.recurrence === "custom" ? <><label className={ui.field}><span>Interval</span><input className={ui.input} type="number" min="1" value={sendForm.recurrenceInterval} onChange={(event) => setSendForm((current) => ({ ...current, recurrenceInterval: event.target.value }))} /></label><label className={ui.field}><span>Interval Unit</span><select className={ui.input} value={sendForm.recurrenceUnit} onChange={(event) => setSendForm((current) => ({ ...current, recurrenceUnit: event.target.value }))}><option>Minutes</option><option>Hours</option><option>Days</option></select></label></> : null}
              </>
            ) : null}
            {sendForm.targetType ? (
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
                      <textarea className={ui.textarea} placeholder="User IDs, emails, or mobiles separated by comma/new line" value={sendForm.selectedUsers} onChange={(event) => setSendForm((current) => ({ ...current, selectedUsers: event.target.value }))} />
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
            {shouldSendNotification ? <PreviewCard title="Notification Preview" heading={sendForm.title || "Notification title"} body={sendForm.message || "Notification message"} cta={sendForm.ctaText || sendForm.deepLink} /> : null}
            {shouldSendEmail ? <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className={ui.eyebrow}>Email Preview</div><h3 className="text-base font-black text-slate-950">{sendForm.emailSubject || "Email subject"}</h3><div className="prose prose-sm mt-3 max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: sendForm.emailBody || "<p>Select an email template to preview.</p>" }} /></div> : null}
          </div>
          <div className="mt-5 flex justify-end">
            <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={busy}>{busy ? "Working..." : sendForm.action === "send" ? "Send Immediately" : sendForm.action === "schedule" ? "Schedule Campaign" : "Save Draft"}</button>
          </div>
        </form>
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

      {tab === "payment-auto" ? (
        <section className={ui.panel}>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Payment Cancelled Auto Notification</h2>
              <p className={ui.muted}>Automatically send Email, In-App Notification, and FCM push after cancelled, failed, closed, or abandoned payments.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              Pending Jobs: {paymentAutoPendingJobs}
            </div>
          </div>

          <form onSubmit={savePaymentAuto} className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-4 lg:grid-cols-4">
              <label className={ui.field}><span>Name</span><input className={ui.input} value={paymentAutoForm.name} onChange={(event) => patchPaymentAuto("name", event.target.value)} required /></label>
              <label className={ui.field}><span>Status</span><select className={ui.input} value={paymentAutoForm.status} onChange={(event) => patchPaymentAuto("status", event.target.value)}><option value="enabled">Enabled</option><option value="disabled">Disabled</option></select></label>
              <label className={ui.field}><span>Priority</span><input className={ui.input} type="number" min="1" max="100" value={paymentAutoForm.priority} onChange={(event) => patchPaymentAuto("priority", Number(event.target.value || 10))} /></label>
              <div className="flex items-end"><button type="button" className={cn(ui.buttonBase, ui.buttonSecondary, "w-full")} onClick={addPaymentAutoReminder}>Add Reminder</button></div>
            </div>

            <div className="mt-5 space-y-4">
              {paymentAutoForm.reminders.map((reminder, index) => {
                const activeEmailTemplateForReminder = emailTemplates.find((item) => String(item.id || item.status?.templateId || item.key) === String(reminder.emailTemplateId));
                return (
                  <div key={reminder.id || index} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <label className="inline-flex items-center gap-2 text-sm font-black text-slate-700">
                        <input className={ui.checkbox} type="checkbox" checked={reminder.enabled !== false} onChange={(event) => patchPaymentAutoReminder(index, { enabled: event.target.checked })} />
                        {reminder.name || `Reminder ${index + 1}`}
                      </label>
                      {paymentAutoForm.reminders.length > 1 ? <button type="button" className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => removePaymentAutoReminder(index)}>Remove</button> : null}
                    </div>
                    <div className="grid gap-4 lg:grid-cols-4">
                      <label className={ui.field}><span>Stage Name</span><input className={ui.input} value={reminder.name} onChange={(event) => patchPaymentAutoReminder(index, { name: event.target.value })} /></label>
                      <label className={ui.field}><span>Delay</span><input className={ui.input} type="number" min="0" value={reminder.delayValue} onChange={(event) => patchPaymentAutoReminder(index, { delayValue: Number(event.target.value || 0) })} /></label>
                      <label className={ui.field}><span>Delay Unit</span><select className={ui.input} value={reminder.delayUnit} onChange={(event) => patchPaymentAutoReminder(index, { delayUnit: event.target.value })}><option>Minutes</option><option>Hours</option><option>Days</option></select></label>
                      <label className={ui.field}><span>Deep Link</span><input className={ui.input} value={reminder.deepLink} onChange={(event) => patchPaymentAutoReminder(index, { deepLink: event.target.value })} /></label>
                      <label className={ui.field}><span>Push Title</span><input className={ui.input} value={reminder.title} onChange={(event) => patchPaymentAutoReminder(index, { title: event.target.value })} required /></label>
                      <label className={cn(ui.field, "lg:col-span-3")}><span>Push Message</span><textarea className={ui.textarea} value={reminder.message} onChange={(event) => patchPaymentAutoReminder(index, { message: event.target.value })} required /></label>
                      <label className={ui.field}><span>Image URL</span><input className={ui.input} value={reminder.image || ""} onChange={(event) => patchPaymentAutoReminder(index, { image: event.target.value })} /></label>
                      <label className={ui.field}><span>CTA Text</span><input className={ui.input} value={reminder.ctaText || ""} onChange={(event) => patchPaymentAutoReminder(index, { ctaText: event.target.value })} /></label>
                      <label className={ui.field}><span>Email Template</span><select className={ui.input} value={reminder.emailTemplateId || ""} onChange={(event) => {
                        const selected = emailTemplates.find((item) => String(item.id || item.status?.templateId || item.key) === String(event.target.value));
                        patchPaymentAutoReminder(index, {
                          emailTemplateId: event.target.value,
                          emailTemplateKey: selected?.key || reminder.emailTemplateKey || "",
                          emailSubject: selected?.subject || reminder.emailSubject || "",
                          emailBody: selected?.htmlContent || selected?.textContent || reminder.emailBody || "",
                        });
                      }}><option value="">Use custom email content</option>{emailTemplates.map((item) => <option key={item.id || item.status?.templateId || item.key} value={item.id || item.status?.templateId || item.key}>{item.name || item.key}</option>)}</select></label>
                      <label className={ui.field}><span>Template Key</span><input className={ui.input} value={reminder.emailTemplateKey || activeEmailTemplateForReminder?.key || ""} onChange={(event) => patchPaymentAutoReminder(index, { emailTemplateKey: event.target.value })} /></label>
                      <label className={cn(ui.field, "lg:col-span-2")}><span>Email Subject</span><input className={ui.input} value={reminder.emailSubject} onChange={(event) => patchPaymentAutoReminder(index, { emailSubject: event.target.value })} required /></label>
                      <label className={cn(ui.field, "lg:col-span-4")}><span>Email Body</span><textarea className={cn(ui.textarea, "min-h-44")} value={reminder.emailBody} onChange={(event) => patchPaymentAutoReminder(index, { emailBody: event.target.value })} required /></label>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex justify-end gap-3">
              {editingPaymentAutoId ? <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => { setEditingPaymentAutoId(""); setPaymentAutoForm(emptyPaymentCancelledAuto); }}>Cancel</button> : null}
              <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={busy}>{busy ? "Saving..." : editingPaymentAutoId ? "Update Auto Notification" : "Create Auto Notification"}</button>
            </div>
          </form>

          <SimpleTable columns={["Name", "Status", "Reminder Count", "Last Trigger", "Created", "Updated", "Actions"]} rows={paymentAutoConfigs.map((item) => [
            item.name,
            item.status === "enabled" ? "Enabled" : "Disabled",
            item.reminderCount || item.reminders?.filter((reminder) => reminder.enabled !== false).length || 0,
            item.lastTriggerAt ? toInputDate(item.lastTriggerAt).replace("T", " ") : "-",
            item.createdAt ? toInputDate(item.createdAt).replace("T", " ") : "-",
            item.updatedAt ? toInputDate(item.updatedAt).replace("T", " ") : "-",
            <div key={item.id || item._id} className="flex flex-wrap gap-2">
              <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => { setEditingPaymentAutoId(item.id || item._id); setPaymentAutoForm(normalizePaymentAutoForm(item)); }}>Edit</button>
              <button className={cn(ui.buttonBase, item.status === "enabled" ? ui.buttonSecondary : ui.buttonPrimary)} onClick={() => togglePaymentAuto(item)}>{item.status === "enabled" ? "Disable" : "Enable"}</button>
              <button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => deletePaymentAuto(item.id || item._id)}>Delete</button>
            </div>,
          ])} />

          <div className="mt-6">
            <h3 className="mb-3 text-lg font-black text-slate-900">Recent Logs</h3>
            <SimpleTable columns={["Event", "Stage", "User", "Payment Ref", "Status", "Created"]} rows={paymentAutoLogs.map((item) => [
              item.eventType || "-",
              item.stageName || "-",
              item.userId || "-",
              item.paymentReference || "-",
              item.status || item.reason || "-",
              item.createdAt ? toInputDate(item.createdAt).replace("T", " ") : "-",
            ])} />
          </div>
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
