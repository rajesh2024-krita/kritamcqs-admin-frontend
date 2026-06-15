import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, RefreshCw, Save, Trash2 } from "lucide-react";
import { dashboardCarouselService } from "../api/dashboardCarouselService";
import { uploadService } from "../api/uploadService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";

function resolveImageSource(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
  if (!raw.startsWith("/")) return raw;
  if (raw.startsWith("/uploads/")) {
    const appBase = String(import.meta.env.VITE_APP_FRONTEND_BASE_URL || "").replace(/\/+$/, "");
    if (appBase) return `${appBase}${raw}`;
  }
  const base = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "").replace(/\/api$/, "");
  return base ? `${base}${raw}` : raw;
}

export function DashboardCarouselPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const orderedItems = useMemo(
    () => [...items].sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0) || String(a.createdAt || "").localeCompare(String(b.createdAt || ""))),
    [items],
  );

  async function loadItems() {
    setLoading(true);
    try {
      const response = await dashboardCarouselService.list({ limit: 200 });
      setItems(response.data || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  async function handleUpload() {
    if (!selectedFiles.length) {
      toast.error("Select one or more banner images");
      return;
    }
    setUploading(true);
    try {
      const response = await uploadService.appImages(selectedFiles, "dashboard-carousel");
      const uploaded = response.data?.items || response.items || [];
      const startOrder = orderedItems.length;
      for (const [index, file] of uploaded.entries()) {
        await dashboardCarouselService.create({
          title: file.originalName?.replace(/\.[^.]+$/, "") || `Banner ${startOrder + index + 1}`,
          subtitle: "",
          imageUrl: file.url,
          redirectLink: "",
          displayOrder: (startOrder + index + 1) * 10,
          enabled: true,
        });
      }
      setSelectedFiles([]);
      toast.success(`${uploaded.length} banner image(s) uploaded`);
      await loadItems();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  }

  function updateLocal(id, patch) {
    setItems((current) => current.map((item) => (String(item.id) === String(id) ? { ...item, ...patch } : item)));
  }

  async function saveItem(item) {
    try {
      await dashboardCarouselService.update(item.id, item);
      toast.success("Banner saved");
      await loadItems();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function deleteItem(item) {
    try {
      await dashboardCarouselService.remove(item.id);
      toast.success("Banner deleted");
      await loadItems();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function saveOrder(nextItems = orderedItems) {
    setSavingOrder(true);
    try {
      await Promise.all(nextItems.map((item, index) => dashboardCarouselService.update(item.id, { ...item, displayOrder: (index + 1) * 10 })));
      toast.success("Banner order saved");
      await loadItems();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingOrder(false);
    }
  }

  function moveItem(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= orderedItems.length) return;
    const next = [...orderedItems];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next.map((item, itemIndex) => ({ ...item, displayOrder: (itemIndex + 1) * 10 })));
  }

  if (loading) return <LoadingSpinner label="Loading carousel banners..." />;

  return (
    <div className="flex flex-col gap-6">
      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <div className={ui.eyebrow}>Dashboard Carousel</div>
            <h2 className="text-xl font-black text-slate-950">Upload And Arrange Banners</h2>
            <p className={ui.muted}>Select multiple images from your device, then move them into 1st, 2nd, 3rd display order.</p>
          </div>
          <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={loadItems}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
          <input
            className={ui.input}
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
          />
          <button type="button" className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={uploading} onClick={handleUpload}>
            <ImagePlus size={16} /> {uploading ? "Uploading..." : `Upload ${selectedFiles.length || ""} Image${selectedFiles.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </section>

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <h2 className="text-xl font-black text-slate-950">Banner Order</h2>
            <p className={ui.muted}>Top item appears first in the app carousel.</p>
          </div>
          <button type="button" className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={savingOrder} onClick={() => saveOrder()}>
            <Save size={16} /> {savingOrder ? "Saving..." : "Save Order"}
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {orderedItems.map((item, index) => (
            <div key={item.id} className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[180px_minmax(0,1fr)_auto]">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                {item.imageUrl ? <img src={resolveImageSource(item.imageUrl)} alt="" className="h-28 w-full object-cover" /> : <div className="flex h-28 items-center justify-center text-sm text-slate-500">No image</div>}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2 flex items-center gap-2">
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700">Position {index + 1}</span>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="checkbox" checked={item.enabled !== false} onChange={(event) => updateLocal(item.id, { enabled: event.target.checked })} />
                    Enabled
                  </label>
                </div>
                <label className={ui.field}><span>Title</span><input className={ui.input} value={item.title || ""} onChange={(event) => updateLocal(item.id, { title: event.target.value })} /></label>
                <label className={ui.field}><span>Redirect Link</span><input className={ui.input} value={item.redirectLink || ""} onChange={(event) => updateLocal(item.id, { redirectLink: event.target.value })} /></label>
                <label className={cn(ui.field, "md:col-span-2")}><span>Subtitle</span><input className={ui.input} value={item.subtitle || ""} onChange={(event) => updateLocal(item.id, { subtitle: event.target.value })} /></label>
              </div>
              <div className="flex flex-row gap-2 lg:flex-col">
                <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary, "px-3")} onClick={() => moveItem(index, -1)} title="Move up"><ArrowUp size={16} /></button>
                <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary, "px-3")} onClick={() => moveItem(index, 1)} title="Move down"><ArrowDown size={16} /></button>
                <button type="button" className={cn(ui.buttonBase, ui.buttonPrimary, "px-3")} onClick={() => saveItem(item)} title="Save"><Save size={16} /></button>
                <button type="button" className={cn(ui.buttonBase, ui.buttonDanger, "px-3")} onClick={() => deleteItem(item)} title="Delete"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          {!orderedItems.length ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
              Upload banner images to build the app dashboard carousel.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
