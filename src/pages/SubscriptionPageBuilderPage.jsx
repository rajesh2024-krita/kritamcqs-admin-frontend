import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Eye, Plus, Save, Trash2 } from "lucide-react";
import { subscriptionPageTemplateService } from "../api/subscriptionPageTemplateService";
import { subscriptionPlanService } from "../api/subscriptionPlanService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { MobilePreview, SubscriptionTemplatePreview } from "../components/preview/MobilePreview";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";

const componentTypes = ["banner", "title", "description", "planCards", "featureList", "testimonial", "faq", "cta", "image", "video"];

function emptyBlock(type) {
  return { id: `${type}-${Date.now()}`, type, sortOrder: Date.now(), props: {} };
}

export function SubscriptionPageBuilderPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [plans, setPlans] = useState([]);
  const [mode, setMode] = useState("mobile");
  const [template, setTemplate] = useState({
    name: "Default Template",
    slug: "default-template",
    description: "",
    status: "draft",
    isDefault: true,
    blocks: [],
  });

  async function loadData() {
    setLoading(true);
    try {
      const [templateResponse, planResponse] = await Promise.all([
        subscriptionPageTemplateService.list({ limit: 100, sort: "updatedAt", order: "desc" }),
        subscriptionPlanService.list({ limit: 100, active: "" }),
      ]);
      const loadedTemplates = templateResponse.data || [];
      setTemplates(loadedTemplates);
      setPlans(planResponse.data || []);
      if (loadedTemplates[0]) setTemplate(loadedTemplates[0]);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const orderedBlocks = useMemo(() => [...(template.blocks || [])].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)), [template.blocks]);

  function updateBlock(index, patch) {
    setTemplate((current) => ({
      ...current,
      blocks: orderedBlocks.map((block, blockIndex) => (blockIndex === index ? { ...block, ...patch } : block)),
    }));
  }

  function updateBlockProp(index, key, value) {
    const block = orderedBlocks[index];
    updateBlock(index, { props: { ...(block.props || {}), [key]: value } });
  }

  function moveBlock(index, delta) {
    const next = [...orderedBlocks];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setTemplate((current) => ({ ...current, blocks: next.map((block, sortOrder) => ({ ...block, sortOrder })) }));
  }

  async function saveTemplate(status = template.status) {
    if (!template.name.trim() || !template.slug.trim()) {
      toast.error("Template name and slug are required");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...template, status, blocks: orderedBlocks.map((block, sortOrder) => ({ ...block, sortOrder })) };
      const response = template.id ? await subscriptionPageTemplateService.update(template.id, payload) : await subscriptionPageTemplateService.create(payload);
      setTemplate(response.data);
      toast.success(status === "published" ? "Template published" : "Template saved");
      await loadData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading page builder..." />;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_520px]">
      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <div className={ui.eyebrow}>Subscription Builder</div>
            <h2 className="text-xl font-black text-slate-950">Templates</h2>
            <p className={ui.muted}>Default app design remains available unless a published template exists.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => setTemplate({ ...template, id: undefined, name: `${template.name} Copy`, slug: `${template.slug}-copy`, status: "draft" })}>
              <Copy size={16} /> Duplicate
            </button>
            <button type="button" className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={saving} onClick={() => saveTemplate("draft")}>
              <Save size={16} /> Save
            </button>
            <button type="button" className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={saving} onClick={() => saveTemplate("published")}>
              <Eye size={16} /> Publish
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className={ui.field}><span>Name</span><input className={ui.input} value={template.name} onChange={(e) => setTemplate((c) => ({ ...c, name: e.target.value }))} /></label>
          <label className={ui.field}><span>Slug</span><input className={ui.input} value={template.slug} onChange={(e) => setTemplate((c) => ({ ...c, slug: e.target.value }))} /></label>
          <label className={cn(ui.field, "md:col-span-2")}><span>Description</span><textarea className={ui.textarea} value={template.description || ""} onChange={(e) => setTemplate((c) => ({ ...c, description: e.target.value }))} /></label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {componentTypes.map((type) => (
            <button key={type} type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => setTemplate((c) => ({ ...c, blocks: [...(c.blocks || []), emptyBlock(type)] }))}>
              <Plus size={16} /> {type}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {orderedBlocks.map((block, index) => (
            <div key={block.id || index} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <strong className="text-sm uppercase tracking-wide text-slate-800">{block.type}</strong>
                <div className="flex gap-2">
                  <button type="button" className={cn(ui.buttonBase, ui.buttonGhost, "h-9 min-h-9 px-3")} onClick={() => moveBlock(index, -1)}><ArrowUp size={15} /></button>
                  <button type="button" className={cn(ui.buttonBase, ui.buttonGhost, "h-9 min-h-9 px-3")} onClick={() => moveBlock(index, 1)}><ArrowDown size={15} /></button>
                  <button type="button" className={cn(ui.buttonBase, ui.buttonDanger, "h-9 min-h-9 px-3")} onClick={() => setTemplate((c) => ({ ...c, blocks: orderedBlocks.filter((_, i) => i !== index) }))}><Trash2 size={15} /></button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {["title", "subtitle", "text", "label", "imageUrl", "url", "question", "answer", "items"].map((key) => (
                  <label key={key} className={key === "items" || key === "text" ? cn(ui.field, "md:col-span-2") : ui.field}>
                    <span>{key}</span>
                    {key === "items" || key === "text" ? (
                      <textarea className={ui.textarea} value={block.props?.[key] || ""} onChange={(e) => updateBlockProp(index, key, e.target.value)} />
                    ) : (
                      <input className={ui.input} value={block.props?.[key] || ""} onChange={(e) => updateBlockProp(index, key, e.target.value)} />
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <div className={ui.eyebrow}>Live Preview</div>
            <h2 className="text-xl font-black text-slate-950">Responsive Preview</h2>
          </div>
          <select className={ui.input} value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="mobile">Mobile</option>
            <option value="tablet">Tablet</option>
            <option value="desktop">Desktop</option>
          </select>
        </div>
        <div className="mt-5">
          <MobilePreview mode={mode}>
            <SubscriptionTemplatePreview template={{ ...template, blocks: orderedBlocks }} plans={plans} />
          </MobilePreview>
        </div>
      </section>
    </div>
  );
}
