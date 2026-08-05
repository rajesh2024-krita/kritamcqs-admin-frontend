import { useEffect, useState } from "react";
import { ctaConfigService } from "../api/ctaConfigService";
import { Field } from "../components/forms/Field";
import { SelectDropdown } from "../components/forms/SelectDropdown";
import { ToggleSwitch } from "../components/forms/ToggleSwitch";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";
import { alignmentOptions, ctaTypeOptions, getCtaTypeLabel, isValidCtaUrl, openInOptions } from "../utils/ctaOptions";

const emptyForm = {
  name: "",
  description: "",
  channel: "both",
  ctaText: "",
  ctaType: "none",
  ctaUrl: "",
  openIn: "auto",
  buttonColor: "#2563eb",
  buttonTextColor: "#ffffff",
  buttonAlignment: "center",
  isActive: true,
};

const channelOptions = [
  { value: "both", label: "Email + Push" },
  { value: "email", label: "Email Templates" },
  { value: "push", label: "Push Notifications" },
];

function colorInputValue(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(String(value || "")) ? value : fallback;
}

export function CtaManagementPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [filter, setFilter] = useState("both");
  const [loading, setLoading] = useState(false);

  async function loadItems() {
    setLoading(true);
    try {
      const params = filter === "both" ? {} : { channel: filter };
      const response = await ctaConfigService.list(params);
      const payload = response?.data ?? response;
      setItems(Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, [filter]);

  function patch(value) {
    setForm((current) => ({ ...current, ...value }));
  }

  function handleTypeChange(value) {
    const option = ctaTypeOptions.find((item) => item.value === value);
    patch({ ctaType: value, ctaUrl: option?.url !== undefined ? option.url : form.ctaUrl });
  }

  async function save(event) {
    event.preventDefault();
    if (!form.name.trim()) return toast.error("CTA name is required.");
    if (!form.ctaText.trim()) return toast.error("CTA button text is required.");
    if (!isValidCtaUrl(form.ctaUrl)) return toast.error("Enter a valid HTTPS URL or custom deep link.");
    try {
      if (editingId) await ctaConfigService.update(editingId, form);
      else await ctaConfigService.create(form);
      toast.success(editingId ? "CTA updated." : "CTA created.");
      setForm(emptyForm);
      setEditingId("");
      await loadItems();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function remove(item) {
    if (!window.confirm(`Delete CTA "${item.name}"?`)) return;
    try {
      await ctaConfigService.delete(item.id);
      toast.success("CTA deleted.");
      await loadItems();
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <div className={ui.eyebrow}>CTA Management</div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Call-to-Action Configurations</h1>
            <p className={ui.muted}>Create reusable CTA buttons and deep links for email templates and push notifications.</p>
          </div>
          <select className={ui.input} value={filter} onChange={(event) => setFilter(event.target.value)}>
            {channelOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
      </section>

      <section className={ui.panel}>
        <form onSubmit={save} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field label="CTA Name"><input className={ui.input} value={form.name} onChange={(event) => patch({ name: event.target.value })} placeholder="Premium renewal CTA" /></Field>
          <Field label="Available In"><SelectDropdown value={form.channel} onChange={(value) => patch({ channel: value })} options={channelOptions} /></Field>
          <Field label="Active"><ToggleSwitch checked={form.isActive !== false} onChange={(value) => patch({ isActive: value })} label={form.isActive !== false ? "Active" : "Inactive"} /></Field>
          <Field label="Button Text"><input className={ui.input} value={form.ctaText} onChange={(event) => patch({ ctaText: event.target.value })} placeholder="Renew Now" /></Field>
          <Field label="CTA Type"><SelectDropdown value={form.ctaType} onChange={handleTypeChange} options={ctaTypeOptions.map(({ value, label }) => ({ value, label }))} /></Field>
          <Field label="Open In"><SelectDropdown value={form.openIn} onChange={(value) => patch({ openIn: value })} options={openInOptions} /></Field>
          <Field label="CTA URL / Deep Link" className="lg:col-span-3"><input className={ui.input} value={form.ctaUrl} onChange={(event) => patch({ ctaUrl: event.target.value })} placeholder="/subscription?user={{user_id}}" /></Field>
          <Field label="Button Color"><div className="flex gap-3"><input type="color" className="h-11 w-14 rounded-lg border border-slate-200 bg-white p-1" value={colorInputValue(form.buttonColor, "#2563eb")} onChange={(event) => patch({ buttonColor: event.target.value })} /><input className={ui.input} value={form.buttonColor} onChange={(event) => patch({ buttonColor: event.target.value })} /></div></Field>
          <Field label="Button Text Color"><div className="flex gap-3"><input type="color" className="h-11 w-14 rounded-lg border border-slate-200 bg-white p-1" value={colorInputValue(form.buttonTextColor, "#ffffff")} onChange={(event) => patch({ buttonTextColor: event.target.value })} /><input className={ui.input} value={form.buttonTextColor} onChange={(event) => patch({ buttonTextColor: event.target.value })} /></div></Field>
          <Field label="Button Alignment"><SelectDropdown value={form.buttonAlignment} onChange={(value) => patch({ buttonAlignment: value })} options={alignmentOptions} /></Field>
          <Field label="Description" className="lg:col-span-3"><textarea className={ui.textarea} value={form.description} onChange={(event) => patch({ description: event.target.value })} placeholder="When to use this CTA." /></Field>
          <div className="flex gap-3 lg:col-span-3">
            <button className={cn(ui.buttonBase, ui.buttonPrimary)}>{editingId ? "Update CTA" : "Create CTA"}</button>
            {editingId ? <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => { setEditingId(""); setForm(emptyForm); }}>Cancel</button> : null}
          </div>
        </form>
      </section>

      <section className={ui.panel}>
        <div className="mb-4">
          <div className={ui.eyebrow}>Guide</div>
          <h2 className="text-xl font-black text-slate-900">Help / Guide</h2>
        </div>
        <div className="grid gap-4 text-sm text-slate-700 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><strong>How to add a CTA</strong><p className="mt-2">Create a CTA here, choose where it is available, then select it inside an Email Template or Push Notification form. You can still override fields after selection.</p></div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><strong>Fields</strong><p className="mt-2">Button Text is the visible label. CTA Type is a route shortcut. CTA URL / Deep Link is the final destination. Open In controls app/web preference. Colors and alignment are used by email buttons.</p></div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><strong>Placeholders</strong><p className="mt-2">URLs support template variables such as <code>{"{{user_id}}"}</code>, <code>{"{{email}}"}</code>, <code>{"{{plan_name}}"}</code>, <code>{"{{referral_code}}"}</code>, <code>{"{{notification_id}}"}</code>, and any variables sent with the email or notification campaign.</p></div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><strong>Examples</strong><p className="mt-2"><code>/subscription</code><br /><code>/mock-tests</code><br /><code>https://app.kritamcqs.com/cta?target=%2Fsubscription</code><br /><code>https://kritamcqs.com</code><br /><code>{"kritamcqs://subscription?plan={{plan_id}}"}</code><br /><code>{"/profile?ref={{referral_code}}"}</code></p></div>
        </div>
      </section>

      <section className={ui.panel}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900">Saved CTAs</h2>
          {loading ? <span className="text-sm font-semibold text-slate-500">Loading...</span> : null}
        </div>
        <div className={ui.tableWrap}>
          <div className={ui.tableScroll}>
            <table className={ui.table}>
              <thead><tr><th className={ui.tableHead}>Name</th><th className={ui.tableHead}>Channel</th><th className={ui.tableHead}>Type</th><th className={ui.tableHead}>Button</th><th className={ui.tableHead}>URL</th><th className={ui.tableHead}>Status</th><th className={ui.tableHead}>Actions</th></tr></thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className={ui.tableCell}><div className="font-bold text-slate-900">{item.name}</div><div className="text-xs text-slate-500">{item.description}</div></td>
                    <td className={ui.tableCell}>{channelOptions.find((option) => option.value === item.channel)?.label || item.channel}</td>
                    <td className={ui.tableCell}>{getCtaTypeLabel(item.ctaType)}</td>
                    <td className={ui.tableCell}>{item.ctaText}</td>
                    <td className={ui.tableCell}><div className="max-w-sm truncate">{item.ctaUrl}</div></td>
                    <td className={ui.tableCell}><span className={cn(ui.pill, item.isActive !== false ? ui.pillSuccess : ui.pillGray)}>{item.isActive !== false ? "Active" : "Inactive"}</span></td>
                    <td className={ui.tableCell}><div className="flex gap-2"><button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => { setEditingId(item.id); setForm({ ...emptyForm, ...item }); }}>Edit</button><button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => remove(item)}>Delete</button></div></td>
                  </tr>
                ))}
                {!items.length ? <tr><td className="py-8 text-center text-sm text-slate-500" colSpan={7}>No CTA configurations found.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
