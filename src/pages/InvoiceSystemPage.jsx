import { useEffect, useMemo, useState } from "react";
import { Editor } from "../invoice-template/components/Editor/Editor";
import { useEditorStore } from "../invoice-template/store/useEditorStore";
import { subscriptionService } from "../api/subscriptionService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { RefreshIcon } from "../components/common/AdminIcons";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";
import { formatDate } from "../utils/format";

const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api").replace(/\/api\/?$/, "");
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;
const PDF_WIDTH = 595;
const PDF_HEIGHT = 842;
const emptyInvoiceForm = {
  id: "",
  billingCompany: { name: "Krita NEET JEE", email: "", phone: "", address: "", gstin: "" },
  customerCompany: { name: "", email: "", phone: "", address: "", gstin: "" },
  taxDetails: { gstType: "GST", placeOfSupply: "", taxNumber: "" },
  invoiceNumber: "",
  invoiceDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  status: "draft",
  currency: "INR",
  transactionId: "",
  notes: "",
  terms: "",
  signatureUrl: "",
  logoUrl: "",
  qrCode: "",
  items: [{ product: "Premium Subscription", description: "", quantity: 1, price: 0, tax: 0, discount: 0, total: 0 }],
};

function tokenText(type) {
  if (type === "i-text" || type === "text") return true;
  return false;
}

function canvasToInvoiceFields(canvas) {
  const page = canvas.getObjects().find((obj) => obj.isPage);
  const pageLeft = Number(page?.left || 0);
  const pageTop = Number(page?.top || 0);
  const scaleX = PDF_WIDTH / PAGE_WIDTH;
  const scaleY = PDF_HEIGHT / PAGE_HEIGHT;

  return canvas
    .getObjects()
    .filter((obj) => !obj.isPage)
    .map((obj, index) => {
      const isText = tokenText(obj.type);
      const text = isText ? obj.text || "" : obj.type || "Element";
      return {
        id: obj.id || `canvas-${index}-${Date.now()}`,
        type: isText ? "text" : obj.type === "image" ? "image" : "text",
        label: text,
        content: text,
        src: obj.getSrc?.() || "",
        x: Math.max(0, Math.round((Number(obj.left || 0) - pageLeft) * scaleX)),
        y: Math.max(0, Math.round((Number(obj.top || 0) - pageTop) * scaleY)),
        width: Math.max(10, Math.round(Number(obj.getScaledWidth?.() || obj.width || 120) * scaleX)),
        height: Math.max(10, Math.round(Number(obj.getScaledHeight?.() || obj.height || 80) * scaleY)),
        size: Math.max(6, Math.round(Number(obj.fontSize || 10) * scaleY)),
        rotation: Number(obj.angle || 0),
        opacity: Number(obj.opacity ?? 1),
        zIndex: index + 1,
        enabled: obj.visible !== false,
        style: {
          fontFamily: obj.fontFamily || "Inter",
          fontWeight: obj.fontWeight || "normal",
          color: obj.fill || "#111827",
        },
      };
    });
}

export function InvoiceSystemPage() {
  const toast = useToast();
  const { canvas } = useEditorStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [subscriptionId, setSubscriptionId] = useState("");
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm);
  const [templateName, setTemplateName] = useState("Default Invoice Template");

  const invoiceStats = useMemo(() => {
    const total = invoices.length;
    const sent = invoices.filter((item) => item.emailStatus === "sent").length;
    const pending = invoices.filter((item) => item.emailStatus === "pending").length;
    const failed = invoices.filter((item) => item.emailStatus === "failed").length;
    return { total, sent, pending, failed };
  }, [invoices]);

  const templates = useMemo(() => {
    const saved = (settings?.reusableBlocks || []).filter((item) => item.type === "fabric-template");
    if (saved.length) return saved.map((item, index) => ({ ...item, id: item.id || `template-${index}` }));
    return [{ id: "default-template", type: "fabric-template", name: "Default Invoice Template", active: true, fabricJson: null }];
  }, [settings]);

  const activeTemplate = useMemo(() => templates.find((item) => item.active) || templates[0], [templates]);

  const totals = useMemo(() => {
    return invoiceForm.items.reduce(
      (acc, item) => {
        const quantity = Math.max(0, Number(item.quantity || 0));
        const price = Math.max(0, Number(item.price || 0));
        const discount = Math.max(0, Number(item.discount || 0));
        const taxable = Math.max(0, quantity * price - discount);
        const taxAmount = (taxable * Math.max(0, Number(item.tax || 0))) / 100;
        acc.subtotal += quantity * price;
        acc.discountTotal += discount;
        acc.taxTotal += taxAmount;
        acc.grandTotal += taxable + taxAmount;
        return acc;
      },
      { subtotal: 0, discountTotal: 0, taxTotal: 0, grandTotal: 0 },
    );
  }, [invoiceForm.items]);

  function patchInvoice(path, value) {
    setInvoiceForm((current) => {
      const [group, key] = path.split(".");
      if (key) return { ...current, [group]: { ...(current[group] || {}), [key]: value } };
      return { ...current, [path]: value };
    });
  }

  function patchItem(index, key, value) {
    setInvoiceForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item),
    }));
  }

  function addItem() {
    setInvoiceForm((current) => ({
      ...current,
      items: [...current.items, { product: "", description: "", quantity: 1, price: 0, tax: 0, discount: 0, total: 0 }],
    }));
  }

  function removeItem(index) {
    setInvoiceForm((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }));
  }

  function editInvoice(item) {
    setInvoiceForm({
      ...emptyInvoiceForm,
      ...item,
      id: item.id,
      invoiceDate: item.invoiceDate ? String(item.invoiceDate).slice(0, 10) : item.issuedAt ? String(item.issuedAt).slice(0, 10) : "",
      dueDate: item.dueDate ? String(item.dueDate).slice(0, 10) : "",
      billingCompany: { ...emptyInvoiceForm.billingCompany, ...(item.billingCompany || {}) },
      customerCompany: { ...emptyInvoiceForm.customerCompany, ...(item.customerCompany || {}), name: item.customerCompany?.name || item.userName || "", email: item.customerCompany?.email || item.userEmail || "" },
      taxDetails: { ...emptyInvoiceForm.taxDetails, ...(item.taxDetails || {}) },
      items: item.items?.length ? item.items : emptyInvoiceForm.items,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function load() {
    setLoading(true);
    try {
      const [settingsResponse, invoiceResponse] = await Promise.all([
        subscriptionService.getInvoiceSettings(),
        subscriptionService.listInvoices({ limit: 50 }),
      ]);
      const nextSettings = settingsResponse.data || {};
      setSettings(nextSettings);
      setInvoices(invoiceResponse.data || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!canvas || !activeTemplate?.fabricJson) return;
    canvas.loadFromJSON(activeTemplate.fabricJson, () => {
      canvas.renderAll();
    });
    setTemplateName(activeTemplate.name || "Default Invoice Template");
  }, [canvas, activeTemplate?.id, settings?.id]);

  async function saveTemplate() {
    if (!canvas || !settings) {
      toast.error("Invoice editor is not ready yet");
      return;
    }
    setSaving(true);
    try {
      const fabricJson = canvas.toJSON(["isPage", "id", "invoiceTable"]);
      const fields = canvasToInvoiceFields(canvas);
      const currentId = activeTemplate?.id && activeTemplate.id !== "default-template" ? activeTemplate.id : `template-${Date.now()}`;
      const otherBlocks = (settings.reusableBlocks || []).filter((item) => item.type !== "fabric-template" || (item.id && item.id !== currentId));
      const templateBlocks = templates
        .filter((item) => item.id !== "default-template" && item.id !== currentId)
        .map((item) => ({ ...item, active: false }));
      const payload = {
        ...settings,
        fields,
        reusableBlocks: [
          ...otherBlocks.filter((item) => item.type !== "fabric-template"),
          ...templateBlocks,
          { id: currentId, type: "fabric-template", name: templateName || "Invoice Template", active: true, savedAt: new Date().toISOString(), fabricJson },
        ],
        page: { size: "A4", orientation: "portrait", margin: 32, editor: "invoice-template" },
      };
      const response = await subscriptionService.saveInvoiceSettings(payload);
      setSettings(response.data);
      toast.success("Invoice template saved for future purchases");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function activateTemplate(template) {
    if (!settings) return;
    const nextBlocks = templates.map((item) => ({ ...item, active: item.id === template.id }));
    try {
      const response = await subscriptionService.saveInvoiceSettings({ ...settings, reusableBlocks: nextBlocks });
      setSettings(response.data);
      if (canvas && template.fabricJson) {
        canvas.loadFromJSON(template.fabricJson, () => canvas.renderAll());
      }
      toast.success(`${template.name || "Template"} is active`);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function duplicateTemplate(template) {
    if (!settings) return;
    const copy = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name || "Invoice Template"} Copy`,
      active: false,
      savedAt: new Date().toISOString(),
    };
    try {
      const response = await subscriptionService.saveInvoiceSettings({ ...settings, reusableBlocks: [...templates.filter((item) => item.id !== "default-template"), copy] });
      setSettings(response.data);
      toast.success("Template duplicated");
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function generateInvoice() {
    const id = subscriptionId.trim();
    if (!id) {
      toast.error("Enter a subscription id");
      return;
    }
    try {
      await subscriptionService.generateInvoice(id);
      toast.success("Invoice generated and email flow processed");
      setSubscriptionId("");
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function saveInvoice(status = invoiceForm.status || "draft") {
    const payload = {
      ...invoiceForm,
      status,
      userName: invoiceForm.customerCompany.name,
      userEmail: invoiceForm.customerCompany.email,
      amount: totals.grandTotal,
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      discountTotal: totals.discountTotal,
      grandTotal: totals.grandTotal,
    };
    try {
      const response = invoiceForm.id
        ? await subscriptionService.updateInvoice(invoiceForm.id, payload)
        : await subscriptionService.createInvoice(payload);
      toast.success(invoiceForm.id ? "Invoice updated" : "Invoice created");
      setInvoiceForm({ ...emptyInvoiceForm, ...response.data, id: response.data.id });
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function duplicateInvoice(id) {
    try {
      await subscriptionService.duplicateInvoice(id);
      toast.success("Invoice duplicated");
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function sendInvoice(id) {
    try {
      await subscriptionService.sendInvoice(id);
      toast.success("Invoice email processed");
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function deleteInvoice(id) {
    if (!window.confirm("Delete this invoice?")) return;
    try {
      await subscriptionService.deleteInvoice(id);
      toast.success("Invoice deleted");
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  }

  if (loading) return <LoadingSpinner label="Loading invoice system..." />;

  return (
    <div className="flex flex-col gap-6">
      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <div className={ui.eyebrow}>Student Purchase Invoices</div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Invoice System</h2>
            <p className={ui.muted}>Customize the invoice template used after student subscription purchases. Successful purchases already call the backend invoice generation and email flow.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={load}><RefreshIcon size={16} />Refresh</button>
            <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={saveTemplate} disabled={saving}>{saving ? "Saving..." : "Save Invoice Template"}</button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className={ui.tile}><div className={ui.metricLabel}>Invoices</div><div className={ui.metricValue}>{invoiceStats.total}</div></div>
          <div className={ui.tile}><div className={ui.metricLabel}>Email Sent</div><div className={ui.metricValue}>{invoiceStats.sent}</div></div>
          <div className={ui.tile}><div className={ui.metricLabel}>Pending</div><div className={ui.metricValue}>{invoiceStats.pending}</div></div>
          <div className={ui.tile}><div className={ui.metricLabel}>Failed</div><div className={ui.metricValue}>{invoiceStats.failed}</div></div>
        </div>
      </section>

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Create / Edit Invoice</h3>
            <p className={ui.muted}>Fill invoice details first, then save as draft, mark status, email, download, or continue designing the visual template below.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => setInvoiceForm(emptyInvoiceForm)}>New</button>
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => saveInvoice("draft")}>Save Draft</button>
            <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={() => saveInvoice(invoiceForm.status)}>Save Invoice</button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[
            ["billingCompany.name", "Billing Company"],
            ["billingCompany.email", "Billing Email"],
            ["billingCompany.phone", "Billing Phone"],
            ["billingCompany.gstin", "Billing GSTIN"],
            ["customerCompany.name", "Customer / To Company"],
            ["customerCompany.email", "Customer Email"],
            ["customerCompany.phone", "Customer Phone"],
            ["customerCompany.gstin", "Customer GSTIN"],
            ["invoiceNumber", "Invoice Number"],
            ["invoiceDate", "Invoice Date"],
            ["dueDate", "Due Date"],
            ["transactionId", "Transaction ID"],
            ["logoUrl", "Logo URL"],
            ["signatureUrl", "Signature URL"],
            ["qrCode", "QR Code / Payment Link"],
          ].map(([key, label]) => (
            <label className={ui.field} key={key}>
              <span>{label}</span>
              <input className={ui.input} type={key.toLowerCase().includes("date") ? "date" : "text"} value={key.includes(".") ? invoiceForm[key.split(".")[0]]?.[key.split(".")[1]] || "" : invoiceForm[key] || ""} onChange={(event) => patchInvoice(key, event.target.value)} />
            </label>
          ))}
          <label className={ui.field}>
            <span>Status</span>
            <select className={ui.input} value={invoiceForm.status} onChange={(event) => patchInvoice("status", event.target.value)}>
              {["draft", "sent", "paid", "pending", "cancelled"].map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <label className={ui.field}>
            <span>Currency</span>
            <select className={ui.input} value={invoiceForm.currency} onChange={(event) => patchInvoice("currency", event.target.value)}>
              {["INR", "USD", "EUR", "GBP", "AED"].map((currency) => <option key={currency}>{currency}</option>)}
            </select>
          </label>
          <label className={ui.field}>
            <span>Tax Type</span>
            <input className={ui.input} value={invoiceForm.taxDetails.gstType || ""} onChange={(event) => patchInvoice("taxDetails.gstType", event.target.value)} />
          </label>
          <label className={cn(ui.field, "lg:col-span-3")}>
            <span>Billing Address</span>
            <textarea className={ui.textarea} value={invoiceForm.billingCompany.address || ""} onChange={(event) => patchInvoice("billingCompany.address", event.target.value)} />
          </label>
          <label className={cn(ui.field, "lg:col-span-3")}>
            <span>Customer Address</span>
            <textarea className={ui.textarea} value={invoiceForm.customerCompany.address || ""} onChange={(event) => patchInvoice("customerCompany.address", event.target.value)} />
          </label>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-3">
            <h4 className="font-black text-slate-900">Dynamic Items Table</h4>
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={addItem}>Add Row</button>
          </div>
          <div className="overflow-x-auto">
            <table className={ui.table}>
              <thead><tr>{["Product/Service", "Description", "Qty", "Price", "Discount", "Tax %", "Total", ""].map((head) => <th className={ui.tableHead} key={head}>{head}</th>)}</tr></thead>
              <tbody>
                {invoiceForm.items.map((item, index) => {
                  const taxable = Math.max(0, Number(item.quantity || 0) * Number(item.price || 0) - Number(item.discount || 0));
                  const total = taxable + (taxable * Number(item.tax || 0)) / 100;
                  return (
                    <tr key={index}>
                      {["product", "description", "quantity", "price", "discount", "tax"].map((key) => (
                        <td className={ui.tableCell} key={key}><input className={ui.input} type={["quantity", "price", "discount", "tax"].includes(key) ? "number" : "text"} value={item[key] || ""} onChange={(event) => patchItem(index, key, event.target.value)} /></td>
                      ))}
                      <td className={ui.tableCell}>{invoiceForm.currency} {total.toFixed(2)}</td>
                      <td className={ui.tableCell}><button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => removeItem(index)}>Delete</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 border-t border-slate-200 bg-white p-4 text-sm md:grid-cols-4">
            <strong>Subtotal: {invoiceForm.currency} {totals.subtotal.toFixed(2)}</strong>
            <strong>Discount: {invoiceForm.currency} {totals.discountTotal.toFixed(2)}</strong>
            <strong>Tax: {invoiceForm.currency} {totals.taxTotal.toFixed(2)}</strong>
            <strong>Grand Total: {invoiceForm.currency} {totals.grandTotal.toFixed(2)}</strong>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <label className={ui.field}><span>Notes</span><textarea className={ui.textarea} value={invoiceForm.notes || ""} onChange={(event) => patchInvoice("notes", event.target.value)} /></label>
          <label className={ui.field}><span>Terms & Conditions</span><textarea className={ui.textarea} value={invoiceForm.terms || ""} onChange={(event) => patchInvoice("terms", event.target.value)} /></label>
        </div>
      </section>

      <section className={ui.panel}>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <label className={ui.field}>
            Generate invoice for subscription
            <input className={ui.input} value={subscriptionId} onChange={(event) => setSubscriptionId(event.target.value)} placeholder="Mongo subscription id" />
          </label>
          <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={generateInvoice}>Generate & Send</button>
        </div>
      </section>

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Invoice Templates</h3>
            <p className={ui.muted}>Save multiple invoice templates, but keep only one active for automatic purchase invoices.</p>
          </div>
          <label className="flex min-w-[260px] flex-col gap-2 text-sm font-bold text-slate-700">
            Current template name
            <input className={ui.input} value={templateName} onChange={(event) => setTemplateName(event.target.value)} />
          </label>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {templates.map((template) => (
            <div key={template.id} className={`rounded-xl border p-4 ${template.active ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-black text-slate-900">{template.name || "Invoice Template"}</div>
                  <div className="mt-1 text-xs text-slate-500">{template.savedAt ? `Saved ${formatDate(template.savedAt)}` : "Default starter template"}</div>
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <input className={ui.checkbox} type="checkbox" checked={Boolean(template.active)} onChange={() => activateTemplate(template)} />
                  Active
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => activateTemplate(template)}>Use</button>
                <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => duplicateTemplate(template)}>Duplicate</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Editor />

      <section className={ui.tableWrap}>
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 className="text-lg font-bold text-slate-900">Invoice History</h3>
          <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={load}><RefreshIcon size={16} />Refresh</button>
        </div>
        <div className={ui.tableScroll}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th className={ui.tableHead}>Invoice</th>
                <th className={ui.tableHead}>Student</th>
                <th className={ui.tableHead}>Amount</th>
                <th className={ui.tableHead}>Email</th>
                <th className={ui.tableHead}>Issued</th>
                <th className={ui.tableHead}>PDF</th>
                <th className={ui.tableHead}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((item) => (
                <tr key={item.id}>
                  <td className={ui.tableCell}>{item.invoiceNumber}</td>
                  <td className={ui.tableCell}>{item.userName}<div className="text-xs text-slate-500">{item.userEmail || "-"}</div></td>
                  <td className={ui.tableCell}>Rs. {Number(item.amount || 0).toFixed(2)}</td>
                  <td className={ui.tableCell}><span className={ui.pill}>{item.emailStatus || "-"}</span>{item.emailError ? <div className="mt-1 text-xs text-rose-600">{item.emailError}</div> : null}</td>
                  <td className={ui.tableCell}>{formatDate(item.issuedAt || item.createdAt)}</td>
                  <td className={ui.tableCell}>{item.pdfPath ? <a className="font-bold text-sky-700" href={`${apiBase}${item.pdfPath}`} target="_blank" rel="noreferrer">Open</a> : "-"}</td>
                  <td className={ui.tableCell}>
                    <div className="flex flex-wrap gap-2">
                      <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => editInvoice(item)}>Edit</button>
                      <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => duplicateInvoice(item.id)}>Duplicate</button>
                      <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => sendInvoice(item.id)}>Send</button>
                      <button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => deleteInvoice(item.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!invoices.length ? (
                <tr><td className={ui.tableCell} colSpan={7}>No invoices generated yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
