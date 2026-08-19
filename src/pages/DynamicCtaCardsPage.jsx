import { useEffect, useMemo, useState } from "react";
import { Tag, Image, Eye, Edit3, Save, RefreshCw, Smartphone, LayoutDashboard, Calendar, FileText, User, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { dynamicCtaCardService } from "../api/dynamicCtaCardService";
import { Field } from "../components/forms/Field";
import { ToggleSwitch } from "../components/forms/ToggleSwitch";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";

const screens = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, hint: "Appears on the app Dashboard." },
  { key: "daily-test", label: "Daily Test", icon: Calendar, hint: "Appears on the Daily Test screen." },
  { key: "daily-test-result", label: "Result Page", icon: FileText, hint: "Appears on the Daily Test Result screen." },
  { key: "profile", label: "Profile", icon: User, hint: "Appears on the Profile screen." },
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

  // Compact input classes
  const compactInput = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
  const compactTextarea = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y min-h-[50px]";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200/60 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25">
              <Tag size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">App CTA Cards</h1>
              <p className="text-xs text-slate-500">Manage free user CTA cards across the app</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-medium text-indigo-700">
              {Object.keys(cards).length} cards
            </span>
            <button type="button" className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[9px] font-medium text-slate-700 rounded transition-colors" onClick={loadCards} disabled={loading}>
              <RefreshCw size={10} className={loading ? "animate-spin" : ""} /> {loading ? "..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Screen Tabs */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
          {screens.map((screen) => {
            const Icon = screen.icon;
            const isActive = activeScreen === screen.key;
            const isEnabled = cards[screen.key]?.enabled !== false;
            return (
              <button
                key={screen.key}
                type="button"
                onClick={() => setActiveScreen(screen.key)}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all text-center",
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/25"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Icon size={12} />
                  <span className="text-[9px] font-medium">{screen.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  {isEnabled ? (
                    <CheckCircle size={8} className={isActive ? "text-white/70" : "text-emerald-500"} />
                  ) : (
                    <XCircle size={8} className={isActive ? "text-white/70" : "text-slate-400"} />
                  )}
                  <span className="text-[6px] font-medium uppercase tracking-wider opacity-70">
                    {isEnabled ? "Active" : "Inactive"}
                  </span>
                </div>
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white rounded-full" />
                )}
              </button>
            );
          })}
        </div>
        <p className="text-[8px] text-slate-400 text-center mt-1.5">{activeMeta.hint}</p>
      </div>

      {/* Form Section */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Edit3 size={14} className="text-indigo-600" />
          <h2 className="text-xs font-semibold text-slate-900">{activeMeta.label} Card</h2>
          <span className="text-[8px] text-slate-400">Independent per screen</span>
        </div>
        <form onSubmit={save} className="space-y-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Enable Card</label>
              <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg border border-slate-200/50 px-3 py-0.5">
                <ToggleSwitch checked={form.enabled !== false} onChange={(value) => patch({ enabled: value })} label="" size="sm" />
                <span className="text-[8px] font-medium text-slate-700">{form.enabled !== false ? "Enabled" : "Disabled"}</span>
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Eyebrow</label>
              <input className={compactInput} value={form.eyebrow} onChange={(event) => patch({ eyebrow: event.target.value })} placeholder="NEET & JEE Unlock" />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Card Title</label>
              <input className={compactInput} value={form.title} onChange={(event) => patch({ title: event.target.value })} placeholder="Go Premium" />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">CTA Button Text</label>
              <input className={compactInput} value={form.ctaText} onChange={(event) => patch({ ctaText: event.target.value })} placeholder="View Plans" />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">CTA Action / Link</label>
              <input className={compactInput} value={form.ctaLink} onChange={(event) => patch({ ctaLink: event.target.value })} placeholder="/subscription" />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Image / Icon URL</label>
              <input className={compactInput} value={form.imageUrl} onChange={(event) => patch({ imageUrl: event.target.value })} placeholder="/uploads/cta.png" />
            </div>
            <div className="flex flex-col gap-0.5 sm:col-span-2">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Description</label>
              <textarea className={compactTextarea} rows={2} value={form.description} onChange={(event) => patch({ description: event.target.value })} placeholder="Unlock unlimited questions, weak area analysis, and smart revision." />
            </div>
          </div>
          <button className={cn(
            "inline-flex items-center gap-1 px-3 py-0.5 text-[9px] font-medium rounded-lg transition-all",
            "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm shadow-indigo-500/25",
            saving && "opacity-50 cursor-not-allowed"
          )} disabled={saving} type="submit">
            <Save size={10} /> {saving ? "Saving..." : "Save Card"}
          </button>
        </form>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Eye size={14} className="text-indigo-600" />
          <h2 className="text-xs font-semibold text-slate-900">Preview</h2>
          <span className="text-[8px] text-slate-400">Current card style</span>
        </div>
        <div className="max-w-md mx-auto">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-800 p-4 shadow-xl">
            <div className="flex items-start gap-3">
              {/* Left Content */}
              <div className="flex-1 min-w-0">
                <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-blue-300">
                  {form.eyebrow || defaults.eyebrow}
                </p>
                <h2 className="mt-1.5 text-base font-bold text-white">
                  {form.title || defaults.title}
                </h2>
                <p className="mt-1 text-[9px] leading-relaxed text-blue-100 line-clamp-2">
                  {form.description || defaults.description}
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[9px] font-bold text-indigo-900 shadow-lg">
                  {form.ctaText || defaults.ctaText}
                  <ArrowRight size={10} />
                </div>
              </div>

              {/* Right Image/Icon */}
              <div className="flex-shrink-0">
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover border-2 border-white/20 shadow-lg" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                    <Tag className="h-6 w-6 text-yellow-300" />
                  </div>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className="absolute top-3 right-3">
              <span className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[6px] font-bold uppercase tracking-wider",
                form.enabled !== false ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/20" : "bg-slate-500/20 text-slate-400 border border-slate-500/20"
              )}>
                {form.enabled !== false ? <CheckCircle size={8} /> : <XCircle size={8} />}
                {form.enabled !== false ? "Active" : "Disabled"}
              </span>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-20 h-20 bg-indigo-500/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-purple-500/20 rounded-full blur-2xl" />
          </div>
        </div>
        <p className="text-[7px] text-slate-400 text-center mt-1.5">
          {activeMeta.label} preview • Card {form.enabled !== false ? "visible" : "hidden"} to free users
        </p>
      </div>
    </div>
  );
}