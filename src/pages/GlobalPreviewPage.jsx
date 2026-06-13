import { useEffect, useState } from "react";
import { explanationPreviewTemplateService } from "../api/explanationPreviewTemplateService";
import { subscriptionPageTemplateService } from "../api/subscriptionPageTemplateService";
import { subscriptionPlanService } from "../api/subscriptionPlanService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ExplanationPreview, MobilePreview, SubscriptionTemplatePreview } from "../components/preview/MobilePreview";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";

export function GlobalPreviewPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("mobile");
  const [view, setView] = useState("subscription");
  const [templates, setTemplates] = useState({ subscription: null, explanation: null, plans: [] });

  useEffect(() => {
    async function load() {
      try {
        const [subTemplates, explanationTemplates, plans] = await Promise.all([
          subscriptionPageTemplateService.list({ limit: 100, status: "published" }),
          explanationPreviewTemplateService.list({ limit: 20, status: "published" }),
          subscriptionPlanService.list({ limit: 100 }),
        ]);
        setTemplates({
          subscription: subTemplates.data?.[0] || null,
          explanation: explanationTemplates.data?.[0] || null,
          plans: plans.data || [],
        });
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner label="Loading previews..." />;

  return (
    <section className={ui.panel}>
      <div className={ui.sectionHead}>
        <div>
          <div className={ui.eyebrow}>Global Preview</div>
          <h2 className="text-xl font-black text-slate-950">What Admin Sees Matches The App</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {["subscription", "explanation", "carousel", "subjects", "chapters", "test"].map((item) => (
            <button key={item} type="button" className={cn(ui.buttonBase, view === item ? ui.buttonPrimary : ui.buttonSecondary)} onClick={() => setView(item)}>
              {item}
            </button>
          ))}
          <select className={ui.input} value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="mobile">Mobile</option>
            <option value="tablet">Tablet</option>
            <option value="desktop">Desktop</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <MobilePreview mode={mode}>
          {view === "subscription" ? <SubscriptionTemplatePreview template={templates.subscription} plans={templates.plans} /> : null}
          {view === "explanation" ? <ExplanationPreview template={templates.explanation} /> : null}
          {view === "carousel" ? <div className="space-y-3 bg-slate-50 p-4"><div className="rounded-xl bg-slate-900 p-6 text-white"><h3 className="text-xl font-black">Carousel Banner</h3><p className="mt-2 text-sm text-slate-200">Enabled banners appear here in app order.</p></div></div> : null}
          {view === "subjects" ? <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4"><div className="rounded-xl border bg-white p-4 font-bold">Biology</div><div className="rounded-xl border bg-white p-4 font-bold">Physics</div></div> : null}
          {view === "chapters" ? <div className="space-y-3 bg-slate-50 p-4"><div className="rounded-xl border bg-white p-4 font-bold">Chapter Card Preview</div></div> : null}
          {view === "test" ? <div className="space-y-3 bg-slate-50 p-4"><div className="rounded-xl border bg-white p-4"><h3 className="font-black">Test Screen Preview</h3><p className="mt-2 text-sm text-slate-600">Question, options, and explanation preview surface.</p></div></div> : null}
        </MobilePreview>
      </div>
    </section>
  );
}
