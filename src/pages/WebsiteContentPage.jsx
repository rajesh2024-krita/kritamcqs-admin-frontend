import { useEffect, useMemo, useState } from "react";
import { Upload, Save, RefreshCw } from "lucide-react";
import { uploadService } from "../api/uploadService";
import { websiteContentService } from "../api/websiteContentService";
import { cn, ui } from "../ui";

const defaultContent = {
  links: {
    googlePlay: "https://play.google.com/store/apps/details?id=app.kritamcqs.androidapp",
    dashboard: "https://app.kritamcqs.com/dashboard",
    premium: "https://app.kritamcqs.com/subscription",
    contact: "#contact",
  },
  hero: {
    badge: "Silicon Mobile App of the Year 2026",
    title: "India's Smartest Rank Improvement Engine for NEET & JEE",
    tagline: "Practice. Analyze. Improve. Rank.",
    kicker: "Not just another MCQ app.",
    description:
      "Krita continuously identifies your weak areas, tracks mistakes, creates revision plans, predicts your score, and helps improve your NEET & JEE performance.",
    primaryCta: "Download on Google Play",
    secondaryCta: "View Dashboard",
    benefits: [
      "Weak Area Detection",
      "Mistake Book",
      "Smart Revision",
      "Daily Adaptive Tests",
      "Score Prediction",
      "Previous Year Questions",
      "Mock Tests",
    ],
  },
  dashboard: {
    title: "Your Personal Rank Improvement Dashboard",
    subtitle: "Monitor:",
    cta: "Open Dashboard",
    metrics: ["Accuracy %", "Average Time", "Weak Topics", "Improvement Trend", "Predicted Score", "Daily Progress"],
  },
  screens: {
    dashboard: "",
    weak: "",
    mistake: "",
    revision: "",
    daily: "",
  },
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "https://adminapi.kritamcqs.com/api" : "http://localhost:3001/api");

function assetUrl(value) {
  if (!value || !String(value).startsWith("/uploads/")) return value;
  return `${API_BASE_URL.replace(/\/api\/?$/, "")}${value}`;
}

function prettyJson(value) {
  return JSON.stringify(value, null, 2);
}

export function WebsiteContentPage() {
  const [jsonText, setJsonText] = useState(prettyJson(defaultContent));
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");

  const parsed = useMemo(() => {
    try {
      return { ok: true, value: JSON.parse(jsonText) };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }, [jsonText]);

  async function loadContent() {
    setStatus("loading");
    setMessage("");
    try {
      const response = await websiteContentService.getLanding();
      const content = response.data?.content && Object.keys(response.data.content).length ? response.data.content : defaultContent;
      setJsonText(prettyJson(content));
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Unable to load website content.");
    }
  }

  useEffect(() => {
    void loadContent();
  }, []);

  async function saveContent() {
    if (!parsed.ok) {
      setStatus("error");
      setMessage(`JSON error: ${parsed.error}`);
      return;
    }
    setStatus("saving");
    setMessage("");
    try {
      await websiteContentService.updateLanding({ content: parsed.value, status: "published" });
      setJsonText(prettyJson(parsed.value));
      setStatus("idle");
      setMessage("Website content published successfully.");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Unable to save website content.");
    }
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const response = await uploadService.appImage(file, "website-content");
      const nextUrl = response.data?.url || response.data?.path || response.url || "";
      setUploadedUrl(nextUrl);
      setMessage("Image uploaded. Paste the path into the JSON image field you want to replace.");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Unable to upload image.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-5">
      <div className={ui.sectionHead}>
        <div>
          <p className={ui.eyebrow}>Website</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">Landing Page Content</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Update text, links, badges, and image paths used by the public website. Use uploaded image paths in fields such as screens.dashboard or section imageUrl values.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={loadContent} disabled={status === "loading"}>
            <RefreshCw size={16} />
            Reload
          </button>
          <button type="button" className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={saveContent} disabled={status === "saving" || !parsed.ok}>
            <Save size={16} />
            {status === "saving" ? "Saving..." : "Publish"}
          </button>
        </div>
      </div>

      {message ? (
        <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${status === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {message}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className={ui.panel}>
          <label className={ui.field}>
            Content JSON
            <textarea
              className="min-h-[620px] w-full resize-y rounded-lg border border-slate-200 bg-slate-950 px-4 py-3 font-mono text-xs leading-6 text-slate-50 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              value={jsonText}
              onChange={(event) => setJsonText(event.target.value)}
              spellCheck={false}
            />
          </label>
          {!parsed.ok ? <p className="mt-3 text-sm font-semibold text-rose-600">JSON error: {parsed.error}</p> : null}
        </section>

        <aside className={ui.panel}>
          <h2 className="text-lg font-black text-slate-950">Images</h2>
          <p className="mt-2 text-sm text-slate-500">
            Upload replacement website images, then paste the returned path into the JSON.
          </p>
          <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-sky-300 hover:bg-sky-50">
            <Upload size={28} className="text-sky-600" />
            <span className="mt-3 text-sm font-bold text-slate-800">{uploading ? "Uploading..." : "Upload image"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={uploadImage} disabled={uploading} />
          </label>
          {uploadedUrl ? (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Uploaded path</p>
              <code className="mt-2 block break-all rounded-lg bg-white p-3 text-xs text-slate-700">{uploadedUrl}</code>
              <img src={assetUrl(uploadedUrl)} alt="Uploaded website asset" className="mt-4 max-h-44 w-full rounded-lg object-contain" />
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
