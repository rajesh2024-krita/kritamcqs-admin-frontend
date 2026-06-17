import { useEffect, useState } from "react";
import { Image, RefreshCw, Save, Upload } from "lucide-react";
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
    backgroundColor: "#f97316",
    textColor: "#ffffff",
    borderColor: "#ffffff",
    borderWidth: 1,
    shadow: "strong",
    icon: "",
    showClose: true,
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
  { label: "Rounded", value: "rounded" },
  { label: "Square", value: "square" },
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

export function OfferTimerManagementPage() {
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

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

  const preview = assetUrl(form.image);

  return (
    <div className="space-y-5">
      <div className={ui.sectionHead}>
        <div>
          <p className={ui.eyebrow}>Mobile App</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">Offer Timer Management</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Configure the floating in-app countdown timer and target the right audience segment.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={loadOffer} disabled={status === "loading"}>
            <RefreshCw size={16} />
            Reload
          </button>
          <button type="button" className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={saveOffer} disabled={status === "saving"}>
            <Save size={16} />
            {status === "saving" ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {message ? (
        <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${status === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {message}
        </div>
      ) : null}

      <section className={ui.panel}>
        <div className="grid gap-5 lg:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
            <input type="checkbox" className={ui.checkbox} checked={form.enabled} onChange={(event) => patch("enabled", event.target.checked)} />
            Enable Offer Timer
          </label>

          <label className={ui.field}>
            Audience Selection
            <select className={ui.input} value={form.audience} onChange={(event) => patch("audience", event.target.value)}>
              {audienceOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <Field label="Offer Title" value={form.title} onChange={(value) => patch("title", value)} />
          <Field label="Offer Subtitle" value={form.subtitle} onChange={(value) => patch("subtitle", value)} />

          <label className={cn(ui.field, "lg:col-span-2")}>
            Offer Description
            <textarea className={ui.textarea} rows={4} value={form.description} onChange={(event) => patch("description", event.target.value)} />
          </label>

          <Field label="CTA Button Text" value={form.ctaText} onChange={(value) => patch("ctaText", value)} />
          <Field label="CTA Button Link / Action" value={form.ctaLink} onChange={(value) => patch("ctaLink", value)} placeholder="/subscription" />

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-800">Offer Image</p>
                <p className="mt-1 text-xs text-slate-500">Upload or paste an image URL/path.</p>
              </div>
              <label className={cn(ui.buttonBase, ui.buttonSecondary, "cursor-pointer")}>
                <Upload size={16} />
                {uploading ? "Uploading..." : "Upload"}
                <input type="file" accept="image/*" className="hidden" onChange={uploadImage} disabled={uploading} />
              </label>
            </div>
            <input className={cn(ui.input, "mt-4")} value={form.image} onChange={(event) => patch("image", event.target.value)} placeholder="/uploads/offer-timer/image.webp" />
            {preview ? (
              <img src={preview} alt="Offer preview" className="mt-4 h-52 w-full rounded-lg border border-slate-200 bg-white object-contain" />
            ) : (
              <div className="mt-4 flex h-52 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-slate-400">
                <Image size={28} />
              </div>
            )}
          </div>

          <Field label="Start Date & Time" type="datetime-local" value={form.startAt} onChange={(value) => patch("startAt", value)} />
          <Field label="End Date & Time" type="datetime-local" value={form.endAt} onChange={(value) => patch("endAt", value)} />
        </div>
      </section>

      <section className={ui.panel}>
        <h2 className="mb-5 text-xl font-black tracking-tight text-slate-950">Floating Widget UI</h2>
        <div className="grid gap-5 lg:grid-cols-2">
          <SelectField label="Shape" value={form.widgetStyle.shape} options={shapeOptions} onChange={(value) => patchNested("widgetStyle", "shape", value)} />
          <Field label="Size (px)" type="number" value={form.widgetStyle.size} onChange={(value) => patchNested("widgetStyle", "size", value)} />
          <Field label="Background Color" type="color" value={form.widgetStyle.backgroundColor} onChange={(value) => patchNested("widgetStyle", "backgroundColor", value)} />
          <Field label="Countdown Text Color" type="color" value={form.widgetStyle.textColor} onChange={(value) => patchNested("widgetStyle", "textColor", value)} />
          <Field label="Border Color" type="color" value={form.widgetStyle.borderColor} onChange={(value) => patchNested("widgetStyle", "borderColor", value)} />
          <Field label="Border Width (px)" type="number" value={form.widgetStyle.borderWidth} onChange={(value) => patchNested("widgetStyle", "borderWidth", value)} />
          <SelectField label="Shadow" value={form.widgetStyle.shadow} options={shadowOptions} onChange={(value) => patchNested("widgetStyle", "shadow", value)} />
          <Field label="Icon / Short Text" value={form.widgetStyle.icon} onChange={(value) => patchNested("widgetStyle", "icon", value)} placeholder="%" />
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
            <input type="checkbox" className={ui.checkbox} checked={Boolean(form.widgetStyle.showClose)} onChange={(event) => patchNested("widgetStyle", "showClose", event.target.checked)} />
            Show Close Button
          </label>
          <SelectField label="Default Position" value={form.widgetStyle.defaultPosition} options={positionOptions} onChange={(value) => patchNested("widgetStyle", "defaultPosition", value)} />
          <Field label="Horizontal Offset (px)" type="number" value={form.widgetStyle.offsetX} onChange={(value) => patchNested("widgetStyle", "offsetX", value)} />
          <Field label="Vertical Offset (px)" type="number" value={form.widgetStyle.offsetY} onChange={(value) => patchNested("widgetStyle", "offsetY", value)} />
        </div>
      </section>

      <section className={ui.panel}>
        <h2 className="mb-5 text-xl font-black tracking-tight text-slate-950">Offer Popup UI</h2>
        <div className="grid gap-5 lg:grid-cols-2">
          <SelectField label="Popup Layout" value={form.popupStyle.layout} options={layoutOptions} onChange={(value) => patchNested("popupStyle", "layout", value)} />
          <Field label="Border Radius (px)" type="number" value={form.popupStyle.borderRadius} onChange={(value) => patchNested("popupStyle", "borderRadius", value)} />
          <Field label="Background Color" type="color" value={form.popupStyle.backgroundColor} onChange={(value) => patchNested("popupStyle", "backgroundColor", value)} />
          <Field label="Title Color" type="color" value={form.popupStyle.titleColor} onChange={(value) => patchNested("popupStyle", "titleColor", value)} />
          <Field label="Subtitle Color" type="color" value={form.popupStyle.subtitleColor} onChange={(value) => patchNested("popupStyle", "subtitleColor", value)} />
          <Field label="Description Color" type="color" value={form.popupStyle.descriptionColor} onChange={(value) => patchNested("popupStyle", "descriptionColor", value)} />
          <Field label="Countdown Color" type="color" value={form.popupStyle.timerColor} onChange={(value) => patchNested("popupStyle", "timerColor", value)} />
          <Field label="Button Color" type="color" value={form.popupStyle.buttonColor} onChange={(value) => patchNested("popupStyle", "buttonColor", value)} />
          <Field label="Button Text Color" type="color" value={form.popupStyle.buttonTextColor} onChange={(value) => patchNested("popupStyle", "buttonTextColor", value)} />
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <label className={ui.field}>
      {label}
      <input type={type} className={ui.input} value={value ?? ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className={ui.field}>
      {label}
      <select className={ui.input} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
