import { useEffect, useMemo, useState } from "react";
import { Tag } from "lucide-react";
import { dynamicCtaCardService } from "../api/dynamicCtaCardService";
import { Field } from "../components/forms/Field";
import { ToggleSwitch } from "../components/forms/ToggleSwitch";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";

const screens = [
  { key: "dashboard", label: "Dashboard Card", hint: "Appears on the app Dashboard." },
  { key: "daily-test", label: "Daily Test Card", hint: "Appears on the Daily Test screen." },
  { key: "daily-test-result", label: "Result Page Card", hint: "Appears on the Daily Test Result screen." },
  { key: "profile", label: "Profile Card", hint: "Appears on the Profile screen." },
];

const defaults = {
  enabled: true,
  eyebrow: "NEET & JEE Unlock",
  title: "Go Premium",
  description: "Unlock unlimited questions, weak area analysis, and smart revision.",
  imageUrl: "",
  ctaText: "View Plans",
  ctaLink: "/subscription",
};

export function DynamicCtaCardsPage() {
  const toast = useToast();
  const [cards, setCards] = useState({});
  const [activeScreen, setActiveScreen] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const activeMeta = screens.find((item) => item.key === activeScreen) || screens[0];
  const form = useMemo(() => ({ ...defaults, ...(cards[activeScreen] || {}) }), [activeScreen, cards]);

  async function loadCards() {
    setLoading(true);
    try {
      const response = await dynamicCtaCardService.getAll();
      setCards(response?.data || {});
    } catch (error) {
      toast.error(error.message || "Unable to load CTA cards.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCards();
  }, []);

  function patch(value) {
    setCards((current) => ({
      ...current,
      [activeScreen]: { ...defaults, ...(current[activeScreen] || {}), ...value },
    }));
  }

  async function save(event) {
    event.preventDefault();
    if (!form.title.trim()) return toast.error("Card title is required.");
    if (!form.ctaText.trim()) return toast.error("CTA button text is required.");
    if (!form.ctaLink.trim()) return toast.error("CTA action/link is required.");
    setSaving(true);
    try {
      const response = await dynamicCtaCardService.update(activeScreen, form);
      setCards((current) => ({ ...current, [activeScreen]: response?.data || form }));
      toast.success(`${activeMeta.label} saved.`);
    } catch (error) {
      toast.error(error.message || "Unable to save CTA card.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <div className={ui.eyebrow}>App CTA Cards</div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Free User CTA Cards</h1>
            <p className={ui.muted}>Manage the reusable Dashboard-style CTA card shown to free users in the app.</p>
          </div>
          {loading ? <span className="text-sm font-semibold text-slate-500">Loading...</span> : null}
        </div>
      </section>

      <section className={ui.panel}>
        <div className="grid gap-3 md:grid-cols-4">
          {screens.map((screen) => (
            <button
              key={screen.key}
              type="button"
              onClick={() => setActiveScreen(screen.key)}
              className={cn(
                "rounded-xl border px-4 py-3 text-left transition",
                activeScreen === screen.key ? "border-sky-300 bg-sky-50 text-sky-900" : "border-slate-200 bg-white text-slate-700 hover:border-sky-200",
              )}
            >
              <div className="text-sm font-black">{screen.label}</div>
              <div className="mt-1 text-xs text-slate-500">{screen.hint}</div>
            </button>
          ))}
        </div>
      </section>

      <section className={ui.panel}>
        <form onSubmit={save} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <div className={ui.eyebrow}>{activeMeta.label}</div>
            <h2 className="text-xl font-black text-slate-900">Card Content</h2>
            <p className="mt-1 text-sm text-slate-500">This configuration is independent and will not change the other screen cards.</p>
          </div>

          <Field label="Enable Card">
            <ToggleSwitch checked={form.enabled !== false} onChange={(value) => patch({ enabled: value })} label={form.enabled !== false ? "Enabled" : "Disabled"} />
          </Field>
          <Field label="Eyebrow">
            <input className={ui.input} value={form.eyebrow} onChange={(event) => patch({ eyebrow: event.target.value })} placeholder="NEET & JEE Unlock" />
          </Field>
          <Field label="Card Title">
            <input className={ui.input} value={form.title} onChange={(event) => patch({ title: event.target.value })} placeholder="Go Premium" />
          </Field>
          <Field label="CTA Button Text">
            <input className={ui.input} value={form.ctaText} onChange={(event) => patch({ ctaText: event.target.value })} placeholder="View Plans" />
          </Field>
          <Field label="CTA Action / Link">
            <input className={ui.input} value={form.ctaLink} onChange={(event) => patch({ ctaLink: event.target.value })} placeholder="/subscription" />
          </Field>
          <Field label="Image / Icon URL">
            <input className={ui.input} value={form.imageUrl} onChange={(event) => patch({ imageUrl: event.target.value })} placeholder="/uploads/cta.png" />
          </Field>
          <Field label="Description" className="lg:col-span-2">
            <textarea className={ui.textarea} value={form.description} onChange={(event) => patch({ description: event.target.value })} placeholder="Unlock unlimited questions, weak area analysis, and smart revision." />
          </Field>

          <div className="lg:col-span-2">
            <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={saving}>{saving ? "Saving..." : "Save Card"}</button>
          </div>
        </form>
      </section>

      <section className={ui.panel}>
        <div className="mb-4">
          <div className={ui.eyebrow}>Preview</div>
          <h2 className="text-xl font-black text-slate-900">Current Card Style</h2>
        </div>
        <div className="max-w-xl overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-blue-700 p-5 text-white shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">{form.eyebrow || defaults.eyebrow}</p>
              <h2 className="mt-2 text-2xl font-black">{form.title || defaults.title}</h2>
              <p className="mt-2 text-sm leading-6 text-blue-100">{form.description || defaults.description}</p>
              <div className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-xs font-black text-blue-950">{form.ctaText || defaults.ctaText}</div>
            </div>
            {form.imageUrl ? <img src={form.imageUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : <div className="rounded-2xl bg-white/15 p-3"><Tag className="h-6 w-6 text-yellow-300" /></div>}
          </div>
        </div>
      </section>
    </div>
  );
}
