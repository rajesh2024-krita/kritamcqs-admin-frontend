import { useEffect, useState } from "react";
import { Image, RefreshCw, Save, Upload, Eye, EyeOff, Timer, Layout, Palette, Settings, Zap, Users, Calendar, Link as LinkIcon, Type, AlignCenter, Square, Circle, Move, X } from "lucide-react";
import { offerTimerService } from "../api/offerTimerService";
import { uploadService } from "../api/uploadService";
import { cn, ui } from "../ui";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "https://adminapi.kritamcqs.com/api" : "http://localhost:3001/api");

const emptyForm = {
  enabled: false,
  title: "",
  subtitle: "",
  description: "",
  image: "",
  ctaText: "",
  ctaLink: "",
  startAt: "",
  endAt: "",
  audience: "all",
  widgetStyle: {
    shape: "circle",
    size: 88,
    width: 88,
    height: 88,
    borderRadius: 999,
    backgroundColor: "#f97316",
    textColor: "#ffffff",
    borderColor: "#ffffff",
    borderWidth: 1,
    shadow: "strong",
    icon: "",
    iconImage: "",
    fontSize: 15,
    fontWeight: "900",
    countdownFormat: "HH:MM:SS",
    showClose: true,
    closeButtonColor: "#020617",
    closeButtonTextColor: "#ffffff",
    draggable: true,
    defaultPosition: "bottomRight",
    offsetX: 16,
    offsetY: 96,
  },
  popupStyle: {
    backgroundColor: "#ffffff",
    titleColor: "#0f172a",
    subtitleColor: "#ea580c",
    descriptionColor: "#475569",
    timerColor: "#ea580c",
    buttonColor: "#0f172a",
    buttonTextColor: "#ffffff",
    borderRadius: 24,
    layout: "banner",
  },
};

const audienceOptions = [
  { label: "All Users", value: "all" },
  { label: "Premium Users", value: "premium" },
  { label: "Non-Premium Users", value: "nonPremium" },
  { label: "New Registered Users", value: "newRegistered" },
  { label: "New Registered Non-Premium Users", value: "newRegisteredNonPremium" },
];
const shapeOptions = [
  { label: "Circle", value: "circle" },
  { label: "Rounded Square", value: "rounded" },
  { label: "Square", value: "square" },
  { label: "Pill Shape", value: "pill" },
  { label: "Custom Radius", value: "custom" },
];
const shadowOptions = [
  { label: "None", value: "none" },
  { label: "Soft", value: "soft" },
  { label: "Medium", value: "medium" },
  { label: "Strong", value: "strong" },
];
const positionOptions = [
  { label: "Bottom Right", value: "bottomRight" },
  { label: "Bottom Left", value: "bottomLeft" },
  { label: "Top Right", value: "topRight" },
  { label: "Top Left", value: "topLeft" },
];
const countdownFormatOptions = [
  { label: "HH:MM:SS", value: "HH:MM:SS" },
  { label: "MM:SS", value: "MM:SS" },
  { label: "Compact", value: "compact" },
  { label: "Offer Label", value: "label" },
];
const fontWeightOptions = [
  { label: "Medium", value: "500" },
  { label: "Semi Bold", value: "600" },
  { label: "Bold", value: "700" },
  { label: "Extra Bold", value: "800" },
  { label: "Black", value: "900" },
];
const layoutOptions = [
  { label: "Banner Image", value: "banner" },
  { label: "Card", value: "card" },
  { label: "Compact", value: "compact" },
];

function toDateTimeInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function assetUrl(value) {
  if (!value || !String(value).startsWith("/uploads/")) return value;
  return `${API_BASE_URL.replace(/\/api\/?$/, "")}${value}`;
}

function shadowValue(value) {
  if (value === "none") return "none";
  if (value === "soft") return "0 10px 24px rgba(15, 23, 42, 0.16)";
  if (value === "medium") return "0 16px 34px rgba(15, 23, 42, 0.22)";
  return "0 20px 44px rgba(249, 115, 22, 0.36)";
}

function widgetRadius(style, width, height) {
  if (style.shape === "circle") return Math.min(width, height) / 2;
  if (style.shape === "pill") return 999;
  if (style.shape === "custom") return Number(style.borderRadius || 0);
  if (style.shape === "square") return 0;
  return 28;
}

function getWidgetPreviewStyle(style) {
  const legacySize = Number(style.size || 88);
  const width = Number(style.width || legacySize);
  const height = Number(style.height || legacySize);
  return {
    width,
    height,
    borderRadius: widgetRadius(style, width, height),
    background: style.backgroundColor,
    color: style.textColor,
    border: `${Number(style.borderWidth || 0)}px solid ${style.borderColor}`,
    boxShadow: shadowValue(style.shadow),
    fontSize: Number(style.fontSize || 15),
    fontWeight: Number(style.fontWeight || 900),
  };
}

export function OfferTimerManagementPage() {
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [activeSection, setActiveSection] = useState("content");

  function patch(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function patchNested(group, key, value) {
    setForm((current) => ({ ...current, [group]: { ...current[group], [key]: value } }));
  }

  function normalizeForm(data = {}) {
    return {
      ...emptyForm,
      enabled: Boolean(data.enabled),
      title: data.title || "",
      subtitle: data.subtitle || "",
      description: data.description || "",
      image: data.image || "",
      ctaText: data.ctaText || "",
      ctaLink: data.ctaLink || "",
      startAt: toDateTimeInput(data.startAt),
      endAt: toDateTimeInput(data.endAt),
      audience: data.audience || "all",
      widgetStyle: { ...emptyForm.widgetStyle, ...(data.widgetStyle || {}) },
      popupStyle: { ...emptyForm.popupStyle, ...(data.popupStyle || {}) },
    };
  }

  async function loadOffer() {
    setStatus("loading");
    setMessage("");
    try {
      const response = await offerTimerService.get();
      setForm(normalizeForm(response.data || {}));
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Unable to load offer timer settings.");
    }
  }

  useEffect(() => {
    void loadOffer();
  }, []);

  async function saveOffer() {
    setStatus("saving");
    setMessage("");
    try {
      const response = await offerTimerService.update(form);
      setForm(normalizeForm(response.data || {}));
      setStatus("idle");
      setMessage("Offer timer settings saved successfully.");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Unable to save offer timer settings.");
    }
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const response = await uploadService.appImage(file, "offer-timer");
      patch("image", response.data?.url || response.data?.path || response.url || "");
      setMessage("Offer image uploaded.");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Unable to upload offer image.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function uploadWidgetIcon(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const response = await uploadService.appImage(file, "offer-timer");
      patchNested("widgetStyle", "iconImage", response.data?.url || response.data?.path || response.url || "");
      setMessage("Widget icon uploaded.");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Unable to upload widget icon.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  const preview = assetUrl(form.image);
  const widgetIconPreview = assetUrl(form.widgetStyle.iconImage);
  const widgetPreviewStyle = getWidgetPreviewStyle(form.widgetStyle);

  // Compact input classes
  const compactInput = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
  const compactSelect = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none";
  const compactTextarea = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y min-h-[60px]";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200/60 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg shadow-lg shadow-orange-500/25">
              <Timer size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Offer Timer Management</h1>
              <p className="text-xs text-slate-500">Configure floating in-app countdown timer</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn(
              "inline-flex px-2 py-0.5 rounded text-[9px] font-medium",
              form.enabled ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"
            )}>
              {form.enabled ? "Active" : "Disabled"}
            </span>
            <button type="button" className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[9px] font-medium text-slate-700 rounded transition-colors" onClick={loadOffer} disabled={status === "loading"}>
              <RefreshCw size={10} className={status === "loading" ? "animate-spin" : ""} /> {status === "loading" ? "..." : "Refresh"}
            </button>
            <button type="button" className="inline-flex items-center gap-0.5 px-2.5 py-0.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-[9px] font-medium rounded-lg transition-all shadow-sm shadow-orange-500/25" onClick={saveOffer} disabled={status === "saving"}>
              <Save size={10} /> {status === "saving" ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={cn(
          "rounded-lg border px-3 py-1.5 text-[10px] font-medium",
          status === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
        )}>
          {message}
        </div>
      )}

      {/* Section Tabs */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-1 shadow-sm flex flex-wrap gap-0.5">
        {[
          { key: "content", label: "Content", icon: Type },
          { key: "widget", label: "Widget UI", icon: Square },
          { key: "popup", label: "Popup UI", icon: Layout },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.key;
          return (
            <button
              key={tab.key}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-medium rounded-lg transition-all",
                isActive
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-sm shadow-orange-500/25"
                  : "text-slate-600 hover:bg-slate-100"
              )}
              onClick={() => setActiveSection(tab.key)}
            >
              <Icon size={10} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Section */}
      {activeSection === "content" && (
        <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Type size={14} className="text-orange-600" />
            <h2 className="text-xs font-semibold text-slate-900">Content Settings</h2>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Enable Timer</label>
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200/50 px-3 py-0.5">
                <input type="checkbox" className="h-3 w-3 rounded border-slate-300 text-orange-600 focus:ring-1 focus:ring-orange-500/20" checked={form.enabled} onChange={(event) => patch("enabled", event.target.checked)} />
                <span className="text-[8px] font-medium text-slate-700">{form.enabled ? "Enabled" : "Disabled"}</span>
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Audience</label>
              <select className={compactSelect} value={form.audience} onChange={(event) => patch("audience", event.target.value)}>
                {audienceOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Title</label>
              <input className={compactInput} value={form.title} onChange={(event) => patch("title", event.target.value)} placeholder="Offer title" />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Subtitle</label>
              <input className={compactInput} value={form.subtitle} onChange={(event) => patch("subtitle", event.target.value)} placeholder="Offer subtitle" />
            </div>
            <div className="flex flex-col gap-0.5 sm:col-span-2">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Description</label>
              <textarea className={compactTextarea} rows={2} value={form.description} onChange={(event) => patch("description", event.target.value)} placeholder="Offer description" />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">CTA Text</label>
              <input className={compactInput} value={form.ctaText} onChange={(event) => patch("ctaText", event.target.value)} placeholder="Claim Now" />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">CTA Link</label>
              <input className={compactInput} value={form.ctaLink} onChange={(event) => patch("ctaLink", event.target.value)} placeholder="/subscription" />
            </div>
            <div className="flex flex-col gap-0.5 sm:col-span-2">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Offer Image</label>
              <div className="flex gap-1">
                <input className={cn(compactInput, "flex-1")} value={form.image} onChange={(event) => patch("image", event.target.value)} placeholder="/uploads/offer-timer/image.webp" />
                <label className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-[8px] font-medium rounded transition-colors cursor-pointer", "bg-slate-100 hover:bg-slate-200 text-slate-700")}>
                  <Upload size={10} /> {uploading ? "..." : "Upload"}
                  <input type="file" accept="image/*" className="hidden" onChange={uploadImage} disabled={uploading} />
                </label>
              </div>
              {preview && (
                <img src={preview} alt="Offer preview" className="mt-1 h-20 w-full rounded-lg border border-slate-200 object-contain bg-slate-50" />
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Start Date</label>
              <input className={compactInput} type="datetime-local" value={form.startAt} onChange={(event) => patch("startAt", event.target.value)} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">End Date</label>
              <input className={compactInput} type="datetime-local" value={form.endAt} onChange={(event) => patch("endAt", event.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Widget Section */}
      {activeSection === "widget" && (
        <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <Square size={14} className="text-orange-600" />
              <h2 className="text-xs font-semibold text-slate-900">Floating Widget UI</h2>
            </div>
            <div className="relative" style={{ width: widgetPreviewStyle.width + 20, height: widgetPreviewStyle.height + 20 }}>
              <div className="absolute top-0 left-0" style={{ width: widgetPreviewStyle.width, height: widgetPreviewStyle.height }}>
                {form.widgetStyle.showClose && (
                  <span className="absolute -right-1 -top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-black shadow-lg" style={{ backgroundColor: form.widgetStyle.closeButtonColor, color: form.widgetStyle.closeButtonTextColor }}>
                    ✕
                  </span>
                )}
                <div className="flex h-full w-full select-none flex-col items-center justify-center gap-0.5 text-center font-mono leading-tight" style={widgetPreviewStyle}>
                  {widgetIconPreview && <img src={widgetIconPreview} alt="" className="h-5 w-5 object-contain" />}
                  {form.widgetStyle.icon && <span className="text-[10px] font-black">{form.widgetStyle.icon}</span>}
                  <span className="text-[10px]">
                    {form.widgetStyle.countdownFormat === "label" ? "OFFER" : form.widgetStyle.countdownFormat === "compact" ? "1h 25m" : form.widgetStyle.countdownFormat === "MM:SS" ? "85:30" : "01:25:30"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Shape</label>
              <select className={compactSelect} value={form.widgetStyle.shape} onChange={(event) => patchNested("widgetStyle", "shape", event.target.value)}>
                {shapeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Width (px)</label>
              <input className={compactInput} type="number" value={form.widgetStyle.width} onChange={(event) => patchNested("widgetStyle", "width", Number(event.target.value))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Height (px)</label>
              <input className={compactInput} type="number" value={form.widgetStyle.height} onChange={(event) => patchNested("widgetStyle", "height", Number(event.target.value))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Border Radius</label>
              <input className={compactInput} type="number" value={form.widgetStyle.borderRadius} onChange={(event) => patchNested("widgetStyle", "borderRadius", Number(event.target.value))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Background</label>
              <div className="flex gap-1">
                <input type="color" className="h-6 w-6 rounded border border-slate-200 p-0.5 cursor-pointer" value={form.widgetStyle.backgroundColor} onChange={(event) => patchNested("widgetStyle", "backgroundColor", event.target.value)} />
                <input className={cn(compactInput, "flex-1")} value={form.widgetStyle.backgroundColor} onChange={(event) => patchNested("widgetStyle", "backgroundColor", event.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Text Color</label>
              <div className="flex gap-1">
                <input type="color" className="h-6 w-6 rounded border border-slate-200 p-0.5 cursor-pointer" value={form.widgetStyle.textColor} onChange={(event) => patchNested("widgetStyle", "textColor", event.target.value)} />
                <input className={cn(compactInput, "flex-1")} value={form.widgetStyle.textColor} onChange={(event) => patchNested("widgetStyle", "textColor", event.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Font Size</label>
              <input className={compactInput} type="number" value={form.widgetStyle.fontSize} onChange={(event) => patchNested("widgetStyle", "fontSize", Number(event.target.value))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Font Weight</label>
              <select className={compactSelect} value={form.widgetStyle.fontWeight} onChange={(event) => patchNested("widgetStyle", "fontWeight", event.target.value)}>
                {fontWeightOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Countdown Format</label>
              <select className={compactSelect} value={form.widgetStyle.countdownFormat} onChange={(event) => patchNested("widgetStyle", "countdownFormat", event.target.value)}>
                {countdownFormatOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Border Color</label>
              <div className="flex gap-1">
                <input type="color" className="h-6 w-6 rounded border border-slate-200 p-0.5 cursor-pointer" value={form.widgetStyle.borderColor} onChange={(event) => patchNested("widgetStyle", "borderColor", event.target.value)} />
                <input className={cn(compactInput, "flex-1")} value={form.widgetStyle.borderColor} onChange={(event) => patchNested("widgetStyle", "borderColor", event.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Border Width</label>
              <input className={compactInput} type="number" value={form.widgetStyle.borderWidth} onChange={(event) => patchNested("widgetStyle", "borderWidth", Number(event.target.value))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Shadow</label>
              <select className={compactSelect} value={form.widgetStyle.shadow} onChange={(event) => patchNested("widgetStyle", "shadow", event.target.value)}>
                {shadowOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Icon Text</label>
              <input className={compactInput} value={form.widgetStyle.icon} onChange={(event) => patchNested("widgetStyle", "icon", event.target.value)} placeholder="%" />
            </div>
            <div className="flex flex-col gap-0.5 sm:col-span-2">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Icon Image</label>
              <div className="flex gap-1">
                <input className={cn(compactInput, "flex-1")} value={form.widgetStyle.iconImage || ""} onChange={(event) => patchNested("widgetStyle", "iconImage", event.target.value)} placeholder="/uploads/offer-timer/icon.webp" />
                <label className={cn("inline-flex items-center gap-0.5 px-2 py-0.5 text-[7px] font-medium rounded transition-colors cursor-pointer", "bg-slate-100 hover:bg-slate-200 text-slate-700")}>
                  <Upload size={9} /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={uploadWidgetIcon} disabled={uploading} />
                </label>
              </div>
              {widgetIconPreview && <img src={widgetIconPreview} alt="Widget icon" className="h-8 w-8 rounded border border-slate-200 object-contain" />}
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg border border-slate-200/50 px-2 py-0.5">
              <input type="checkbox" className="h-3 w-3 rounded border-slate-300 text-orange-600 focus:ring-1 focus:ring-orange-500/20" checked={Boolean(form.widgetStyle.showClose)} onChange={(event) => patchNested("widgetStyle", "showClose", event.target.checked)} />
              <span className="text-[7px] font-medium text-slate-600">Close Button</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg border border-slate-200/50 px-2 py-0.5">
              <input type="checkbox" className="h-3 w-3 rounded border-slate-300 text-orange-600 focus:ring-1 focus:ring-orange-500/20" checked={Boolean(form.widgetStyle.draggable)} onChange={(event) => patchNested("widgetStyle", "draggable", event.target.checked)} />
              <span className="text-[7px] font-medium text-slate-600">Draggable</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Close Btn Color</label>
              <div className="flex gap-1">
                <input type="color" className="h-6 w-6 rounded border border-slate-200 p-0.5 cursor-pointer" value={form.widgetStyle.closeButtonColor} onChange={(event) => patchNested("widgetStyle", "closeButtonColor", event.target.value)} />
                <input className={cn(compactInput, "flex-1")} value={form.widgetStyle.closeButtonColor} onChange={(event) => patchNested("widgetStyle", "closeButtonColor", event.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Close Btn Text</label>
              <div className="flex gap-1">
                <input type="color" className="h-6 w-6 rounded border border-slate-200 p-0.5 cursor-pointer" value={form.widgetStyle.closeButtonTextColor} onChange={(event) => patchNested("widgetStyle", "closeButtonTextColor", event.target.value)} />
                <input className={cn(compactInput, "flex-1")} value={form.widgetStyle.closeButtonTextColor} onChange={(event) => patchNested("widgetStyle", "closeButtonTextColor", event.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Default Position</label>
              <select className={compactSelect} value={form.widgetStyle.defaultPosition} onChange={(event) => patchNested("widgetStyle", "defaultPosition", event.target.value)}>
                {positionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Offset X</label>
              <input className={compactInput} type="number" value={form.widgetStyle.offsetX} onChange={(event) => patchNested("widgetStyle", "offsetX", Number(event.target.value))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Offset Y</label>
              <input className={compactInput} type="number" value={form.widgetStyle.offsetY} onChange={(event) => patchNested("widgetStyle", "offsetY", Number(event.target.value))} />
            </div>
          </div>
        </div>
      )}

      {/* Popup Section */}
      {activeSection === "popup" && (
        <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Layout size={14} className="text-orange-600" />
            <h2 className="text-xs font-semibold text-slate-900">Offer Popup UI</h2>
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Layout</label>
              <select className={compactSelect} value={form.popupStyle.layout} onChange={(event) => patchNested("popupStyle", "layout", event.target.value)}>
                {layoutOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Border Radius</label>
              <input className={compactInput} type="number" value={form.popupStyle.borderRadius} onChange={(event) => patchNested("popupStyle", "borderRadius", Number(event.target.value))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Background</label>
              <div className="flex gap-1">
                <input type="color" className="h-6 w-6 rounded border border-slate-200 p-0.5 cursor-pointer" value={form.popupStyle.backgroundColor} onChange={(event) => patchNested("popupStyle", "backgroundColor", event.target.value)} />
                <input className={cn(compactInput, "flex-1")} value={form.popupStyle.backgroundColor} onChange={(event) => patchNested("popupStyle", "backgroundColor", event.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Title Color</label>
              <div className="flex gap-1">
                <input type="color" className="h-6 w-6 rounded border border-slate-200 p-0.5 cursor-pointer" value={form.popupStyle.titleColor} onChange={(event) => patchNested("popupStyle", "titleColor", event.target.value)} />
                <input className={cn(compactInput, "flex-1")} value={form.popupStyle.titleColor} onChange={(event) => patchNested("popupStyle", "titleColor", event.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Subtitle Color</label>
              <div className="flex gap-1">
                <input type="color" className="h-6 w-6 rounded border border-slate-200 p-0.5 cursor-pointer" value={form.popupStyle.subtitleColor} onChange={(event) => patchNested("popupStyle", "subtitleColor", event.target.value)} />
                <input className={cn(compactInput, "flex-1")} value={form.popupStyle.subtitleColor} onChange={(event) => patchNested("popupStyle", "subtitleColor", event.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Description Color</label>
              <div className="flex gap-1">
                <input type="color" className="h-6 w-6 rounded border border-slate-200 p-0.5 cursor-pointer" value={form.popupStyle.descriptionColor} onChange={(event) => patchNested("popupStyle", "descriptionColor", event.target.value)} />
                <input className={cn(compactInput, "flex-1")} value={form.popupStyle.descriptionColor} onChange={(event) => patchNested("popupStyle", "descriptionColor", event.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Timer Color</label>
              <div className="flex gap-1">
                <input type="color" className="h-6 w-6 rounded border border-slate-200 p-0.5 cursor-pointer" value={form.popupStyle.timerColor} onChange={(event) => patchNested("popupStyle", "timerColor", event.target.value)} />
                <input className={cn(compactInput, "flex-1")} value={form.popupStyle.timerColor} onChange={(event) => patchNested("popupStyle", "timerColor", event.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Button Color</label>
              <div className="flex gap-1">
                <input type="color" className="h-6 w-6 rounded border border-slate-200 p-0.5 cursor-pointer" value={form.popupStyle.buttonColor} onChange={(event) => patchNested("popupStyle", "buttonColor", event.target.value)} />
                <input className={cn(compactInput, "flex-1")} value={form.popupStyle.buttonColor} onChange={(event) => patchNested("popupStyle", "buttonColor", event.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Button Text Color</label>
              <div className="flex gap-1">
                <input type="color" className="h-6 w-6 rounded border border-slate-200 p-0.5 cursor-pointer" value={form.popupStyle.buttonTextColor} onChange={(event) => patchNested("popupStyle", "buttonTextColor", event.target.value)} />
                <input className={cn(compactInput, "flex-1")} value={form.popupStyle.buttonTextColor} onChange={(event) => patchNested("popupStyle", "buttonTextColor", event.target.value)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}