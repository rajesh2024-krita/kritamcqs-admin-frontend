import { CheckCircle2 } from "lucide-react";

const widthByMode = {
  mobile: "max-w-[390px]",
  tablet: "max-w-[720px]",
  desktop: "max-w-[960px]",
};

export function MobilePreview({ mode = "mobile", children }) {
  return (
    <div className={`mx-auto w-full ${widthByMode[mode] || widthByMode.mobile}`}>
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 shadow-lg">
        <div className="flex items-center justify-center border-b border-slate-200 bg-slate-900 px-4 py-2">
          <div className="h-1.5 w-20 rounded-full bg-slate-600" />
        </div>
        <div className="min-h-[520px] bg-white">{children}</div>
      </div>
    </div>
  );
}

export function SubscriptionTemplatePreview({ template, plans = [] }) {
  const blocks = Array.isArray(template?.blocks) && template.blocks.length
    ? [...template.blocks].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
    : [
        { type: "title", props: { text: "Krita NEET JEE" } },
        { type: "description", props: { text: "Unlock premium practice with the current default subscription template." } },
        { type: "planCards", props: {} },
      ];

  return (
    <div className="space-y-4 bg-slate-50 p-4">
      {blocks.map((block, index) => {
        const props = block.props || {};
        if (block.type === "banner") {
          return (
            <div key={block.id || index} className="overflow-hidden rounded-xl bg-slate-900 text-white">
              {props.imageUrl ? <img src={props.imageUrl} alt="" className="h-36 w-full object-cover" /> : null}
              <div className="p-4">
                <div className="text-xl font-black">{props.title || "Premium Learning"}</div>
                <p className="mt-1 text-sm text-slate-200">{props.subtitle || ""}</p>
              </div>
            </div>
          );
        }
        if (block.type === "title") return <h2 key={block.id || index} className="text-2xl font-black text-slate-950">{props.text || "Subscription"}</h2>;
        if (block.type === "description") return <p key={block.id || index} className="text-sm leading-6 text-slate-600">{props.text || "Choose your plan."}</p>;
        if (block.type === "featureList") {
          const items = String(props.items || "").split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
          return (
            <div key={block.id || index} className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
              {(items.length ? items : ["Unlimited practice", "Smart revision", "Weak area tracking"]).map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm font-semibold text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          );
        }
        if (block.type === "faq") return <div key={block.id || index} className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700">{props.question || "FAQ"}<p className="mt-1 font-normal text-slate-500">{props.answer || "Answer preview"}</p></div>;
        if (block.type === "testimonial") return <blockquote key={block.id || index} className="rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">{props.text || "Great learning experience."}</blockquote>;
        if (block.type === "cta") return <button key={block.id || index} className="w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-black text-white">{props.label || "Unlock Premium"}</button>;
        if (block.type === "image") return props.imageUrl ? <img key={block.id || index} src={props.imageUrl} alt="" className="w-full rounded-xl object-cover" /> : null;
        if (block.type === "video") return <div key={block.id || index} className="rounded-xl border border-slate-200 bg-slate-900 p-6 text-center text-sm font-bold text-white">Video: {props.url || "preview URL"}</div>;
        return (
          <div key={block.id || index} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-black text-slate-900">{block.type}</div>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-500">{JSON.stringify(props, null, 2)}</pre>
          </div>
        );
      })}
      <div className="space-y-3">
        {(plans.length ? plans : [{ name: "1 Month", price: 99, durationMonths: 1, features: ["Premium access"] }]).map((plan) => (
          <div key={plan.id || plan.planId || plan.name} className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
            <div className="text-lg font-black text-slate-950">{plan.name}</div>
            <div className="mt-2 text-3xl font-black text-slate-950">Rs. {plan.price}</div>
            <p className="mt-1 text-sm font-semibold text-emerald-700">{plan.durationMonths || plan.duration} month plan</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExplanationPreview({ sample = {}, template }) {
  const explanationText = sample.explanation || "The explanation shown here uses the same preview surface that the app can render.";
  const steps = String(explanationText)
    .split(/(?=Step\s+\d+\s*:)/i)
    .map((step) => step.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4 bg-slate-50 p-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Explanation</div>
        <h3 className="mt-2 text-lg font-black text-slate-950">{sample.question || "Sample question preview"}</h3>
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-black">Correct answer: {sample.answer || "A"}</p>
          <div className="mt-2 space-y-1 leading-6">
            {(steps.length ? steps : [explanationText]).map((step, index) => (
              <p key={`${step}-${index}`}>{step}</p>
            ))}
          </div>
        </div>
      </div>
      {template?.layout && Object.keys(template.layout).length ? (
        <pre className="rounded-xl bg-slate-900 p-4 text-xs text-slate-100">{JSON.stringify(template.layout, null, 2)}</pre>
      ) : null}
    </div>
  );
}
