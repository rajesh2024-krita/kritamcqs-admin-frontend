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
  startAt: "",
  endAt: "",
  audience: "all",
};

const audienceOptions = [
  { label: "All Users", value: "all" },
  { label: "Premium Users", value: "premium" },
  { label: "Non-Premium Users", value: "nonPremium" },
  { label: "New Registered Users", value: "newRegistered" },
  { label: "New Registered Non-Premium Users", value: "newRegisteredNonPremium" },
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

  async function loadOffer() {
    setStatus("loading");
    setMessage("");
    try {
      const response = await offerTimerService.get();
      const data = response.data || {};
      setForm({
        enabled: Boolean(data.enabled),
        title: data.title || "",
        subtitle: data.subtitle || "",
        description: data.description || "",
        image: data.image || "",
        startAt: toDateTimeInput(data.startAt),
        endAt: toDateTimeInput(data.endAt),
        audience: data.audience || "all",
      });
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
      const data = response.data || {};
      setForm({
        enabled: Boolean(data.enabled),
        title: data.title || "",
        subtitle: data.subtitle || "",
        description: data.description || "",
        image: data.image || "",
        startAt: toDateTimeInput(data.startAt),
        endAt: toDateTimeInput(data.endAt),
        audience: data.audience || "all",
      });
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
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className={ui.field}>
      {label}
      <input type={type} className={ui.input} value={value || ""} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
