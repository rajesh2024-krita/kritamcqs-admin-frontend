import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { subscriptionService } from "../api/subscriptionService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { RefreshIcon } from "../components/common/AdminIcons";
import { ToggleSwitch } from "../components/forms/ToggleSwitch";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";
import { formatDate } from "../utils/format";

const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api").replace(/\/api\/?$/, "");
const draftKey = "krita_invoice_template_draft";
const pageSizes = {
  A4: { width: 595, height: 842 },
  Letter: { width: 612, height: 792 },
};
const dynamicFields = [
  "invoiceNumber", "invoiceDate", "dueDate", "customerName", "customerAddress", "gstNumber",
  "companyDetails", "productTable", "tax", "discount", "totalAmount", "qrCode", "barcode",
  "terms", "authorizedSignature", "paidStampText",
];
const sampleData = {
  invoiceNumber: "001",
  invoiceDate: "Jul 13th, 2021",
  dueDate: "Feb 28th, 2022",
  customerName: "Shepard corp.",
  customerAddress: "North str. 32, Chicago USA",
  gstNumber: "GSTIN-SAMPLE",
  companyDetails: "Saldo Apps",
  tax: "USD 450.00",
  discount: "USD 0.00",
  totalAmount: "USD 8,460.00",
  paidStampText: "PAID",
};

const Icon = ({ children, title }) => (
  <span aria-hidden="true" title={title} className="inline-flex h-4 w-4 items-center justify-center text-current">{children}</span>
);
const icons = {
  bold: <Icon title="Bold"><strong>B</strong></Icon>,
  italic: <Icon title="Italic"><em>I</em></Icon>,
  underline: <Icon title="Underline"><span className="underline">U</span></Icon>,
  left: <Icon title="Align left">≡</Icon>,
  center: <Icon title="Align center">≣</Icon>,
  right: <Icon title="Align right">☰</Icon>,
  justify: <Icon title="Justify">▤</Icon>,
  undo: <Icon title="Undo">↶</Icon>,
  redo: <Icon title="Redo">↷</Icon>,
  zoomIn: <Icon title="Zoom in">＋</Icon>,
  zoomOut: <Icon title="Zoom out">−</Icon>,
  save: <Icon title="Save">▣</Icon>,
  image: <Icon title="Image">▧</Icon>,
  table: <Icon title="Table">▦</Icon>,
  shape: <Icon title="Shape">○</Icon>,
  rotate: <Icon title="Rotate">⟳</Icon>,
  pdf: <Icon title="Export PDF">▥</Icon>,
  lock: <Icon title="Lock">⌕</Icon>,
  group: <Icon title="Group">▢</Icon>,
};
const ribbonTabs = ["Home", "Insert", "Design", "Layout", "References", "View", "Templates", "Export"];
const templatePresets = ["Modern GST", "Business Pro", "Freelancer", "Tax Invoice", "Minimal Ledger"];
const editorCapabilities = [
  "A4 and Letter artboards",
  "Drag, resize, rotate",
  "Layers and reusable assets",
  "Rulers, grid, guides",
  "Autosave draft restore",
  "PDF, PNG, JPG, DOC export",
];

function ToolButton({ title, icon, children, active, onClick, disabled }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      className={`inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md border px-2 text-sm font-bold transition disabled:opacity-40 ${active ? "border-sky-400 bg-sky-100 text-sky-800" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"}`}
      onClick={onClick}
    >
      {icon}
      {children ? <span>{children}</span> : null}
    </button>
  );
}

function makeElement(type, patch = {}) {
  const base = {
    id: `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    x: 48,
    y: 120,
    width: type === "line" ? 180 : 180,
    height: type === "text" ? 44 : 90,
    rotation: 0,
    opacity: 1,
    zIndex: Date.now(),
    enabled: true,
    locked: false,
    style: {
      fontFamily: "Arial",
      fontSize: 12,
      color: "#111827",
      backgroundColor: "transparent",
      borderColor: "transparent",
      borderWidth: 0,
      borderRadius: 0,
      fontWeight: "400",
      fontStyle: "normal",
      textDecoration: "none",
      textAlign: "left",
      lineHeight: 1.2,
      letterSpacing: 0,
      textTransform: "none",
      shadow: false,
      padding: 4,
    },
  };
  if (type === "text") return { ...base, content: "New text box", ...patch };
  if (type === "image") return { ...base, src: "", width: 120, height: 80, ...patch };
  if (type === "table") return { ...base, width: 520, height: 150, table: { rows: 4, cols: 5, header: true, alternate: true, cells: [] }, ...patch };
  if (["rectangle", "circle", "line", "arrow", "divider"].includes(type)) return { ...base, shape: { kind: type }, ...patch };
  if (type === "signature") return { ...base, content: "Authorized Signature", width: 160, height: 72, ...patch };
  if (type === "qr" || type === "barcode") return { ...base, content: type.toUpperCase(), width: type === "qr" ? 80 : 160, height: 80, ...patch };
  return { ...base, ...patch };
}

const defaultElements = [
  makeElement("text", { id: "logo-text", content: "SA", x: 48, y: 40, width: 84, height: 62, style: { fontFamily: "Arial", fontSize: 46, color: "#0ea5e9", backgroundColor: "transparent", borderColor: "transparent", borderWidth: 0, fontWeight: "800", textAlign: "left", padding: 0 } }),
  makeElement("text", { id: "title", content: "Invoice", x: 425, y: 42, width: 110, height: 34, style: { fontFamily: "Arial", fontSize: 24, color: "#111111", fontWeight: "800", backgroundColor: "transparent", borderColor: "transparent", borderWidth: 0, textAlign: "right", padding: 0 } }),
  makeElement("text", { id: "from", content: "From\nSaldo Apps\nJohn Smith\nFirst str. 28-30, Chicago USA", x: 40, y: 145, width: 210, height: 90, style: { fontFamily: "Arial", fontSize: 10, color: "#111111", backgroundColor: "transparent", borderColor: "transparent", borderWidth: 0, lineHeight: 1.45, padding: 0 } }),
  makeElement("text", { id: "bill-to", content: "Bill to\n{{customerName}}\nshopard@gmail.com\n{{customerAddress}}", x: 360, y: 145, width: 185, height: 90, style: { fontFamily: "Arial", fontSize: 10, color: "#111111", backgroundColor: "transparent", borderColor: "transparent", borderWidth: 0, textAlign: "right", lineHeight: 1.45, padding: 0 } }),
  makeElement("table", { id: "items", x: 26, y: 350 }),
  makeElement("text", { id: "balance", content: "Balance Due:    {{totalAmount}}", x: 350, y: 660, width: 180, height: 26, style: { fontFamily: "Arial", fontSize: 11, color: "#111111", backgroundColor: "#eef7fc", borderColor: "transparent", borderWidth: 0, fontWeight: "800", textAlign: "right", padding: 6 } }),
  makeElement("signature", { id: "signature", x: 455, y: 748, content: "Signature", style: { fontFamily: "cursive", fontSize: 28, color: "#0ea5e9", backgroundColor: "transparent", borderColor: "transparent", borderWidth: 0, padding: 0 } }),
];

function replaceTokens(value) {
  return String(value || "").replace(/\{\{(\w+)\}\}/g, (_m, key) => sampleData[key] ?? "");
}

function Modal({ title, children, onClose, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3">
      <div className="flex max-h-[94vh] w-full max-w-[1440px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="text-xl font-black text-slate-900">{title}</h3>
          <button className={cn(ui.buttonBase, ui.buttonGhost)} onClick={onClose}>Close</button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
        {footer ? <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}

function toCss(element) {
  const s = element.style || {};
  const scaleX = element.flipX ? -1 : 1;
  const scaleY = element.flipY ? -1 : 1;
  return {
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    zIndex: element.zIndex,
    opacity: element.opacity ?? 1,
    transform: `rotate(${Number(element.rotation || 0)}deg) skew(${Number(element.skewX || 0)}deg, ${Number(element.skewY || 0)}deg) scale(${scaleX * Number(element.scaleX || 1)}, ${scaleY * Number(element.scaleY || 1)})`,
    transformOrigin: "center center",
    fontFamily: s.fontFamily,
    fontSize: Number(s.fontSize || element.size || 12),
    color: s.color || "#111827",
    backgroundColor: s.backgroundColor || "transparent",
    borderColor: s.borderColor || "transparent",
    borderWidth: Number(s.borderWidth || 0),
    borderStyle: Number(s.borderWidth || 0) > 0 ? "solid" : "none",
    borderRadius: Number(s.borderRadius || 0),
    fontWeight: s.fontWeight || "400",
    fontStyle: s.fontStyle || "normal",
    textDecoration: s.textDecoration || "none",
    textAlign: s.textAlign || "left",
    lineHeight: s.lineHeight || 1.2,
    letterSpacing: Number(s.letterSpacing || 0),
    textTransform: s.textTransform || "none",
    padding: Number(s.padding ?? 4),
    boxShadow: s.shadow ? "0 8px 20px rgba(15, 23, 42, 0.18)" : "none",
  };
}

function TableElement({ element }) {
  const rows = Number(element.table?.rows || 4);
  const cols = Number(element.table?.cols || 4);
  const cells = element.table?.cells || [];
  return (
    <table className="h-full w-full border-collapse text-[10px]" style={{ borderColor: element.style?.borderColor || "#d1d5db" }}>
      <tbody>
        {Array.from({ length: rows }).map((_, row) => (
          <tr key={row} className={row === 0 && element.table?.header ? "bg-sky-500 text-white" : element.table?.alternate && row % 2 ? "bg-sky-50" : "bg-white"}>
            {Array.from({ length: cols }).map((__, col) => (
              <td key={col} className="border px-2 py-1" style={{ borderColor: element.style?.borderColor || "#d1d5db", padding: Number(element.table?.cellPadding || 6) }}>
                {cells[row]?.[col] || (row === 0 ? ["DESCRIPTION", "RATE", "QTY", "TAX", "AMOUNT"][col] || "HEAD" : col === 0 ? "Prototype" : col === cols - 1 ? "3,200.00" : "50.00")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RenderElement({ element, selected, readOnly, onSelect, onMove, onResize, onRotate, onText, onContextMenu }) {
  const [drag, setDrag] = useState(null);
  const css = toCss(element);
  const imageSrc = element.src?.startsWith("/uploads") ? `${apiBase}${element.src}` : element.src;

  function start(event, mode, handle = "se") {
    if (readOnly || element.locked) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const centerX = Number(element.x || 0) + Number(element.width || 0) / 2;
    const centerY = Number(element.y || 0) + Number(element.height || 0) / 2;
    setDrag({ mode, handle, sx: event.clientX, sy: event.clientY, x: element.x, y: element.y, width: element.width, height: element.height, rotation: element.rotation || 0, centerX, centerY });
    onSelect(element.id, event.shiftKey);
  }

  function move(event) {
    if (!drag) return;
    const dx = event.clientX - drag.sx;
    const dy = event.clientY - drag.sy;
    if (drag.mode === "move") onMove(element.id, { x: drag.x + dx, y: drag.y + dy });
    if (drag.mode === "rotate") {
      const angle = Math.atan2(event.clientY - drag.centerY, event.clientX - drag.centerX) * 180 / Math.PI + 90;
      onRotate(element.id, { rotation: Math.round(angle) });
    }
    if (drag.mode === "resize") {
      const patch = {};
      if (drag.handle.includes("e")) patch.width = drag.width + dx;
      if (drag.handle.includes("s")) patch.height = drag.height + dy;
      if (drag.handle.includes("w")) {
        patch.x = drag.x + dx;
        patch.width = drag.width - dx;
      }
      if (drag.handle.includes("n")) {
        patch.y = drag.y + dy;
        patch.height = drag.height - dy;
      }
      if (element.keepRatio && patch.width !== undefined && patch.height === undefined) {
        patch.height = Math.max(10, patch.width * (drag.height / Math.max(drag.width, 1)));
      }
      if (element.keepRatio && patch.height !== undefined && patch.width === undefined) {
        patch.width = Math.max(10, patch.height * (drag.width / Math.max(drag.height, 1)));
      }
      onResize(element.id, patch);
    }
  }

  const handles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
  const handleClass = {
    nw: "-left-2 -top-2 cursor-nwse-resize",
    n: "left-1/2 -top-2 -translate-x-1/2 cursor-ns-resize",
    ne: "-right-2 -top-2 cursor-nesw-resize",
    e: "-right-2 top-1/2 -translate-y-1/2 cursor-ew-resize",
    se: "-bottom-2 -right-2 cursor-nwse-resize",
    s: "left-1/2 -bottom-2 -translate-x-1/2 cursor-ns-resize",
    sw: "-bottom-2 -left-2 cursor-nesw-resize",
    w: "-left-2 top-1/2 -translate-y-1/2 cursor-ew-resize",
  };

  return (
    <div
      className={`absolute select-none ${selected ? "ring-2 ring-sky-500 ring-offset-1" : ""}`}
      style={css}
      onPointerDown={(event) => start(event, "move")}
      onPointerMove={move}
      onPointerUp={() => setDrag(null)}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onSelect(element.id, event.shiftKey);
        onContextMenu?.(event, element);
      }}
    >
      {element.type === "image" ? (
        imageSrc ? <img className="h-full w-full object-contain" src={imageSrc} alt="" /> : <div className="grid h-full place-items-center text-xs text-slate-400">Image</div>
      ) : element.type === "table" ? (
        <TableElement element={element} />
      ) : ["rectangle", "circle", "line", "arrow", "divider"].includes(element.type) ? (
        <div className="h-full w-full" style={{ borderRadius: element.type === "circle" ? "999px" : css.borderRadius, borderTop: element.type === "line" || element.type === "divider" || element.type === "arrow" ? `${Number(element.style?.borderWidth || 2)}px solid ${element.style?.borderColor || "#111827"}` : undefined }}>
          {element.type === "arrow" ? <span className="absolute -right-1 -top-2 text-lg" aria-hidden="true">{">"}</span> : null}
        </div>
      ) : element.type === "qr" ? (
        <div className="grid h-full w-full grid-cols-4 grid-rows-4 gap-1 bg-white p-2">{Array.from({ length: 16 }).map((_, i) => <span key={i} className={i % 3 ? "bg-slate-900" : "bg-white"} />)}</div>
      ) : element.type === "barcode" ? (
        <div className="flex h-full items-stretch gap-1 bg-white p-2">{Array.from({ length: 24 }).map((_, i) => <span key={i} className="bg-slate-900" style={{ width: i % 3 === 0 ? 4 : 2 }} />)}</div>
      ) : (
        <div
          className="h-full w-full whitespace-pre-wrap outline-none"
          contentEditable={!readOnly && !element.locked}
          suppressContentEditableWarning
          onBlur={(event) => onText(element.id, event.currentTarget.innerText)}
        >
          {replaceTokens(element.content || element.label)}
        </div>
      )}
      {!readOnly && !element.locked ? (
        <>
          {selected ? (
            <>
              <button className="absolute left-1/2 -top-9 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-sky-500 bg-white text-sky-700 shadow" title="Rotate" onPointerDown={(event) => start(event, "rotate")}><span>{icons.rotate}</span></button>
              <div className="pointer-events-none absolute left-1/2 -top-3 h-3 border-l border-sky-500" />
            </>
          ) : null}
          {selected ? handles.map((handle) => (
            <button
              key={handle}
              className={`absolute h-4 w-4 rounded-sm border border-sky-500 bg-white shadow ${handleClass[handle]}`}
              title={`Resize ${handle}`}
              onPointerDown={(event) => start(event, "resize", handle)}
            />
          )) : null}
        </>
      ) : null}
    </div>
  );
}

function Canvas({ form, elements, selectedIds, selectElement, updateElement, readOnly, zoom, onContextMenu, invoiceRef }) {
  const page = form.page || {};
  const size = pageSizes[page.size || "A4"] || pageSizes.A4;
  const pageWidth = page.orientation === "landscape" ? size.height : size.width;
  const pageHeight = page.orientation === "landscape" ? size.width : size.height;
  const grid = Number(page.gridSize || 10);
  const snap = (value) => page.snapToGrid === false ? value : Math.round(value / grid) * grid;
  const safe = Number(page.margin || 32);
  const selectedId = selectedIds[0] || null;
  const active = elements.find((item) => item.id === selectedId);
  const activeCenterX = active ? Number(active.x || 0) + Number(active.width || 0) / 2 : null;
  const activeCenterY = active ? Number(active.y || 0) + Number(active.height || 0) / 2 : null;
  const showCenterX = activeCenterX !== null && Math.abs(activeCenterX - pageWidth / 2) < grid;
  const showCenterY = activeCenterY !== null && Math.abs(activeCenterY - pageHeight / 2) < grid;

  function clamp(id, patch) {
    const element = elements.find((item) => item.id === id);
    if (!element) return patch;
    return {
      ...patch,
      x: patch.x === undefined ? undefined : Math.max(0, Math.min(pageWidth - Number(element.width || 20), snap(patch.x))),
      y: patch.y === undefined ? undefined : Math.max(0, Math.min(pageHeight - Number(element.height || 20), snap(patch.y))),
      width: patch.width === undefined ? undefined : Math.max(10, Math.min(pageWidth - Number(element.x || 0), patch.width)),
      height: patch.height === undefined ? undefined : Math.max(10, Math.min(pageHeight - Number(element.y || 0), patch.height)),
    };
  }

  return (
    <div className="flex min-h-[760px] justify-center overflow-auto bg-slate-200 p-8">
      <div
        className="relative origin-top bg-white shadow-2xl"
        data-invoice-canvas
        style={{
          width: pageWidth,
          height: pageHeight,
          transform: `scale(${zoom})`,
          backgroundImage: page.showGrid === false ? undefined : "linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)",
          backgroundSize: `${grid}px ${grid}px`,
        }}
        onPointerDown={() => selectElement(null)}
      >
        <div className="pointer-events-none absolute -left-8 top-0 h-full w-6 bg-slate-100 text-[9px] text-slate-400">
          {Array.from({ length: Math.ceil(pageHeight / 100) }).map((_, index) => <span key={index} className="absolute" style={{ top: index * 100 }}>{index * 100}</span>)}
        </div>
        <div className="pointer-events-none absolute -top-7 left-0 h-6 w-full bg-slate-100 text-[9px] text-slate-400">
          {Array.from({ length: Math.ceil(pageWidth / 100) }).map((_, index) => <span key={index} className="absolute" style={{ left: index * 100 }}>{index * 100}</span>)}
        </div>
        <div className="pointer-events-none absolute border border-dashed border-rose-300" style={{ left: safe, top: safe, right: safe, bottom: safe }} />
        {showCenterX ? <div className="pointer-events-none absolute inset-y-0 border-l-2 border-fuchsia-400" style={{ left: pageWidth / 2 }} /> : null}
        {showCenterY ? <div className="pointer-events-none absolute inset-x-0 border-t-2 border-fuchsia-400" style={{ top: pageHeight / 2 }} /> : null}
        {elements.filter((item) => item.enabled !== false).sort((a, b) => Number(a.zIndex || 0) - Number(b.zIndex || 0)).map((element) => (
          <RenderElement
            key={element.id}
            element={element}
            selected={selectedIds.includes(element.id)}
            readOnly={readOnly}
            onSelect={selectElement}
            onMove={(id, patch) => updateElement(id, clamp(id, patch))}
            onResize={(id, patch) => updateElement(id, clamp(id, patch))}
            onRotate={(id, patch) => updateElement(id, patch)}
            onText={(id, content) => updateElement(id, { content, label: content })}
            onContextMenu={onContextMenu}
          />
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">{label}{children}</label>;
}

export function InvoiceAutomationPage() {
  const toast = useToast();
  const importRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);
  const [notifications, setNotifications] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [modal, setModal] = useState(null);
  const [activeRibbon, setActiveRibbon] = useState("Home");
  const [selectedIds, setSelectedIds] = useState([]);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [zoom, setZoom] = useState(0.92);
  const [dark, setDark] = useState(false);
  const [clipboard, setClipboard] = useState(null);
  const [savedComponents, setSavedComponents] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const invoiceRef = useRef(null);

  const elements = useMemo(() => (form?.fields?.length ? form.fields : defaultElements), [form]);
  const selectedId = selectedIds[0] || null;
  const selected = elements.find((item) => item.id === selectedId);
  const selectedMany = elements.filter((item) => selectedIds.includes(item.id));

  async function load() {
    setLoading(true);
    try {
      const [invoiceSettings, notificationSettings, invoiceList] = await Promise.all([
        subscriptionService.getInvoiceSettings(),
        subscriptionService.getNotificationSettings(),
        subscriptionService.listInvoices({ limit: 20 }),
      ]);
      const draft = localStorage.getItem(draftKey);
      const data = draft ? JSON.parse(draft) : invoiceSettings.data || {};
      setForm({
        ...data,
        page: data.page || { size: "A4", orientation: "portrait", margin: 32, snapToGrid: true, gridSize: 10, showGrid: true },
        fields: data.fields?.length ? data.fields : defaultElements,
      });
      setNotifications({
        ...(notificationSettings.data || {}),
        reminders: notificationSettings.data?.reminders?.length ? notificationSettings.data.reminders : [10, 5, 2, 0].map((daysBefore) => ({ daysBefore, enabled: true, title: daysBefore ? `Premium expires in ${daysBefore} days` : "Premium expires today", body: "", emailSubject: "", emailBody: "" })),
      });
      setInvoices(invoiceList.data || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { if (form) localStorage.setItem(draftKey, JSON.stringify(form)); }, [form]);

  function commit(next) {
    setHistory((current) => [...current.slice(-20), form]);
    setFuture([]);
    setForm(next);
  }
  function updateElement(id, patch) {
    setForm((current) => ({
      ...current,
      fields: (current.fields?.length ? current.fields : defaultElements).map((item) => item.id === id ? { ...item, ...patch, style: { ...(item.style || {}), ...(patch.style || {}) } } : item),
    }));
  }
  function selectElement(id, additive = false) {
    if (!id) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds((current) => additive ? (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]) : [id]);
  }
  function addElement(type, patch) {
    const element = makeElement(type, { x: 72, y: 120 + elements.length * 8, ...patch });
    commit({ ...form, fields: [...elements, element] });
    setSelectedIds([element.id]);
  }
  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setFuture((current) => [form, ...current]);
    setHistory((current) => current.slice(0, -1));
    setForm(previous);
  }
  function redo() {
    const next = future[0];
    if (!next) return;
    setHistory((current) => [...current, form]);
    setFuture((current) => current.slice(1));
    setForm(next);
  }
  function duplicateTemplate() {
    commit({ ...form, fields: elements.map((item) => ({ ...item, id: `${item.id}-copy-${Date.now()}`, x: Number(item.x || 0) + 18, y: Number(item.y || 0) + 18 })) });
    toast.success("Template duplicated into the current draft");
  }
  function deleteTemplate() {
    commit({ ...form, fields: defaultElements });
    toast.info("Template reset to sample design");
  }
  function patchSelected(patch) {
    if (!selectedIds.length) return;
    setForm((current) => ({
      ...current,
      fields: (current.fields?.length ? current.fields : defaultElements).map((item) =>
        selectedIds.includes(item.id) ? { ...item, ...patch, style: { ...(item.style || {}), ...(patch.style || {}) } } : item,
      ),
    }));
  }
  function alignSelected(mode) {
    if (!selectedMany.length) return;
    const minX = Math.min(...selectedMany.map((item) => Number(item.x || 0)));
    const maxRight = Math.max(...selectedMany.map((item) => Number(item.x || 0) + Number(item.width || 0)));
    const minY = Math.min(...selectedMany.map((item) => Number(item.y || 0)));
    const maxBottom = Math.max(...selectedMany.map((item) => Number(item.y || 0) + Number(item.height || 0)));
    setForm((current) => ({
      ...current,
      fields: elements.map((item) => {
        if (!selectedIds.includes(item.id)) return item;
        if (mode === "left") return { ...item, x: minX };
        if (mode === "right") return { ...item, x: maxRight - Number(item.width || 0) };
        if (mode === "top") return { ...item, y: minY };
        if (mode === "bottom") return { ...item, y: maxBottom - Number(item.height || 0) };
        if (mode === "center") return { ...item, x: minX + (maxRight - minX - Number(item.width || 0)) / 2 };
        if (mode === "middle") return { ...item, y: minY + (maxBottom - minY - Number(item.height || 0)) / 2 };
        return item;
      }),
    }));
  }
  function groupSelected() {
    if (selectedIds.length < 2) return;
    const groupId = `group-${Date.now()}`;
    patchSelected({ groupId });
    toast.success("Selected elements grouped");
  }
  function ungroupSelected() {
    patchSelected({ groupId: "" });
    toast.success("Group removed");
  }
  async function saveAll() {
    setSaving(true);
    try {
      await subscriptionService.saveInvoiceSettings(form);
      await subscriptionService.saveNotificationSettings(notifications);
      localStorage.removeItem(draftKey);
      toast.success("Invoice template saved");
      setModal(null);
      await load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  function closeContextMenu() {
    setContextMenu(null);
  }

  function getSelectedElements() {
    return elements.filter((item) => selectedIds.includes(item.id));
  }

  function findZIndexRange() {
    const zIndices = elements.map((item) => Number(item.zIndex || 0));
    return { min: Math.min(...zIndices), max: Math.max(...zIndices) };
  }

  function bringSelectedToFront() {
    const max = findZIndexRange().max;
    patchSelected({ zIndex: max + 1 });
  }

  function sendSelectedToBack() {
    const min = findZIndexRange().min;
    patchSelected({ zIndex: min - 1 });
  }

  function cutSelected() {
    const selected = getSelectedElements();
    if (!selected.length) return;
    setClipboard(selected.map((item) => ({ ...item, id: `${item.id}-copy-${Date.now()}` })));
    commit({ ...form, fields: elements.filter((item) => !selectedIds.includes(item.id)) });
    setSelectedIds([]);
  }

  function copySelected() {
    const selected = getSelectedElements();
    if (!selected.length) return;
    setClipboard(selected.map((item) => ({ ...item, id: `${item.id}-copy-${Date.now()}` })));
    toast.success("Copied to clipboard");
  }

  function pasteClipboard() {
    if (!clipboard?.length) return;
    const pasted = clipboard.map((item) => ({ ...item, id: `${item.id}-paste-${Date.now()}`, x: Number(item.x || 0) + 24, y: Number(item.y || 0) + 24 }));
    commit({ ...form, fields: [...elements, ...pasted] });
    setSelectedIds(pasted.map((item) => item.id));
  }

  function duplicateSelected() {
    if (!selectedIds.length) return;
    const duplicated = getSelectedElements().map((item) => ({ ...item, id: `${item.id}-copy-${Date.now()}`, x: Number(item.x || 0) + 18, y: Number(item.y || 0) + 18 }));
    commit({ ...form, fields: [...elements, ...duplicated] });
    setSelectedIds(duplicated.map((item) => item.id));
    toast.success("Duplicated selection");
  }

  function toggleLockSelected() {
    patchSelected({ locked: !selected?.locked });
  }

  function toggleVisibilitySelected() {
    patchSelected({ enabled: selected?.enabled === false });
  }

  function saveComponent() {
    if (!selected) return;
    setSavedComponents((current) => [...current, { ...selected, id: `component-${Date.now()}` }]);
    toast.success("Saved component for reuse");
  }

  function insertComponent(component) {
    const copied = { ...component, id: `${component.id}-import-${Date.now()}`, x: 72, y: 120, zIndex: Date.now() };
    commit({ ...form, fields: [...elements, copied] });
    setSelectedIds([copied.id]);
  }

  function handleContextMenuAction(action) {
    if (!contextMenu) return;
    const element = elements.find((item) => item.id === contextMenu.elementId);
    closeContextMenu();
    if (!element) return;
    switch (action) {
      case "edit":
        setModal("edit");
        break;
      case "cut":
        cutSelected();
        break;
      case "copy":
        copySelected();
        break;
      case "paste":
        pasteClipboard();
        break;
      case "duplicate":
        duplicateSelected();
        break;
      case "delete":
        commit({ ...form, fields: elements.filter((item) => !selectedIds.includes(item.id)) });
        setSelectedIds([]);
        break;
      case "lock":
        toggleLockSelected();
        break;
      case "hide":
        toggleVisibilitySelected();
        break;
      case "front":
        bringSelectedToFront();
        break;
      case "back":
        sendSelectedToBack();
        break;
      case "group":
        groupSelected();
        break;
      case "ungroup":
        ungroupSelected();
        break;
      case "saveComponent":
        saveComponent();
        break;
      default:
        break;
    }
  }

  async function uploadImage(event, kind = "image") {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const response = await subscriptionService.uploadInvoiceLogo(file);
      const src = response.data?.logoUrl || "";
      addElement(kind === "signature" ? "image" : "image", { src, width: kind === "signature" ? 160 : 120, height: kind === "signature" ? 64 : 80 });
      toast.success(`${kind === "signature" ? "Signature" : "Image"} added`);
    } catch (error) {
      toast.error(error.message);
    }
  }
  function exportJson() {
    const blob = new Blob([JSON.stringify(form, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: "invoice-template.json" }).click();
    URL.revokeObjectURL(url);
  }
  function importJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        commit(JSON.parse(String(reader.result || "{}")));
        toast.success("Template JSON imported");
      } catch {
        toast.error("Invalid template JSON");
      }
    };
    reader.readAsText(file);
  }
  async function captureInvoiceCanvas() {
    if (!invoiceRef.current || !form) return null;
    const page = form.page || {};
    const size = pageSizes[page.size || "A4"] || pageSizes.A4;
    const pageWidth = page.orientation === "landscape" ? size.height : size.width;
    const pageHeight = page.orientation === "landscape" ? size.width : size.height;
    const clone = invoiceRef.current.cloneNode(true);
    clone.style.position = "fixed";
    clone.style.left = "-9999px";
    clone.style.top = "-9999px";
    clone.style.transform = "scale(1)";
    clone.style.width = `${pageWidth}px`;
    clone.style.height = `${pageHeight}px`;
    clone.style.backgroundColor = form.page?.backgroundColor || "#ffffff";
    const pageCanvas = clone.querySelector("[data-invoice-canvas]");
    if (pageCanvas) {
      pageCanvas.style.transform = "scale(1)";
      pageCanvas.style.transformOrigin = "top left";
    }
    document.body.appendChild(clone);
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: form.page?.backgroundColor || "#ffffff",
      logging: false,
    });
    document.body.removeChild(clone);
    return canvas;
  }

  async function exportPdf() {
    const canvas = await captureInvoiceCanvas();
    if (!canvas) return;
    const imgData = canvas.toDataURL("image/png");
    const page = form.page || {};
    const size = pageSizes[page.size || "A4"] || pageSizes.A4;
    const pdf = new jsPDF({ orientation: page.orientation === "landscape" ? "landscape" : "portrait", unit: "px", format: [size.width, size.height] });
    pdf.addImage(imgData, "PNG", 0, 0, size.width, size.height);
    pdf.save(`invoice-${sampleData.invoiceNumber || "template"}.pdf`);
  }

  async function exportPng() {
    const canvas = await captureInvoiceCanvas();
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    Object.assign(document.createElement("a"), { href: url, download: "invoice-preview.png" }).click();
  }

  async function exportJpg() {
    const canvas = await captureInvoiceCanvas();
    if (!canvas) return;
    const url = canvas.toDataURL("image/jpeg", 0.95);
    Object.assign(document.createElement("a"), { href: url, download: "invoice-preview.jpg" }).click();
  }

  function exportDocx() {
    const html = document.querySelector("[data-invoice-page]")?.outerHTML || "";
    const blob = new Blob([`<html><body>${html}</body></html>`], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: "invoice-preview.doc" }).click();
    URL.revokeObjectURL(url);
  }
  function downloadPreview() {
    const html = document.querySelector("[data-invoice-page]")?.outerHTML || "";
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: "invoice-preview.html" }).click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    function onKey(event) {
      const tagName = event.target?.tagName?.toLowerCase();
      if (["input", "textarea", "select"].includes(tagName) || event.target?.isContentEditable) return;
      if (event.ctrlKey && event.key.toLowerCase() === "z") { event.preventDefault(); undo(); }
      if (event.ctrlKey && event.key.toLowerCase() === "y") { event.preventDefault(); redo(); }
      if (event.ctrlKey && event.key.toLowerCase() === "c") { event.preventDefault(); copySelected(); }
      if (event.ctrlKey && event.key.toLowerCase() === "x") { event.preventDefault(); cutSelected(); }
      if (event.ctrlKey && event.key.toLowerCase() === "v") { event.preventDefault(); pasteClipboard(); }
      if (event.ctrlKey && event.key.toLowerCase() === "d") { event.preventDefault(); duplicateSelected(); }
      if (event.ctrlKey && event.key.toLowerCase() === "b") { event.preventDefault(); selected && updateElement(selected.id, { style: { fontWeight: selected.style?.fontWeight === "800" ? "400" : "800" } }); }
      if (event.ctrlKey && event.key.toLowerCase() === "i") { event.preventDefault(); selected && updateElement(selected.id, { style: { fontStyle: selected.style?.fontStyle === "italic" ? "normal" : "italic" } }); }
      if (event.ctrlKey && event.key.toLowerCase() === "u") { event.preventDefault(); selected && updateElement(selected.id, { style: { textDecoration: selected.style?.textDecoration === "underline" ? "none" : "underline" } }); }
      if (event.key === "Delete" && selectedIds.length) commit({ ...form, fields: elements.filter((item) => !selectedIds.includes(item.id)) });
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", closeContextMenu);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", closeContextMenu);
    };
  }, [modal, form, selected, selectedIds, elements]);

  if (loading || !form || !notifications) return <LoadingSpinner label="Loading invoice builder..." />;

  const readOnly = modal === "view" || modal === "preview";
  const editor = (
    <div className={dark ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"}>
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white text-slate-900 shadow-sm">
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 px-2 pt-2">
          {ribbonTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`rounded-t-lg px-3 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${activeRibbon === tab ? "bg-slate-100 text-sky-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
              onClick={() => setActiveRibbon(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 p-2">
        <ToolButton title="Undo Ctrl+Z" icon={icons.undo} onClick={undo} />
        <ToolButton title="Redo Ctrl+Y" icon={icons.redo} onClick={redo} />
        <span className="h-7 border-l border-slate-200" />
        <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={selected?.style?.fontFamily || "Arial"} onChange={(event) => selected && updateElement(selected.id, { style: { fontFamily: event.target.value } })}>
          {["Arial", "Georgia", "Times New Roman", "Courier New", "Verdana", "Inter", "Poppins"].map((font) => <option key={font}>{font}</option>)}
        </select>
        <input className="h-9 w-16 rounded-md border border-slate-200 px-2 text-sm" title="Font size" type="number" value={selected?.style?.fontSize || selected?.size || 12} onChange={(event) => selected && updateElement(selected.id, { size: Number(event.target.value), style: { fontSize: Number(event.target.value) } })} />
        <ToolButton title="Bold Ctrl+B" icon={icons.bold} active={selected?.style?.fontWeight === "800"} onClick={() => selected && updateElement(selected.id, { style: { fontWeight: selected.style?.fontWeight === "800" ? "400" : "800" } })} />
        <ToolButton title="Italic Ctrl+I" icon={icons.italic} active={selected?.style?.fontStyle === "italic"} onClick={() => selected && updateElement(selected.id, { style: { fontStyle: selected.style?.fontStyle === "italic" ? "normal" : "italic" } })} />
        <ToolButton title="Underline Ctrl+U" icon={icons.underline} active={selected?.style?.textDecoration === "underline"} onClick={() => selected && updateElement(selected.id, { style: { textDecoration: selected.style?.textDecoration === "underline" ? "none" : "underline" } })} />
        {["left", "center", "right", "justify"].map((align) => <ToolButton key={align} title={`Align ${align}`} icon={icons[align]} active={selected?.style?.textAlign === align} onClick={() => selected && updateElement(selected.id, { style: { textAlign: align } })} />)}
        <label className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-200 px-2 text-xs font-bold" title="Text color">{icons.shape}<input className="h-5 w-6 border-0 bg-transparent p-0" type="color" value={selected?.style?.color === "transparent" ? "#000000" : selected?.style?.color || "#111827"} onChange={(event) => selected && updateElement(selected.id, { style: { color: event.target.value } })} /></label>
        <label className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-200 px-2 text-xs font-bold" title="Background color">BG<input className="h-5 w-6 border-0 bg-transparent p-0" type="color" value={selected?.style?.backgroundColor === "transparent" ? "#ffffff" : selected?.style?.backgroundColor || "#ffffff"} onChange={(event) => selected && updateElement(selected.id, { style: { backgroundColor: event.target.value } })} /></label>
        <span className="h-7 border-l border-slate-200" />
        <ToolButton title="Align selected left" onClick={() => alignSelected("left")}>L</ToolButton>
        <ToolButton title="Align selected center" onClick={() => alignSelected("center")}>C</ToolButton>
        <ToolButton title="Align selected right" onClick={() => alignSelected("right")}>R</ToolButton>
        <ToolButton title="Group selected" icon={icons.group} onClick={groupSelected} />
        <ToolButton title="Ungroup selected" onClick={ungroupSelected}>UG</ToolButton>
        <ToolButton title="Lock/Unlock" icon={icons.lock} onClick={() => selected && updateElement(selected.id, { locked: !selected.locked })} active={Boolean(selected?.locked)} />
        <span className="h-7 border-l border-slate-200" />
        <ToolButton title="Zoom out" icon={icons.zoomOut} onClick={() => setZoom((z) => Math.max(0.35, z - 0.1))} />
        <span className="min-w-12 text-center text-sm font-bold">{Math.round(zoom * 100)}%</span>
        <ToolButton title="Zoom in" icon={icons.zoomIn} onClick={() => setZoom((z) => Math.min(1.8, z + 0.1))} />
        <ToolButton title="Dark/Light mode" onClick={() => setDark((v) => !v)}>{dark ? "☀" : "◐"}</ToolButton>
          <span className="h-7 border-l border-slate-200" />
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{activeRibbon} tools</span>
        </div>
      </div>
      <div className="grid min-h-[760px] grid-cols-1 lg:grid-cols-[220px_1fr_300px]">
        <aside className="border-r border-slate-200 bg-white p-3 text-slate-900">
          <h4 className="mb-3 font-black">Components</h4>
          <div className="grid grid-cols-2 gap-2">
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => addElement("text")}>T Text</button>
            <label className={cn(ui.buttonBase, ui.buttonSecondary, "cursor-pointer")}>{icons.image} Image<input className="hidden" type="file" accept=".png,.jpg,.jpeg,.svg,.webp,image/*" onChange={uploadImage} /></label>
            <label className={cn(ui.buttonBase, ui.buttonSecondary, "cursor-pointer")}>✍ Sign<input className="hidden" type="file" accept=".png,.jpg,.jpeg,.svg,.webp,image/*" onChange={(e) => uploadImage(e, "signature")} /></label>
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => addElement("table")}>{icons.table} Table</button>
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => addElement("rectangle")}>{icons.shape} Rect</button>
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => addElement("circle")}>○ Circle</button>
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => addElement("line", { height: 8 })}>─ Line</button>
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => addElement("arrow", { height: 8 })}>→ Arrow</button>
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => addElement("qr")}>▦ QR</button>
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => addElement("barcode")}>▥ Code</button>
          </div>
          <h4 className="mb-2 mt-5 font-black">Dynamic Fields</h4>
          <div className="max-h-56 overflow-auto space-y-1">
            {dynamicFields.map((field) => <button key={field} className="block w-full rounded border border-slate-200 px-2 py-1 text-left text-xs hover:bg-sky-50" onClick={() => addElement("text", { content: `{{${field}}}`, width: 180, height: 28 })}>{`{{${field}}}`}</button>)}
          </div>
          <h4 className="mb-2 mt-5 font-black">Layers</h4>
          <div className="max-h-48 overflow-auto space-y-1">
            {elements.slice().sort((a, b) => Number(b.zIndex || 0) - Number(a.zIndex || 0)).map((item) => (
              <button key={item.id} className={`block w-full truncate rounded px-2 py-1 text-left text-xs ${item.id === selectedId ? "bg-sky-100 text-sky-800" : "bg-slate-50"}`} onClick={() => setSelectedIds([item.id])}>{item.type} - {item.content || item.label || item.id}</button>
            ))}
          </div>
          <h4 className="mb-2 mt-5 font-black">Reusable Components</h4>
          <div className="max-h-32 overflow-auto space-y-1 rounded border border-slate-200 bg-slate-50 p-2">
            {savedComponents.length ? savedComponents.map((component) => (
              <button key={component.id} className="block w-full truncate rounded bg-white px-2 py-1 text-left text-xs hover:bg-sky-50" onClick={() => insertComponent(component)}>{component.type} {component.content ? `- ${String(component.content).slice(0, 20)}` : ""}</button>
            )) : <div className="text-xs text-slate-500">Save selected elements to reuse here.</div>}
          </div>
        </aside>
        <div className="relative overflow-hidden bg-slate-100 p-4" ref={invoiceRef} data-invoice-page>
          <Canvas form={form} elements={elements} selectedIds={selectedIds} selectElement={selectElement} updateElement={updateElement} readOnly={readOnly} zoom={zoom} onContextMenu={(event, element) => setContextMenu({ x: event.clientX, y: event.clientY, elementId: element.id, element })} invoiceRef={invoiceRef} />
        </div>
        <aside className="border-l border-slate-200 bg-white p-3 text-slate-900">
          <h4 className="mb-3 font-black">Properties</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Page"><select className={ui.input} value={form.page?.size || "A4"} onChange={(e) => setForm({ ...form, page: { ...(form.page || {}), size: e.target.value } })}><option>A4</option><option>Letter</option></select></Field>
              <Field label="Orientation"><select className={ui.input} value={form.page?.orientation || "portrait"} onChange={(e) => setForm({ ...form, page: { ...(form.page || {}), orientation: e.target.value } })}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></Field>
              <Field label="Margin"><input className={ui.input} type="number" value={form.page?.margin || 32} onChange={(e) => setForm({ ...form, page: { ...(form.page || {}), margin: Number(e.target.value) } })} /></Field>
              <Field label="Grid"><input className={ui.input} type="number" value={form.page?.gridSize || 10} onChange={(e) => setForm({ ...form, page: { ...(form.page || {}), gridSize: Number(e.target.value) } })} /></Field>
            </div>
            <ToggleSwitch checked={form.page?.snapToGrid !== false} onChange={(value) => setForm({ ...form, page: { ...(form.page || {}), snapToGrid: value } })} label="Snap to grid" />
            {selected ? (
              <>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">Transform</div>
                  <div className="grid grid-cols-2 gap-2">
                    {["x", "y", "width", "height", "rotation", "zIndex"].map((key) => <Field key={key} label={key}><input className={ui.input} type="number" value={selected[key] ?? ""} onChange={(e) => updateElement(selected.id, { [key]: Number(e.target.value) })} /></Field>)}
                    <Field label="Scale X"><input className={ui.input} type="number" step="0.1" value={selected.scaleX ?? 1} onChange={(e) => updateElement(selected.id, { scaleX: Number(e.target.value) })} /></Field>
                    <Field label="Scale Y"><input className={ui.input} type="number" step="0.1" value={selected.scaleY ?? 1} onChange={(e) => updateElement(selected.id, { scaleY: Number(e.target.value) })} /></Field>
                    <Field label="Skew X"><input className={ui.input} type="number" value={selected.skewX ?? 0} onChange={(e) => updateElement(selected.id, { skewX: Number(e.target.value) })} /></Field>
                    <Field label="Skew Y"><input className={ui.input} type="number" value={selected.skewY ?? 0} onChange={(e) => updateElement(selected.id, { skewY: Number(e.target.value) })} /></Field>
                  </div>
                  <Field label="Opacity"><input className="w-full" type="range" min="0" max="1" step="0.05" value={selected.opacity ?? 1} onChange={(e) => updateElement(selected.id, { opacity: Number(e.target.value) })} /></Field>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => updateElement(selected.id, { flipX: !selected.flipX })}>Flip H</button>
                    <button className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => updateElement(selected.id, { flipY: !selected.flipY })}>Flip V</button>
                    <button className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => updateElement(selected.id, { locked: !selected.locked })}>{selected.locked ? "Unlock" : "Lock"}</button>
                    <button className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => updateElement(selected.id, { keepRatio: !selected.keepRatio })}>{selected.keepRatio ? "Free Ratio" : "Keep Ratio"}</button>
                  </div>
                </div>
                {selected.type === "text" || selected.type === "signature" ? <Field label="Rich Text"><textarea className={ui.textarea} value={selected.content || selected.label || ""} onChange={(e) => updateElement(selected.id, { content: e.target.value, label: e.target.value })} /></Field> : null}
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Font Size"><input className={ui.input} type="number" value={selected.style?.fontSize || selected.size || 12} onChange={(e) => updateElement(selected.id, { size: Number(e.target.value), style: { fontSize: Number(e.target.value) } })} /></Field>
                  <Field label="Line Spacing"><input className={ui.input} type="number" step="0.1" value={selected.style?.lineHeight || 1.2} onChange={(e) => updateElement(selected.id, { style: { lineHeight: Number(e.target.value) } })} /></Field>
                  <Field label="Letter Spacing"><input className={ui.input} type="number" value={selected.style?.letterSpacing || 0} onChange={(e) => updateElement(selected.id, { style: { letterSpacing: Number(e.target.value) } })} /></Field>
                  <Field label="Border"><input className={ui.input} type="number" value={selected.style?.borderWidth || 0} onChange={(e) => updateElement(selected.id, { style: { borderWidth: Number(e.target.value) } })} /></Field>
                  <Field label="Text Color"><input className={ui.input} type="color" value={selected.style?.color === "transparent" ? "#000000" : selected.style?.color || "#111827"} onChange={(e) => updateElement(selected.id, { style: { color: e.target.value } })} /></Field>
                  <Field label="Background"><input className={ui.input} type="color" value={selected.style?.backgroundColor === "transparent" ? "#ffffff" : selected.style?.backgroundColor || "#ffffff"} onChange={(e) => updateElement(selected.id, { style: { backgroundColor: e.target.value } })} /></Field>
                  <Field label="Border Color"><input className={ui.input} type="color" value={selected.style?.borderColor === "transparent" ? "#ffffff" : selected.style?.borderColor || "#ffffff"} onChange={(e) => updateElement(selected.id, { style: { borderColor: e.target.value } })} /></Field>
                  <Field label="Radius"><input className={ui.input} type="number" value={selected.style?.borderRadius || 0} onChange={(e) => updateElement(selected.id, { style: { borderRadius: Number(e.target.value) } })} /></Field>
                  <Field label="Padding"><input className={ui.input} type="number" value={selected.style?.padding ?? 4} onChange={(e) => updateElement(selected.id, { style: { padding: Number(e.target.value) } })} /></Field>
                  <Field label="Margin"><input className={ui.input} type="number" value={selected.style?.margin ?? 0} onChange={(e) => updateElement(selected.id, { style: { margin: Number(e.target.value) } })} /></Field>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => updateElement(selected.id, { style: { backgroundColor: "transparent" } })}>No BG</button>
                  <button className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => updateElement(selected.id, { style: { borderColor: "transparent", borderWidth: 0 } })}>No Border</button>
                  <button className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => updateElement(selected.id, { style: { shadow: !selected.style?.shadow } })}>Shadow</button>
                  <button className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => updateElement(selected.id, { style: { textTransform: selected.style?.textTransform === "uppercase" ? "lowercase" : "uppercase" } })}>Aa</button>
                  <button className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => selected.type === "text" && updateElement(selected.id, { content: `• ${String(selected.content || "").replace(/\n/g, "\n• ")}` })}>Bullets</button>
                  <button className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => selected.type === "text" && updateElement(selected.id, { content: String(selected.content || "").split("\n").map((line, index) => `${index + 1}. ${line}`).join("\n") })}>Number</button>
                </div>
                {selected.type === "table" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => updateElement(selected.id, { table: { ...(selected.table || {}), rows: Number(selected.table?.rows || 1) + 1 } })}>Add Row</button>
                    <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => updateElement(selected.id, { table: { ...(selected.table || {}), cols: Number(selected.table?.cols || 1) + 1 } })}>Add Col</button>
                    <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => updateElement(selected.id, { table: { ...(selected.table || {}), alternate: !selected.table?.alternate } })}>Alt Rows</button>
                    <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => updateElement(selected.id, { table: { ...(selected.table || {}), header: !selected.table?.header } })}>Header</button>
                  </div>
                ) : null}
                <button className={cn(ui.buttonBase, ui.buttonDanger, "w-full")} onClick={() => { commit({ ...form, fields: elements.filter((item) => item.id !== selected.id) }); setSelectedIds([]); }}>Delete Element</button>
              </>
            ) : <p className={ui.muted}>Select an element to edit advanced properties.</p>}
          </div>
        </aside>
      {contextMenu ? (
        <div
          className="fixed z-50 rounded-lg border border-slate-200 bg-white p-2 text-sm shadow-xl"
          style={{ left: contextMenu.x, top: contextMenu.y, minWidth: 180 }}
        >
          {[
            { label: "Edit", action: "edit" },
            { label: "Cut", action: "cut" },
            { label: "Copy", action: "copy" },
            { label: "Paste", action: "paste", disabled: !clipboard?.length },
            { label: "Duplicate", action: "duplicate" },
            { label: "Delete", action: "delete" },
            { label: selected?.locked ? "Unlock" : "Lock", action: "lock" },
            { label: selected?.enabled === false ? "Show Element" : "Hide Element", action: "hide" },
            { label: "Bring to Front", action: "front" },
            { label: "Send to Back", action: "back" },
            { label: "Group Elements", action: "group" },
            { label: "Ungroup Elements", action: "ungroup" },
            { label: "Save as Component", action: "saveComponent" },
          ].map((item) => (
            <button
              key={item.action}
              type="button"
              disabled={item.disabled}
              className="block w-full rounded px-2 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => handleContextMenuAction(item.action)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div><div className={ui.eyebrow}>Template Builder</div><h2 className="text-3xl font-black tracking-tight text-slate-900">MS Word-style Invoice Builder</h2><p className={ui.muted}>Create fully customizable invoice templates with drag-and-drop editing, layers, placeholders, tables, images, shapes, signatures, preview, and exports.</p></div>
          <div className="flex flex-wrap gap-3">
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => setModal("create")}>Create</button>
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => setModal("edit")}>Edit</button>
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => setModal("view")}>View</button>
            <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={() => setModal("preview")}>Preview</button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {editorCapabilities.map((item) => (
            <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-700">{item}</div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/70">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className={ui.eyebrow}>Invoice Design Studio</div>
            <h3 className="text-2xl font-black tracking-tight text-slate-900">Live professional invoice editor</h3>
            <p className={ui.muted}>Build, duplicate, preview, save draft, export, print, and reuse invoice templates from one workspace.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={duplicateSelected}>Duplicate</button>
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={exportPdf}>PDF</button>
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={exportPng}>PNG</button>
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={exportJpg}>JPG</button>
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={exportDocx}>DOC</button>
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => window.print()}>Print</button>
            <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={saveAll} disabled={saving}>{saving ? "Saving..." : "Save Template"}</button>
          </div>
        </div>
        {editor}
      </section>

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div><h3 className="text-xl font-bold text-slate-900">Template Management</h3><p className={ui.muted}>Autosave draft is active. Import, export, duplicate, reset, and save the default template.</p></div>
          <div className="flex flex-wrap gap-3">
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={duplicateTemplate}>Duplicate Template</button>
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={exportJson}>Export JSON</button>
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => importRef.current?.click()}>Import JSON</button>
            <button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={deleteTemplate}>Delete/Reset</button>
            <input ref={importRef} className="hidden" type="file" accept="application/json,.json" onChange={importJson} />
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {templatePresets.map((name) => (
            <button
              key={name}
              type="button"
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-left text-sm font-black text-slate-800 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
              onClick={() => {
                commit({ ...form, templateName: name, fields: defaultElements.map((item) => ({ ...item, id: `${item.id}-${name.replace(/\s+/g, "-").toLowerCase()}` })) });
                toast.success(`${name} template loaded`);
              }}
            >
              {name}
              <span className="mt-1 block text-xs font-semibold text-slate-500">Preview and reuse template</span>
            </button>
          ))}
        </div>
      </section>

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div><h3 className="text-xl font-bold text-slate-900">Expiry Reminder Templates</h3><p className={ui.muted}>Configure reminder days, title, and activation status in a popup modal.</p></div>
          <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => setModal("reminders")}>Configure Reminders</button>
        </div>
      </section>

      <section className={ui.tableWrap}>
        <div className="flex items-center justify-between border-b border-slate-200 p-4"><h3 className="text-lg font-bold text-slate-900">Invoice History</h3><button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={load}><RefreshIcon size={16} />Refresh</button></div>
        <div className={ui.tableScroll}>
          <table className={ui.table}><thead><tr><th className={ui.tableHead}>Invoice</th><th className={ui.tableHead}>User</th><th className={ui.tableHead}>Amount</th><th className={ui.tableHead}>Email</th><th className={ui.tableHead}>Date</th><th className={ui.tableHead}>PDF</th></tr></thead><tbody>{invoices.map((item) => <tr key={item.id}><td className={ui.tableCell}>{item.invoiceNumber}</td><td className={ui.tableCell}>{item.userName}<div className="text-xs text-slate-500">{item.userEmail || "-"}</div></td><td className={ui.tableCell}>Rs. {Number(item.amount || 0)}</td><td className={ui.tableCell}><span className={ui.pill}>{item.emailStatus}</span></td><td className={ui.tableCell}>{formatDate(item.issuedAt || item.createdAt)}</td><td className={ui.tableCell}>{item.pdfPath ? <a className="font-bold text-sky-700" href={`${apiBase}${item.pdfPath}`} target="_blank" rel="noreferrer">Open</a> : "-"}</td></tr>)}</tbody></table>
        </div>
      </section>

      {["create", "edit", "view", "preview"].includes(modal) ? (
        <Modal
          title={modal === "preview" ? "Real-time Sample Preview" : `${modal[0].toUpperCase()}${modal.slice(1)} Invoice Template`}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={exportPdf}>Export PDF</button>
              <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={exportPng}>Export PNG</button>
              <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={exportJpg}>Export JPG</button>
              <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={exportDocx}>Export DOCX</button>
              <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={downloadPreview}>Download Preview</button>
              {modal !== "view" && modal !== "preview" ? <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={saveAll} disabled={saving}>{saving ? "Saving..." : "Save as Template"}</button> : null}
            </>
          }
        >
          {editor}
        </Modal>
      ) : null}

      {modal === "reminders" ? (
        <Modal title="Expiry Reminder Template" onClose={() => setModal(null)} footer={<button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={saveAll} disabled={saving}>{saving ? "Saving..." : "Save Reminders"}</button>}>
          <div className="space-y-4 p-5">
            {notifications.reminders.map((reminder, index) => (
              <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 p-4 md:grid-cols-[120px_1fr_170px]" key={`${reminder.daysBefore}-${index}`}>
                <Field label="Days"><input className={ui.input} type="number" value={reminder.daysBefore} onChange={(event) => setNotifications((current) => ({ ...current, reminders: current.reminders.map((item, itemIndex) => itemIndex === index ? { ...item, daysBefore: Number(event.target.value) } : item) }))} /></Field>
                <Field label="Title"><input className={ui.input} value={reminder.title || ""} onChange={(event) => setNotifications((current) => ({ ...current, reminders: current.reminders.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item) }))} /></Field>
                <Field label="Active / Deactivate"><div className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3"><ToggleSwitch checked={reminder.enabled !== false} onChange={(value) => setNotifications((current) => ({ ...current, reminders: current.reminders.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: value } : item) }))} label={reminder.enabled !== false ? "Active" : "Inactive"} /></div></Field>
                <Field label="Email / In-app Body"><textarea className={ui.textarea} value={reminder.body || ""} onChange={(event) => setNotifications((current) => ({ ...current, reminders: current.reminders.map((item, itemIndex) => itemIndex === index ? { ...item, body: event.target.value, emailBody: event.target.value } : item) }))} /></Field>
              </div>
            ))}
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => setNotifications((current) => ({ ...current, reminders: [...current.reminders, { daysBefore: 1, enabled: true, title: "Premium expires soon", body: "", emailSubject: "", emailBody: "" }] }))}>Add Reminder</button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
