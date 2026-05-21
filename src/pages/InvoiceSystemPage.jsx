import { useEffect, useMemo, useState } from "react";
import { subscriptionService } from "../api/subscriptionService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { RefreshIcon } from "../components/common/AdminIcons";
import { ToggleSwitch } from "../components/forms/ToggleSwitch";
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
  defaultTaxPercent: 0,
  defaultConvenienceChargePercent: 0,
  defaultConvenienceChargeGstPercent: 0,
  items: [{ product: "Premium Subscription", description: "", quantity: 1, price: 0, tax: 0, discount: 0, total: 0 }],
};

const defaultInvoiceHtml = `
<div class="invoice">
  <header class="invoice-header">
    <div>
      <p class="invoice-label">INVOICE</p>
      <h1>Invoice #{{invoice_number}}</h1>
      <p class="invoice-meta">Date: {{invoice_date}}</p>
      <p class="invoice-meta">Due: {{due_date}}</p>
    </div>
    <div class="company-info">
      <strong>{{company_name}}</strong>
      <p>{{company_address}}</p>
      <p>{{customer_email}}</p>
    </div>
  </header>

  <section class="invoice-summary">
    <div>
      <p class="summary-label">Bill To</p>
      <p class="summary-value">{{customer_name}}</p>
      <p>{{customer_email}}</p>
      <p>{{customer_phone}}</p>
    </div>
    <div>
      <p class="summary-label">Total Due</p>
      <p class="summary-value">{{total_amount}}</p>
    </div>
  </section>

  <table class="invoice-table">
    <thead>
      <tr>
        <th>Item</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      {{items}}
    </tbody>
  </table>

  <section class="totals">
    <p>Subtotal: <strong>{{subtotal}}</strong></p>
    <p>Tax: <strong>{{tax}}</strong></p>
    <p>Discount: <strong>{{discount}}</strong></p>
    <p>Total: <strong>{{total_amount}}</strong></p>
  </section>

  <footer class="invoice-footer">
    <p>Thank you for your business!</p>
  </footer>
</div>
`;

const defaultInvoiceCss = `
:root {
  color-scheme: light;
}
body {
  margin: 0;
  min-height: 100vh;
  background: #f3f4f6;
  font-family: Inter, system-ui, sans-serif;
}
.invoice {
  max-width: 900px;
  margin: 24px auto;
  padding: 32px;
  background: #ffffff;
  border-radius: 28px;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.08);
  color: #0f172a;
}
.invoice-header {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 32px;
}
.invoice-label {
  margin: 0 0 8px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #2563eb;
}
h1 {
  margin: 0;
  font-size: 2.2rem;
  letter-spacing: -0.04em;
}
.invoice-meta,
.summary-label {
  margin: 8px 0 0;
  font-size: 0.9rem;
  color: #475569;
}
.company-info {
  text-align: right;
}
.invoice-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
}
.summary-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
}
.summary-value {
  margin: 0.5rem 0 0;
  font-size: 1.1rem;
  font-weight: 700;
}
.invoice-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 32px;
}
.invoice-table th,
.invoice-table td {
  border: 1px solid #e2e8f0;
  padding: 16px;
  text-align: left;
  font-size: 0.95rem;
}
.invoice-table th {
  background: #f8fafc;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.invoice-footer {
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
  color: #475569;
}
.totals {
  display: grid;
  justify-content: end;
  gap: 8px;
  margin-bottom: 32px;
  text-align: right;
}
@media print {
  body {
    background: #ffffff;
  }
  .invoice {
    margin: 0;
    box-shadow: none;
    border-radius: 0;
  }
}
`;

function formatMoney(currency, value) {
  return `${currency || "INR"} ${Number(value || 0).toFixed(2)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildInvoiceTemplateData(invoice, totals) {
  const currency = invoice.currency || "INR";
  const itemRows = (invoice.items || []).map((item) => {
    const taxable = Math.max(0, Number(item.quantity || 0) * Number(item.price || 0) - Number(item.discount || 0));
    const total = taxable + (taxable * Number(item.tax || 0)) / 100;
    return {
      item_name: item.product || item.description || "Item",
      item_description: item.description || "",
      item_quantity: item.quantity || 0,
      item_price: formatMoney(currency, item.price),
      item_tax: `${Number(item.tax || 0)}%`,
      item_discount: formatMoney(currency, item.discount),
      item_total: formatMoney(currency, total),
    };
  });
  const itemsHtml = itemRows.map((item) => `<tr><td>${escapeHtml(item.item_name)}</td><td>${escapeHtml(item.item_quantity)}</td><td>${escapeHtml(item.item_price)}</td><td>${escapeHtml(item.item_total)}</td></tr>`).join("");

  return {
    invoice_number: invoice.invoiceNumber || "INV-DRAFT",
    customer_name: invoice.customerCompany?.name || invoice.userName || "",
    customer_email: invoice.customerCompany?.email || invoice.userEmail || "",
    customer_phone: invoice.customerCompany?.phone || "",
    invoice_date: invoice.invoiceDate || "",
    due_date: invoice.dueDate || "",
    company_name: invoice.billingCompany?.name || "Krita NEET JEE",
    company_address: invoice.billingCompany?.address || "",
    items: itemsHtml,
    subtotal: formatMoney(currency, totals.subtotal),
    tax: formatMoney(currency, totals.taxTotal),
    discount: formatMoney(currency, totals.discountTotal),
    total_amount: formatMoney(currency, totals.grandTotal),
    itemRows,
  };
}

function renderInvoiceHtml(htmlCode, cssCode, invoice, totals) {
  const data = buildInvoiceTemplateData(invoice, totals);
  const loopRendered = String(htmlCode || "").replace(/\{\{#items\}\}([\s\S]*?)\{\{\/items\}\}/g, (_match, inner) => (
    data.itemRows.map((item) => inner.replace(/\{\{\s*([\w_]+)\s*\}\}/g, (__match, key) => escapeHtml(item[key] ?? ""))).join("")
  ));
  const renderedHtml = loopRendered.replace(/\{\{\s*([\w_]+)\s*\}\}/g, (_match, key) => String(data[key] ?? ""));
  return `<!doctype html><html><head><meta charset="utf-8" /><style>${cssCode || ""}</style></head><body>${renderedHtml}</body></html>`;
}


export function InvoiceSystemPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [subscriptionId, setSubscriptionId] = useState("");
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm);
  const [templateName, setTemplateName] = useState("Default Invoice Template");
  const [editorHtml, setEditorHtml] = useState(defaultInvoiceHtml);
  const [editorCss, setEditorCss] = useState(defaultInvoiceCss);
  const [testEmail, setTestEmail] = useState("");
  const [historyFilters, setHistoryFilters] = useState({ q: "", status: "", emailStatus: "", dateFrom: "", dateTo: "" });
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewTemplate, setViewTemplate] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTemplate, setEditorTemplate] = useState(null);
  const [editorFullscreen, setEditorFullscreen] = useState(false);

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
  const livePreviewHtml = useMemo(
    () => renderInvoiceHtml(editorHtml, editorCss, invoiceForm, totals),
    [editorHtml, editorCss, invoiceForm, totals],
  );

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

  function pdfUrl(item) {
    return item?.id ? `${apiBase}/api/admin/invoices/${item.id}/pdf` : item?.pdfPath ? `${apiBase}${item.pdfPath}` : "#";
  }

  async function load(filters = historyFilters) {
    setLoading(true);
    try {
      const [settingsResponse, invoiceResponse] = await Promise.all([
        subscriptionService.getInvoiceSettings(),
        subscriptionService.listInvoices({ limit: 50, ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) }),
      ]);
      const nextSettings = settingsResponse.data || {};
      setSettings(nextSettings);
      setTestEmail((current) => current || nextSettings.companyEmail || nextSettings.smtp?.fromEmail || "");
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

  function openTemplateEditor(template = null) {
    setEditorTemplate(template);
    setTemplateName(template?.name || "New Invoice Template");
    setEditorHtml(template?.htmlCode || defaultInvoiceHtml);
    setEditorCss(template?.cssCode || defaultInvoiceCss);
    setEditorFullscreen(false);
    setEditorOpen(true);
  }

  async function saveTemplate({ setActive = true, saveAsNew = false } = {}) {
    if (!settings) {
      toast.error("Invoice editor is not ready yet");
      return;
    }
    setSaving(true);
    try {
      const currentId = !saveAsNew && editorTemplate?.id && editorTemplate.id !== "default-template" ? editorTemplate.id : `template-${Date.now()}`;
      const name = templateName?.trim() || "Invoice Template";
      const htmlCode = editorHtml || "";
      const cssCode = editorCss || "";
      const templateFields = Array.isArray(editorTemplate?.fields) ? editorTemplate.fields : settings.fields || [];
      const otherBlocks = (settings.reusableBlocks || []).filter((item) => item.type !== "fabric-template" || (item.id && item.id !== currentId));
      const templateBlocks = templates
        .filter((item) => item.id !== "default-template" && item.id !== currentId)
        .map((item) => ({ ...item, active: setActive ? false : Boolean(item.active) }));
      const savedTemplate = { id: currentId, type: "fabric-template", name, active: setActive, savedAt: new Date().toISOString(), htmlCode, cssCode, fields: templateFields };
      const payload = {
        ...settings,
        fields: setActive ? templateFields : settings.fields,
        reusableBlocks: [
          ...otherBlocks.filter((item) => item.type !== "fabric-template"),
          ...templateBlocks,
          savedTemplate,
        ],
        activeTemplateId: setActive ? currentId : settings.activeTemplateId,
        activeTemplateName: setActive ? name : settings.activeTemplateName,
        page: { size: "A4", orientation: "portrait", margin: 32, editor: "invoice-template" },
      };
      const response = await subscriptionService.saveInvoiceSettings(payload);
      setSettings(response.data);
      setEditorTemplate(savedTemplate);
      toast.success(setActive ? "Template saved and set active for invoices" : "Template saved");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveAsNewTemplate() {
    await saveTemplate({ setActive: true, saveAsNew: true });
  }

  async function activateTemplate(template) {
    if (!settings) return;
    const nextBlocks = templates.map((item) => ({ ...item, active: item.id === template.id }));
    try {
      const response = await subscriptionService.saveInvoiceSettings({
        ...settings,
        fields: Array.isArray(template.fields) && template.fields.length ? template.fields : settings.fields,
        activeTemplateId: template.id,
        activeTemplateName: template.name || "Invoice Template",
        reusableBlocks: nextBlocks,
      });
      setSettings(response.data);
      setEditorTemplate(template);
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

  async function deleteTemplate(template) {
    if (!settings || template.id === "default-template") {
      toast.error("The default starter template cannot be deleted");
      return;
    }
    if (!window.confirm(`Delete template "${template.name || "Invoice Template"}"?`)) return;
    const remaining = templates.filter((item) => item.id !== "default-template" && item.id !== template.id);
    const nextBlocks = remaining.length && template.active
      ? remaining.map((item, index) => ({ ...item, active: index === 0 }))
      : remaining;
    try {
      const nextActive = nextBlocks.find((item) => item.active) || nextBlocks[0];
      const response = await subscriptionService.saveInvoiceSettings({
        ...settings,
        fields: nextActive?.fields || settings.fields,
        activeTemplateId: nextActive?.id || "",
        activeTemplateName: nextActive?.name || "",
        reusableBlocks: nextBlocks,
      });
      setSettings(response.data);
      toast.success("Template deleted");
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function viewInvoiceDetails(id) {
    try {
      const response = await subscriptionService.getInvoice(id);
      setSelectedInvoice(response.data);
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
      templateId: activeTemplate?.id && activeTemplate.id !== "default-template" ? activeTemplate.id : settings?.activeTemplateId,
      templateName: activeTemplate?.name || settings?.activeTemplateName,
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

  async function sendTestInvoice() {
    const to = testEmail.trim();
    if (!to) {
      toast.error("Enter an email address for the test invoice");
      return;
    }
    try {
      await subscriptionService.sendTestInvoice({ to });
      toast.success("Test invoice email processed");
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
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Invoices</h2>
            <p className={ui.muted}>Customize the invoice template used after student subscription purchases. Successful purchases already call the backend invoice generation and email flow.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => load()}><RefreshIcon size={16} />Refresh</button>
            <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={() => openTemplateEditor(activeTemplate)}>Open Invoice Pro Editor</button>
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
              {["draft", "pending", "paid", "overdue", "sent", "cancelled"].map((status) => <option key={status}>{status}</option>)}
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
          <label className={ui.field}>
            <span>Default Tax %</span>
            <input
              className={ui.input}
              type="number"
              min="0"
              max="100"
              value={settings?.defaultTaxPercent ?? 0}
              onChange={(event) => setSettings((current) => ({ ...(current || {}), defaultTaxPercent: Number(event.target.value || 0) }))}
            />
          </label>
          <label className={ui.field}>
            <span>Convenience Charge %</span>
            <input
              className={ui.input}
              type="number"
              min="0"
              max="100"
              value={settings?.defaultConvenienceChargePercent ?? 0}
              onChange={(event) => setSettings((current) => ({ ...(current || {}), defaultConvenienceChargePercent: Number(event.target.value || 0) }))}
            />
          </label>
          <label className={ui.field}>
            <span>GST on Charge %</span>
            <input
              className={ui.input}
              type="number"
              min="0"
              max="100"
              value={settings?.defaultConvenienceChargeGstPercent ?? 0}
              onChange={(event) => setSettings((current) => ({ ...(current || {}), defaultConvenienceChargeGstPercent: Number(event.target.value || 0) }))}
            />
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
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <label className={ui.field}>
            Send test invoice
            <input className={ui.input} type="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder="customer@example.com" />
          </label>
          <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={sendTestInvoice}>Send Test Invoice</button>
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
        <div className="mt-4 flex flex-wrap gap-2">
          <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={() => openTemplateEditor(null)}>Create New Template</button>
          <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => openTemplateEditor(activeTemplate)}>Edit Active Template</button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {templates.map((template) => (
            <div key={template.id} className={`rounded-xl border p-4 ${template.active ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-black text-slate-900">{template.name || "Invoice Template"}</div>
                  <div className="mt-1 text-xs text-slate-500">{template.savedAt ? `Saved ${formatDate(template.savedAt)}` : "Default starter template"}</div>
                </div>
                <ToggleSwitch checked={Boolean(template.active)} onChange={() => activateTemplate(template)} label="Active" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => setViewTemplate(template)}>View</button>
                <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => openTemplateEditor(template)}>Edit</button>
                <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => activateTemplate(template)}>Use</button>
                <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => duplicateTemplate(template)}>Duplicate</button>
                <button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => deleteTemplate(template)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={ui.tableWrap}>
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-900">Invoice History</h3>
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => load()}><RefreshIcon size={16} />Refresh</button>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            <input className={ui.input} placeholder="Search invoice, customer, transaction" value={historyFilters.q} onChange={(event) => setHistoryFilters((current) => ({ ...current, q: event.target.value }))} />
            <select className={ui.input} value={historyFilters.status} onChange={(event) => setHistoryFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="">All statuses</option>
              {["draft", "pending", "paid", "overdue"].map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <input className={ui.input} type="date" value={historyFilters.dateFrom} onChange={(event) => setHistoryFilters((current) => ({ ...current, dateFrom: event.target.value }))} />
            <input className={ui.input} type="date" value={historyFilters.dateTo} onChange={(event) => setHistoryFilters((current) => ({ ...current, dateTo: event.target.value }))} />
            <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={() => load(historyFilters)}>Search / Filter</button>
          </div>
        </div>
        <div className={ui.tableScroll}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th className={ui.tableHead}>Invoice</th>
                <th className={ui.tableHead}>Student</th>
                <th className={ui.tableHead}>Subtotal</th>
                <th className={ui.tableHead}>Discount</th>
                <th className={ui.tableHead}>Tax</th>
                <th className={ui.tableHead}>Charges</th>
                <th className={ui.tableHead}>GST on Charges</th>
                <th className={ui.tableHead}>Total</th>
                <th className={ui.tableHead}>Status</th>
                <th className={ui.tableHead}>Email</th>
                <th className={ui.tableHead}>Created</th>
                <th className={ui.tableHead}>Payment</th>
                <th className={ui.tableHead}>PDF</th>
                <th className={ui.tableHead}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((item) => (
                <tr key={item.id}>
                  <td className={ui.tableCell}>{item.invoiceNumber}</td>
                  <td className={ui.tableCell}>{item.userName}<div className="text-xs text-slate-500">{item.userEmail || "-"}</div></td>
                  <td className={ui.tableCell}>{item.currency || "INR"} {Number(item.subtotal || 0).toFixed(2)}</td>
                  <td className={ui.tableCell}>{item.currency || "INR"} {Number(item.discountTotal || 0).toFixed(2)}</td>
                  <td className={ui.tableCell}>{item.currency || "INR"} {Number(item.taxTotal || 0).toFixed(2)}</td>
                  <td className={ui.tableCell}>{item.currency || "INR"} {Number(item.convenienceCharge || 0).toFixed(2)}</td>
                  <td className={ui.tableCell}>{item.currency || "INR"} {Number(item.convenienceChargeGst || 0).toFixed(2)}</td>
                  <td className={ui.tableCell}>{item.currency || "INR"} {Number(item.grandTotal || item.amount || 0).toFixed(2)}</td>
                  <td className={ui.tableCell}><span className={ui.pill}>{item.status || "draft"}</span></td>
                  <td className={ui.tableCell}><span className={ui.pill}>{item.emailStatus || "-"}</span>{item.emailError ? <div className="mt-1 text-xs text-rose-600">{item.emailError}</div> : null}</td>
                  <td className={ui.tableCell}>{formatDate(item.createdAt || item.issuedAt)}</td>
                  <td className={ui.tableCell}>{item.paymentHistory?.length ? `${item.paymentHistory.length} record(s)` : "-"}</td>
                  <td className={ui.tableCell}><a className="font-bold text-sky-700" href={pdfUrl(item)} target="_blank" rel="noreferrer">Download</a></td>
                  <td className={ui.tableCell}>
                    <div className="flex flex-wrap gap-2">
                      <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => viewInvoiceDetails(item.id)}>View</button>
                      <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => editInvoice(item)}>Edit</button>
                      <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => duplicateInvoice(item.id)}>Duplicate</button>
                      <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => sendInvoice(item.id)}>Resend</button>
                      <button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => deleteInvoice(item.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!invoices.length ? (
                <tr><td className={ui.tableCell} colSpan={14}>No invoices generated yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
      {editorOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-2 sm:p-4">
          <div className={`flex flex-col overflow-hidden bg-white shadow-2xl ${editorFullscreen ? "fixed inset-0 max-h-none w-screen max-w-none rounded-none" : "max-h-[96vh] w-full max-w-[1500px] rounded-xl"}`}>
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className={ui.eyebrow}>Invoice Pro Template Editor</div>
                <h3 className="text-2xl font-black tracking-tight text-slate-900">{editorTemplate ? "Edit Template" : "Create Template"}</h3>
                <p className={ui.muted}>Use Mapping to place invoice fields, then double-click text on the canvas or use Text Content to edit letters, words, and tokens.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-[260px_auto_auto_auto_auto_auto] sm:items-center">
                <input className={ui.input} value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="Template name" />
                <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => saveTemplate({ setActive: false })} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
                <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={saveAsNewTemplate} disabled={saving}>Save as New</button>
                <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={() => saveTemplate({ setActive: true })} disabled={saving}>{saving ? "Saving..." : "Save & Set Active"}</button>
                <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => setEditorFullscreen((current) => !current)}>{editorFullscreen ? "Exit Full Screen" : "Full Screen"}</button>
                <button className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => setEditorOpen(false)}>Close</button>
              </div>
            </div>
            <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
              <div className="grid min-h-0 grid-rows-2 border-r border-slate-200">
                <label className="flex min-h-0 flex-col border-b border-slate-200">
                  <span className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">HTML</span>
                  <textarea
                    className="min-h-0 flex-1 resize-none border-0 bg-slate-950 p-4 font-mono text-sm text-slate-50 outline-none"
                    spellCheck={false}
                    value={editorHtml}
                    onChange={(event) => setEditorHtml(event.target.value)}
                  />
                </label>
                <label className="flex min-h-0 flex-col">
                  <span className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">CSS</span>
                  <textarea
                    className="min-h-0 flex-1 resize-none border-0 bg-slate-900 p-4 font-mono text-sm text-slate-50 outline-none"
                    spellCheck={false}
                    value={editorCss}
                    onChange={(event) => setEditorCss(event.target.value)}
                  />
                </label>
              </div>
              <div className="flex min-h-0 flex-col bg-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Live Preview</span>
                  <span className="text-xs font-semibold text-slate-500">Supports {"{{invoice_number}}"}, {"{{customer_name}}"}, {"{{items}}"}, {"{{total_amount}}"}</span>
                </div>
                <iframe
                  title="Invoice live preview"
                  sandbox=""
                  className="min-h-0 flex-1 border-0 bg-white"
                  srcDoc={livePreviewHtml}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {selectedInvoice ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-xl bg-white p-5 shadow-2xl">
            <div className={ui.sectionHead}>
              <div><h3 className="text-xl font-black text-slate-900">Invoice Details</h3><p className={ui.muted}>{selectedInvoice.invoiceNumber} | {selectedInvoice.templateName || "Active template"}</p></div>
              <button className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => setSelectedInvoice(null)}>Close</button>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <div className={ui.tile}><div className={ui.metricLabel}>Status</div><div className="mt-2 font-black capitalize">{selectedInvoice.status}</div></div>
              <div className={ui.tile}><div className={ui.metricLabel}>Discount</div><div className="mt-2 font-black">{selectedInvoice.currency} {Number(selectedInvoice.discountTotal || 0).toFixed(2)}</div></div>
              <div className={ui.tile}><div className={ui.metricLabel}>Tax</div><div className="mt-2 font-black">{selectedInvoice.currency} {Number(selectedInvoice.taxTotal || 0).toFixed(2)}</div></div>
              <div className={ui.tile}><div className={ui.metricLabel}>Charges</div><div className="mt-2 font-black">{selectedInvoice.currency} {Number(selectedInvoice.convenienceCharge || 0).toFixed(2)}</div></div>
              <div className={ui.tile}><div className={ui.metricLabel}>GST on Charges</div><div className="mt-2 font-black">{selectedInvoice.currency} {Number(selectedInvoice.convenienceChargeGst || 0).toFixed(2)}</div></div>
              <div className={ui.tile}><div className={ui.metricLabel}>Total</div><div className="mt-2 font-black">{selectedInvoice.currency} {Number(selectedInvoice.grandTotal || selectedInvoice.amount || 0).toFixed(2)}</div></div>
              <div className={ui.tile}><div className={ui.metricLabel}>Created</div><div className="mt-2 font-black">{formatDate(selectedInvoice.createdAt)}</div></div>
              <div className={ui.tile}><div className={ui.metricLabel}>Email</div><div className="mt-2 font-black capitalize">{selectedInvoice.emailStatus || "-"}</div></div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className={ui.panel}><h4 className="font-black text-slate-900">Customer</h4><p className="mt-2 text-sm text-slate-600">{selectedInvoice.userName || "-"}</p><p className="text-sm text-slate-600">{selectedInvoice.userEmail || "-"}</p></div>
              <div className={ui.panel}><h4 className="font-black text-slate-900">Payment History</h4>{selectedInvoice.paymentHistory?.length ? selectedInvoice.paymentHistory.map((payment, index) => <p className="mt-2 text-sm text-slate-600" key={index}>{formatDate(payment.paidAt)} | {payment.status} | {selectedInvoice.currency} {Number(payment.amount || 0).toFixed(2)} | {payment.transactionId || "-"}</p>) : <p className="mt-2 text-sm text-slate-500">No payment history recorded.</p>}</div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <a className={cn(ui.buttonBase, ui.buttonPrimary)} href={pdfUrl(selectedInvoice)} target="_blank" rel="noreferrer">Download PDF</a>
              <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => sendInvoice(selectedInvoice.id)}>Resend to Customer</button>
            </div>
          </div>
        </div>
      ) : null}
      {viewTemplate ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-2xl">
            <div className={ui.sectionHead}>
              <div><h3 className="text-xl font-black text-slate-900">View Template</h3><p className={ui.muted}>{viewTemplate.name || "Invoice Template"}</p></div>
              <button className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => setViewTemplate(null)}>Close</button>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className={ui.tile}><div className={ui.metricLabel}>Status</div><div className="mt-2 font-black">{viewTemplate.active ? "Active" : "Inactive"}</div></div>
              <div className={ui.tile}><div className={ui.metricLabel}>Saved</div><div className="mt-2 font-black">{viewTemplate.savedAt ? formatDate(viewTemplate.savedAt) : "Starter"}</div></div>
              <div className={ui.tile}><div className={ui.metricLabel}>Fields</div><div className="mt-2 font-black">{viewTemplate.fields?.length || 0}</div></div>
              <div className={ui.tile}><div className={ui.metricLabel}>Auto Apply</div><div className="mt-2 font-black">{viewTemplate.active ? "Enabled" : "Set active to apply"}</div></div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={() => { activateTemplate(viewTemplate); setViewTemplate(null); }}>Set Active Template</button>
              <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => duplicateTemplate(viewTemplate)}>Save as New Template</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
