import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, RefreshCw, Save, Trash2, Image, GripVertical, Eye, EyeOff, Link, Edit3, Crop, ChevronUp, ChevronDown } from "lucide-react";
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

function imageFocusStyle(item) {
  const x = Math.min(100, Math.max(0, Number(item?.imagePositionX ?? 50)));
  const y = Math.min(100, Math.max(0, Number(item?.imagePositionY ?? 50)));
  return { objectPosition: `${x}% ${y}%` };
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
          title: "",
          subtitle: "",
          imageUrl: file.url,
          redirectLink: "",
          imagePositionX: 50,
          imagePositionY: 50,
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

  // Compact input classes
  const compactInput = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200/60 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25">
              <Image size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Dashboard Carousel</h1>
              <p className="text-xs text-slate-500">Upload and arrange banner images for the app dashboard</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-medium text-indigo-700">
              {orderedItems.length} banners
            </span>
            <button type="button" className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[9px] font-medium text-slate-700 rounded transition-colors" onClick={loadItems}>
              <RefreshCw size={10} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="flex-1 min-w-[200px] px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
          />
          <button type="button" className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-medium rounded-lg transition-all",
            "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm shadow-indigo-500/25",
            uploading && "opacity-50 cursor-not-allowed"
          )} disabled={uploading} onClick={handleUpload}>
            <ImagePlus size={12} /> {uploading ? "Uploading..." : `Upload (${selectedFiles.length})`}
          </button>
        </div>
        {selectedFiles.length > 0 && (
          <p className="text-[8px] text-slate-400 mt-1">{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected</p>
        )}
      </div>

      {/* Banner List */}
      <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm">
        <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image size={12} className="text-indigo-600" />
            <h2 className="text-xs font-semibold text-slate-900">Banner Order</h2>
            <span className="text-[8px] text-slate-400">Top item appears first</span>
          </div>
          <button type="button" className={cn(
            "inline-flex items-center gap-0.5 px-2 py-0.5 text-[8px] font-medium rounded-lg transition-all",
            "bg-emerald-600 hover:bg-emerald-700 text-white",
            savingOrder && "opacity-50 cursor-not-allowed"
          )} disabled={savingOrder} onClick={() => saveOrder()}>
            <Save size={10} /> {savingOrder ? "Saving..." : "Save Order"}
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {orderedItems.map((item, index) => (
            <div key={item.id} className="p-3 hover:bg-slate-50/50 transition-colors">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-start">
                {/* Image Preview */}
                <div className="flex-shrink-0">
                  <div className="w-full lg:w-40 h-20 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                    {item.imageUrl ? (
                      <img src={resolveImageSource(item.imageUrl)} alt="" className="w-full h-full object-cover" style={imageFocusStyle(item)} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-[8px] text-slate-400">No image</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="inline-flex px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[7px] font-medium text-indigo-700">#{index + 1}</span>
                    <label className="flex items-center gap-0.5 text-[8px] font-medium text-slate-600 cursor-pointer">
                      <input type="checkbox" className="h-3 w-3 rounded border-slate-300 text-indigo-600 focus:ring-1 focus:ring-indigo-500/20" checked={item.enabled !== false} onChange={(event) => updateLocal(item.id, { enabled: event.target.checked })} />
                      {item.enabled !== false ? <Eye size={10} className="text-emerald-500" /> : <EyeOff size={10} className="text-slate-400" />}
                    </label>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="flex-1 min-w-0 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  <div className="flex flex-col gap-0.5 sm:col-span-2">
                    <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Title</label>
                    <input className={compactInput} value={item.title || ""} onChange={(event) => updateLocal(item.id, { title: event.target.value })} placeholder="Optional title" />
                  </div>
                  <div className="flex flex-col gap-0.5 sm:col-span-2">
                    <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Subtitle</label>
                    <input className={compactInput} value={item.subtitle || ""} onChange={(event) => updateLocal(item.id, { subtitle: event.target.value })} placeholder="Optional subtitle" />
                  </div>
                  <div className="flex flex-col gap-0.5 sm:col-span-2">
                    <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Redirect Link</label>
                    <input className={compactInput} value={item.redirectLink || ""} onChange={(event) => updateLocal(item.id, { redirectLink: event.target.value })} placeholder="https://..." />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Crop Left/Right</label>
                    <div className="flex items-center gap-2">
                      <input className="flex-1 accent-indigo-600" type="range" min="0" max="100" value={Number(item.imagePositionX ?? 50)} onChange={(event) => updateLocal(item.id, { imagePositionX: Number(event.target.value) })} />
                      <span className="text-[8px] text-slate-400 w-8 text-right">{Math.round(Number(item.imagePositionX ?? 50))}%</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Crop Up/Down</label>
                    <div className="flex items-center gap-2">
                      <input className="flex-1 accent-indigo-600" type="range" min="0" max="100" value={Number(item.imagePositionY ?? 50)} onChange={(event) => updateLocal(item.id, { imagePositionY: Number(event.target.value) })} />
                      <span className="text-[8px] text-slate-400 w-8 text-right">{Math.round(Number(item.imagePositionY ?? 50))}%</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row gap-0.5 lg:flex-col lg:justify-start">
                  <button type="button" className="p-1 text-slate-500 hover:bg-slate-100 rounded transition-colors" onClick={() => moveItem(index, -1)} title="Move up" disabled={index === 0}>
                    <ChevronUp size={14} className={index === 0 ? "opacity-30" : ""} />
                  </button>
                  <button type="button" className="p-1 text-slate-500 hover:bg-slate-100 rounded transition-colors" onClick={() => moveItem(index, 1)} title="Move down" disabled={index === orderedItems.length - 1}>
                    <ChevronDown size={14} className={index === orderedItems.length - 1 ? "opacity-30" : ""} />
                  </button>
                  <button type="button" className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" onClick={() => saveItem(item)} title="Save">
                    <Save size={14} />
                  </button>
                  <button type="button" className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors" onClick={() => deleteItem(item)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!orderedItems.length && (
            <div className="p-8 text-center">
              <div className="flex flex-col items-center gap-2">
                <Image size={32} className="text-slate-300" />
                <p className="text-[10px] text-slate-500">Upload banner images to build the app dashboard carousel</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}