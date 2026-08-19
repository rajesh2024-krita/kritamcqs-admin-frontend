import { useEffect, useState } from "react";
import { ctaConfigService } from "../api/ctaConfigService";
import { Field } from "../components/forms/Field";
import { SelectDropdown } from "../components/forms/SelectDropdown";
import { ToggleSwitch } from "../components/forms/ToggleSwitch";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";
import { alignmentOptions, ctaTypeOptions, getCtaTypeLabel, isValidCtaUrl, openInOptions } from "../utils/ctaOptions";
import {
  Link2,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Palette,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Mail,
  Bell,
  Sparkles,
  HelpCircle,
  BookOpen,
  Code,
  ExternalLink,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  Save,
  X,
  Type,
  Layout,
  Globe
} from "lucide-react";

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

const channelIcons = {
  both: Sparkles,
  email: Mail,
  push: Bell,
};

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

  // Compact input classes
  const compactInput = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
  const compactSelect = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none";
  const compactTextarea = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y min-h-[50px]";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200/60 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25">
              <Link2 size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">CTA Management</h1>
              <p className="text-xs text-slate-500">Create reusable CTA buttons for email and push notifications</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-medium text-indigo-700">
              {items.length} CTAs
            </span>
            <div className="flex items-center gap-0.5">
              <Filter size={9} className="text-slate-400" />
              <select className={cn(compactSelect, "w-32")} value={filter} onChange={(event) => setFilter(event.target.value)}>
                {channelOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          {editingId ? <Edit size={14} className="text-indigo-600" /> : <Plus size={14} className="text-indigo-600" />}
          <h2 className="text-xs font-semibold text-slate-900">{editingId ? "Edit CTA" : "Create CTA"}</h2>
        </div>
        <form onSubmit={save} className="space-y-2 pt-2">
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">CTA Name</label>
              <input className={compactInput} value={form.name} onChange={(event) => patch({ name: event.target.value })} placeholder="Premium renewal CTA" />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Channel</label>
              <select className={compactSelect} value={form.channel} onChange={(e) => patch({ channel: e.target.value })}>
                {channelOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg border border-slate-200/50 px-2 py-0.5">
                <ToggleSwitch checked={form.isActive !== false} onChange={(value) => patch({ isActive: value })} label="" size="sm" />
                <span className="text-[8px] font-medium text-slate-700">{form.isActive !== false ? "Active" : "Inactive"}</span>
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Button Text</label>
              <input className={compactInput} value={form.ctaText} onChange={(event) => patch({ ctaText: event.target.value })} placeholder="Renew Now" />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">CTA Type</label>
              <select className={compactSelect} value={form.ctaType} onChange={(e) => handleTypeChange(e.target.value)}>
                {ctaTypeOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Open In</label>
              <select className={compactSelect} value={form.openIn} onChange={(e) => patch({ openIn: e.target.value })}>
                {openInOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-0.5 sm:col-span-2 lg:col-span-3">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">CTA URL / Deep Link</label>
              <input className={compactInput} value={form.ctaUrl} onChange={(event) => patch({ ctaUrl: event.target.value })} placeholder="/subscription?user={{user_id}}" />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Button Color</label>
              <div className="flex gap-1">
                <input type="color" className="h-7 w-7 rounded border border-slate-200 bg-white p-0.5 cursor-pointer" value={colorInputValue(form.buttonColor, "#2563eb")} onChange={(event) => patch({ buttonColor: event.target.value })} />
                <input className={cn(compactInput, "flex-1")} value={form.buttonColor} onChange={(event) => patch({ buttonColor: event.target.value })} />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Text Color</label>
              <div className="flex gap-1">
                <input type="color" className="h-7 w-7 rounded border border-slate-200 bg-white p-0.5 cursor-pointer" value={colorInputValue(form.buttonTextColor, "#ffffff")} onChange={(event) => patch({ buttonTextColor: event.target.value })} />
                <input className={cn(compactInput, "flex-1")} value={form.buttonTextColor} onChange={(event) => patch({ buttonTextColor: event.target.value })} />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Alignment</label>
              <select className={compactSelect} value={form.buttonAlignment} onChange={(e) => patch({ buttonAlignment: e.target.value })}>
                {alignmentOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-0.5 sm:col-span-2 lg:col-span-3">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Description</label>
              <textarea className={compactTextarea} rows={2} value={form.description} onChange={(event) => patch({ description: event.target.value })} placeholder="When to use this CTA." />
            </div>
          </div>
          <div className="flex gap-1 pt-1 border-t border-slate-100">
            <button className={cn(
              "inline-flex items-center gap-0.5 px-2.5 py-0.5 text-[8px] font-medium rounded-lg transition-all",
              "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm shadow-indigo-500/25"
            )} type="submit">
              <Save size={9} /> {editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button type="button" className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[8px] font-medium text-slate-700 rounded-lg transition-colors" onClick={() => { setEditingId(""); setForm(emptyForm); }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Guide Section */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <HelpCircle size={14} className="text-indigo-600" />
          <h2 className="text-xs font-semibold text-slate-900">Help & Guide</h2>
        </div>
        <div className="grid grid-cols-1 gap-1.5 mt-2 sm:grid-cols-2">
          <div className="bg-slate-50 rounded-lg border border-slate-200/50 p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <BookOpen size={10} className="text-indigo-600" />
              <strong className="text-[8px] text-slate-900">How to add a CTA</strong>
            </div>
            <p className="text-[7px] text-slate-600">Create a CTA here, choose where it is available, then select it inside an Email Template or Push Notification form.</p>
          </div>
          <div className="bg-slate-50 rounded-lg border border-slate-200/50 p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Code size={10} className="text-indigo-600" />
              <strong className="text-[8px] text-slate-900">Fields</strong>
            </div>
            <p className="text-[7px] text-slate-600">Button Text is the visible label. CTA Type is a route shortcut. CTA URL / Deep Link is the final destination.</p>
          </div>
          <div className="bg-slate-50 rounded-lg border border-slate-200/50 p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Link2 size={10} className="text-indigo-600" />
              <strong className="text-[8px] text-slate-900">Placeholders</strong>
            </div>
            <p className="text-[7px] text-slate-600">URLs support template variables like <code className="text-[6px] bg-slate-200 px-0.5 py-0.5 rounded">{"{{user_id}}"}</code>, <code className="text-[6px] bg-slate-200 px-0.5 py-0.5 rounded">{"{{email}}"}</code>.</p>
          </div>
          <div className="bg-slate-50 rounded-lg border border-slate-200/50 p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <ExternalLink size={10} className="text-indigo-600" />
              <strong className="text-[8px] text-slate-900">Examples</strong>
            </div>
            <p className="text-[6px] text-slate-500 font-mono break-all">/subscription<br />/mock-tests<br />{"kritamcqs://subscription?plan={{plan_id}}"}</p>
          </div>
        </div>
      </div>

      {/* Saved CTAs Table */}
      <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 size={12} className="text-indigo-600" />
            <h2 className="text-xs font-semibold text-slate-900">Saved CTAs</h2>
            <span className="text-[8px] text-slate-400">({items.length})</span>
          </div>
          {loading && <span className="text-[8px] text-slate-400">Loading...</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                {["Name", "Channel", "Type", "Button", "URL", "Status", "Actions"].map((x) => (
                  <th key={x} className="px-2.5 py-1.5 text-left">
                    <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">{x}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const ChannelIcon = channelIcons[item.channel] || Sparkles;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-2.5 py-1.5">
                      <div className="text-[10px] font-semibold text-slate-900">{item.name}</div>
                      <div className="text-[7px] text-slate-400 truncate max-w-[120px]">{item.description || "—"}</div>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 rounded text-[7px] font-medium text-slate-600">
                        <ChannelIcon size={8} />
                        {channelOptions.find((option) => option.value === item.channel)?.label || item.channel}
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <span className="text-[8px] text-slate-600">{getCtaTypeLabel(item.ctaType)}</span>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <span className="text-[9px] font-medium text-indigo-600">{item.ctaText}</span>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="max-w-[120px] truncate text-[7px] text-slate-500 font-mono">{item.ctaUrl}</div>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <span className={cn(
                        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[7px] font-medium",
                        item.isActive !== false ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"
                      )}>
                        {item.isActive !== false ? <CheckCircle size={8} /> : <XCircle size={8} />}
                        {item.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="flex items-center gap-0.5">
                        <button className="p-0.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" onClick={() => { setEditingId(item.id); setForm({ ...emptyForm, ...item }); }}>
                          <Edit size={11} />
                        </button>
                        <button className="p-0.5 text-rose-600 hover:bg-rose-50 rounded transition-colors" onClick={() => remove(item)}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!items.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Link2 size={16} className="text-slate-300" />
                      <span className="text-[10px] text-slate-500">No CTA configurations found</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}