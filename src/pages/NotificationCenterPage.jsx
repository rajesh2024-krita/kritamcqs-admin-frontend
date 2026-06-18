import { useEffect, useMemo, useState } from "react";
import { notificationService } from "../api/notificationService";
import { cn, ui } from "../ui";

const targetOptions = [
  { value: "all", label: "All Users" },
  { value: "free", label: "Free Users" },
  { value: "premium", label: "Premium Users" },
  { value: "neet", label: "NEET Users" },
  { value: "jee", label: "JEE Users" },
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

const emptyTemplate = {
  name: "",
  title: "",
  message: "",
  image: "",
  deepLink: "/notifications",
  targetType: "all",
  category: "custom",
  sound: "default",
  priority: "high",
  status: true,
};

const emptySend = {
  templateId: "",
  title: "",
  message: "",
  image: "",
  deepLink: "/notifications",
  targetType: "all",
  selectedUsers: "",
  category: "custom",
  sound: "default",
  priority: "high",
  scheduleDate: "",
  action: "send",
};

function toInputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

export function NotificationCenterPage() {
  const [tab, setTab] = useState("send");
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [stats, setStats] = useState(null);
  const [templateForm, setTemplateForm] = useState(emptyTemplate);
  const [editingTemplateId, setEditingTemplateId] = useState("");
  const [sendForm, setSendForm] = useState(emptySend);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadAll() {
    const [templateResponse, historyResponse, scheduledResponse, statsResponse] = await Promise.all([
      notificationService.templates(),
      notificationService.history({ limit: 50 }),
      notificationService.scheduled(),
      notificationService.stats(),
    ]);
    setTemplates(templateResponse.data || []);
    setHistory(historyResponse.data || []);
    setScheduled(scheduledResponse.data || []);
    setStats(statsResponse.data || null);
  }

  useEffect(() => {
    loadAll().catch((error) => setMessage(error.message));
  }, []);

  const activeTemplate = useMemo(
    () => templates.find((item) => String(item.id || item._id) === String(sendForm.templateId)),
    [templates, sendForm.templateId],
  );

  useEffect(() => {
    if (!activeTemplate) return;
    setSendForm((current) => ({
      ...current,
      title: activeTemplate.title || "",
      message: activeTemplate.message || "",
      image: activeTemplate.image || "",
      deepLink: activeTemplate.deepLink || "/notifications",
      targetType: activeTemplate.targetType || "all",
      category: activeTemplate.category || "custom",
      sound: activeTemplate.sound || "default",
      priority: activeTemplate.priority || "high",
    }));
  }, [activeTemplate]);

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
    setBusy(true);
    setMessage("");
    try {
      const response = await notificationService.send(sendForm);
      await loadAll();
      setMessage(response.message || "Notification request completed.");
      if (sendForm.action === "send") setSendForm(emptySend);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
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
        <div className="grid gap-3 md:grid-cols-5">
          {[
            ["send", "Send Notification"],
            ["templates", "Templates"],
            ["scheduled", "Scheduled"],
            ["history", "History"],
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
          <h2 className="mb-4 text-xl font-black text-slate-900">Send Notification</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            <label className={ui.field}><span>Use Template</span><select className={ui.input} value={sendForm.templateId} onChange={(event) => setSendForm((current) => ({ ...current, templateId: event.target.value }))}><option value="">Custom Notification</option>{templates.filter((item) => item.status !== false).map((item) => <option key={item.id || item._id} value={item.id || item._id}>{item.name}</option>)}</select></label>
            <label className={ui.field}><span>Title</span><input className={ui.input} value={sendForm.title} onChange={(event) => setSendForm((current) => ({ ...current, title: event.target.value }))} required /></label>
            <label className={ui.field}><span>Target Audience</span><select className={ui.input} value={sendForm.targetType} onChange={(event) => setSendForm((current) => ({ ...current, targetType: event.target.value }))}>{targetOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className={cn(ui.field, "lg:col-span-3")}><span>Message</span><textarea className={ui.textarea} value={sendForm.message} onChange={(event) => setSendForm((current) => ({ ...current, message: event.target.value }))} required /></label>
            <label className={ui.field}><span>Image URL</span><input className={ui.input} value={sendForm.image} onChange={(event) => setSendForm((current) => ({ ...current, image: event.target.value }))} /></label>
            <label className={ui.field}><span>Deep Link</span><input className={ui.input} list="notification-deep-links" value={sendForm.deepLink} onChange={(event) => setSendForm((current) => ({ ...current, deepLink: event.target.value }))} /><datalist id="notification-deep-links">{deepLinks.map((item) => <option key={item} value={item} />)}</datalist></label>
            <label className={ui.field}><span>Category</span><select className={ui.input} value={sendForm.category} onChange={(event) => setSendForm((current) => ({ ...current, category: event.target.value }))}>{categoryOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className={ui.field}><span>Sound</span><select className={ui.input} value={sendForm.sound} onChange={(event) => setSendForm((current) => ({ ...current, sound: event.target.value }))}><option value="default">Default</option><option value="custom">Custom</option><option value="silent">Silent</option></select></label>
            <label className={ui.field}><span>Priority</span><select className={ui.input} value={sendForm.priority} onChange={(event) => setSendForm((current) => ({ ...current, priority: event.target.value }))}><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select></label>
            <label className={ui.field}><span>Action</span><select className={ui.input} value={sendForm.action} onChange={(event) => setSendForm((current) => ({ ...current, action: event.target.value }))}><option value="send">Send Now</option><option value="schedule">Schedule</option><option value="draft">Save Draft</option></select></label>
            {sendForm.action === "schedule" ? <label className={ui.field}><span>Schedule Date</span><input className={ui.input} type="datetime-local" value={sendForm.scheduleDate} onChange={(event) => setSendForm((current) => ({ ...current, scheduleDate: event.target.value }))} required /></label> : null}
            {sendForm.targetType === "selected" ? <label className={cn(ui.field, "lg:col-span-3")}><span>Selected Users</span><textarea className={ui.textarea} placeholder="Paste user IDs, emails, or mobiles separated by comma/new line" value={sendForm.selectedUsers} onChange={(event) => setSendForm((current) => ({ ...current, selectedUsers: event.target.value }))} /></label> : null}
          </div>
          <div className="mt-5 flex justify-end">
            <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={busy}>{busy ? "Working..." : sendForm.action === "send" ? "Send Now" : sendForm.action === "schedule" ? "Schedule" : "Save Draft"}</button>
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
            <label className={ui.field}><span>Deep Link</span><input className={ui.input} value={templateForm.deepLink} onChange={(event) => setTemplateForm((current) => ({ ...current, deepLink: event.target.value }))} /></label>
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
          <SimpleTable columns={["Title", "Audience", "Schedule", "Status", "Actions"]} rows={scheduled.map((item) => [
            item.title,
            item.targetType,
            toInputDate(item.scheduleDate).replace("T", " "),
            item.status,
            item.status === "pending" ? <button key={item.id || item._id} className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => cancelSchedule(item.id || item._id)}>Cancel</button> : "-",
          ])} />
        </section>
      ) : null}

      {tab === "history" ? (
        <section className={ui.panel}>
          <SimpleTable columns={["Title", "Audience", "Sent", "Delivered", "Failed", "No Token", "Status"]} rows={history.map((item) => [
            item.title,
            item.targetType,
            item.sentCount || 0,
            item.successCount || 0,
            item.failedCount || 0,
            item.noTokenCount || 0,
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
