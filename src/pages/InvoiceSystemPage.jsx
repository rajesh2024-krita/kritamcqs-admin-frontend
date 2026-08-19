import { useEffect, useMemo, useState } from "react";
import { subscriptionService } from "../api/subscriptionService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { RefreshIcon } from "../components/common/AdminIcons";
import { ToggleSwitch } from "../components/forms/ToggleSwitch";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";
import { formatDate } from "../utils/format";
import { InvoiceBuilderModal } from "../components/invoice-builder/InvoiceBuilderModal";
import { 
  FileText, 
  Plus, 
  Save, 
  RefreshCw, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Copy, 
  Send, 
  Mail, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  Percent, 
  Building, 
  User, 
  Calendar, 
  CreditCard,
  Shield,
  Printer,
  Settings,
  Layout,
  // Template,
  Zap,
  LinkIcon,
  Search,
  X,
  PartyPopperIcon
} from "lucide-react";

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
  const connectedTemplate = useMemo(() => {
    return templates.find((item) => item.connected && item.id === settings?.connectedTemplateId)
      || templates.find((item) => item.id === settings?.connectedTemplateId)
      || templates.find((item) => item.connected)
      || null;
  }, [templates, settings?.connectedTemplateId]);
  const invoiceEmailConnected = Boolean(connectedTemplate?.id && connectedTemplate.id !== "default-template");

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

  async function saveTemplate({ setActive = true, saveAsNew = false, htmlCode, cssCode } = {}) {
    if (!settings) {
      toast.error("Invoice editor is not ready yet");
      return;
    }
    setSaving(true);
    try {
      const currentId = !saveAsNew && editorTemplate?.id && editorTemplate.id !== "default-template" ? editorTemplate.id : `template-${Date.now()}`;
      const name = templateName?.trim() || "Invoice Template";
      const finalHtml = htmlCode ?? editorHtml ?? "";
      const finalCss = cssCode ?? editorCss ?? "";
      const templateFields = Array.isArray(editorTemplate?.fields) ? editorTemplate.fields : settings.fields || [];
      const otherBlocks = (settings.reusableBlocks || []).filter((item) => item.type !== "fabric-template" || (item.id && item.id !== currentId));
      const templateBlocks = templates
        .filter((item) => item.id !== "default-template" && item.id !== currentId)
        .map((item) => ({ ...item, active: setActive ? false : Boolean(item.active) }));
      const isConnectedTemplate = settings.connectedTemplateId === currentId || editorTemplate?.connected;
      const savedTemplate = { id: currentId, type: "fabric-template", name, active: setActive, connected: isConnectedTemplate, connectedAt: isConnectedTemplate ? (editorTemplate?.connectedAt || settings.connectedTemplateAt || new Date().toISOString()) : undefined, savedAt: new Date().toISOString(), htmlCode: finalHtml, cssCode: finalCss, fields: templateFields };
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
        connectedTemplateId: isConnectedTemplate ? currentId : settings.connectedTemplateId,
        connectedTemplateName: isConnectedTemplate ? name : settings.connectedTemplateName,
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

  async function connectTemplateToEmail(template) {
    if (!template?.id || template.id === "default-template") {
      toast.error("Save an Invoice Editor template before connecting it to email");
      return;
    }
    if (!String(template.htmlCode || "").trim() || !String(template.cssCode || "").trim()) {
      toast.error("Template must include Invoice Editor HTML and CSS before connecting");
      return;
    }
    try {
      const response = await subscriptionService.connectInvoiceTemplate(template.id);
      setSettings(response.data);
      setEditorTemplate((current) => current?.id === template.id ? { ...current, connected: true } : current);
      toast.success("Successfully Connected");
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
    if (!invoiceEmailConnected) {
      toast.error("Connect an invoice template to email before sending");
      return;
    }
    try {
      await subscriptionService.sendInvoice(id);
      toast.success("Invoice email processed with the connected template");
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function sendTestInvoice() {
    if (!invoiceEmailConnected) {
      toast.error("Connect an invoice template to email before sending a test invoice");
      return;
    }
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

  // Compact input classes
  const compactInput = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
  const compactSelect = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none";
  const compactTextarea = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y min-h-[50px]";

  if (loading) return <LoadingSpinner label="Loading invoice system..." />;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200/60 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25">
              <FileText size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Invoice System</h1>
              <p className="text-sm text-slate-500">Manage student invoices and templates</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[9px] font-medium text-slate-700 rounded transition-colors" onClick={() => load()}><RefreshCw size={10} /> Refresh</button>
            <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-[9px] font-medium rounded-lg transition-all shadow-sm shadow-indigo-500/25" onClick={() => openTemplateEditor(activeTemplate)}>
              <Layout size={10} /> Template Editor
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Total Invoices", value: invoiceStats.total, icon: FileText, color: "blue" },
          { label: "Sent", value: invoiceStats.sent, icon: Mail, color: "emerald" },
          { label: "Pending", value: invoiceStats.pending, icon: Clock, color: "amber" },
          { label: "Failed", value: invoiceStats.failed, icon: AlertCircle, color: "rose" },
        ].map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: "bg-blue-50 text-blue-600",
            emerald: "bg-emerald-50 text-emerald-600",
            amber: "bg-amber-50 text-amber-600",
            rose: "bg-rose-50 text-rose-600",
          };
          return (
            <div key={stat.label} className="bg-white rounded-lg border border-slate-200/60 px-3 py-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <div className={`p-1 rounded ${colorClasses[stat.color]}`}>
                  <Icon size={12} className={colorClasses[stat.color]} />
                </div>
              </div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Connection Status */}
      <div className={cn(
        "rounded-lg border px-3 py-1.5 flex flex-wrap items-center justify-between gap-2",
        invoiceEmailConnected ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
      )}>
        <div className="flex items-center gap-2">
          {invoiceEmailConnected ? (
            <CheckCircle size={14} className="text-emerald-600" />
          ) : (
            <AlertCircle size={14} className="text-amber-600" />
          )}
          <span className="text-[10px] font-medium">
            {invoiceEmailConnected ? "Invoice email connected" : "Invoice email not connected"}
          </span>
        </div>
        <span className={cn(
          "inline-flex px-1.5 py-0.5 rounded text-[7px] font-medium",
          invoiceEmailConnected ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
        )}>
          {invoiceEmailConnected ? "Connected" : "Action Required"}
        </span>
      </div>

      {/* Create/Edit Invoice */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Edit size={14} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Create / Edit Invoice</h3>
          </div>
          <div className="flex flex-wrap gap-1">
            <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[8px] font-medium text-slate-700 rounded transition-colors" onClick={() => setInvoiceForm(emptyInvoiceForm)}>
              <Plus size={9} /> New
            </button>
            <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[8px] font-medium text-slate-700 rounded transition-colors" onClick={() => saveInvoice("draft")}>
              <Save size={9} /> Draft
            </button>
            <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-[8px] font-medium rounded-lg transition-all shadow-sm shadow-indigo-500/25" onClick={() => saveInvoice(invoiceForm.status)}>
              <Save size={9} /> Save
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-1.5 mt-2 sm:grid-cols-3">
          {[
            ["billingCompany.name", "Billing Company"],
            ["billingCompany.email", "Billing Email"],
            ["billingCompany.phone", "Billing Phone"],
            ["billingCompany.gstin", "Billing GSTIN"],
            ["customerCompany.name", "Customer Name"],
            ["customerCompany.email", "Customer Email"],
            ["customerCompany.phone", "Customer Phone"],
            ["customerCompany.gstin", "Customer GSTIN"],
            ["invoiceNumber", "Invoice Number"],
            ["invoiceDate", "Invoice Date"],
            ["dueDate", "Due Date"],
            ["transactionId", "Transaction ID"],
            ["logoUrl", "Logo URL"],
            ["signatureUrl", "Signature URL"],
            ["qrCode", "QR Code"],
          ].map(([key, label]) => (
            <div key={key} className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">{label}</label>
              <input className={compactInput} type={key.toLowerCase().includes("date") ? "date" : "text"} value={key.includes(".") ? invoiceForm[key.split(".")[0]]?.[key.split(".")[1]] || "" : invoiceForm[key] || ""} onChange={(event) => patchInvoice(key, event.target.value)} />
            </div>
          ))}
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Status</label>
            <select className={compactSelect} value={invoiceForm.status} onChange={(event) => patchInvoice("status", event.target.value)}>
              {["draft", "pending", "paid", "overdue", "sent", "cancelled"].map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Currency</label>
            <select className={compactSelect} value={invoiceForm.currency} onChange={(event) => patchInvoice("currency", event.target.value)}>
              {["₹", "$", "€", "£", "د.إ"].map((currency) => <option key={currency}>{currency}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Tax Type</label>
            <input className={compactInput} value={invoiceForm.taxDetails.gstType || ""} onChange={(event) => patchInvoice("taxDetails.gstType", event.target.value)} />
          </div>
          <div className="flex flex-col gap-0.5 sm:col-span-3">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Billing Address</label>
            <textarea className={compactTextarea} rows={2} value={invoiceForm.billingCompany.address || ""} onChange={(event) => patchInvoice("billingCompany.address", event.target.value)} />
          </div>
          <div className="flex flex-col gap-0.5 sm:col-span-3">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Customer Address</label>
            <textarea className={compactTextarea} rows={2} value={invoiceForm.customerCompany.address || ""} onChange={(event) => patchInvoice("customerCompany.address", event.target.value)} />
          </div>
        </div>

        {/* Items Table */}
        <div className="mt-3 rounded-lg border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 border-b border-slate-200">
            <span className="text-[8px] font-medium text-slate-600">Items</span>
            <button className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-[8px] font-medium text-slate-700 rounded transition-colors" onClick={addItem}>
              <Plus size={9} /> Add Row
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50">
                <tr>
                  {["Product", "Description", "Qty", "Price", "Discount", "Tax %", "Total", ""].map((head) => (
                    <th key={head} className="px-1.5 py-1 text-left text-[7px] font-bold uppercase tracking-wider text-slate-400">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoiceForm.items.map((item, index) => {
                  const taxable = Math.max(0, Number(item.quantity || 0) * Number(item.price || 0) - Number(item.discount || 0));
                  const total = taxable + (taxable * Number(item.tax || 0)) / 100;
                  return (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                      {["product", "description", "quantity", "price", "discount", "tax"].map((key) => (
                        <td key={key} className="px-1.5 py-1">
                          <input className={compactInput} type={["quantity", "price", "discount", "tax"].includes(key) ? "number" : "text"} value={item[key] || ""} onChange={(event) => patchItem(index, key, event.target.value)} />
                        </td>
                      ))}
                      <td className="px-1.5 py-1 font-medium text-slate-700">{invoiceForm.currency} {total.toFixed(2)}</td>
                      <td className="px-1.5 py-1">
                        <button className="inline-flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-colors" onClick={() => removeItem(index)}>
                          <Trash2 size={10} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 gap-1 border-t border-slate-200 bg-white p-2 sm:grid-cols-4">
            <div className="text-[9px]"><span className="text-slate-500">Subtotal:</span> <strong>{invoiceForm.currency} {totals.subtotal.toFixed(2)}</strong></div>
            <div className="text-[9px]"><span className="text-slate-500">Discount:</span> <strong>{invoiceForm.currency} {totals.discountTotal.toFixed(2)}</strong></div>
            <div className="text-[9px]"><span className="text-slate-500">Tax:</span> <strong>{invoiceForm.currency} {totals.taxTotal.toFixed(2)}</strong></div>
            <div className="text-[9px]"><span className="text-slate-500">Grand Total:</span> <strong className="text-indigo-600">{invoiceForm.currency} {totals.grandTotal.toFixed(2)}</strong></div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-1.5 mt-2 sm:grid-cols-2">
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Notes</label>
            <textarea className={compactTextarea} rows={2} value={invoiceForm.notes || ""} onChange={(event) => patchInvoice("notes", event.target.value)} />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Terms</label>
            <textarea className={compactTextarea} rows={2} value={invoiceForm.terms || ""} onChange={(event) => patchInvoice("terms", event.target.value)} />
          </div>
        </div>
      </div>

      {/* Generate & Send */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Generate for Subscription</label>
            <div className="flex gap-1">
              <input className={cn(compactInput, "flex-1")} value={subscriptionId} onChange={(event) => setSubscriptionId(event.target.value)} placeholder="Subscription ID" />
              <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[8px] font-medium text-slate-700 rounded transition-colors" onClick={generateInvoice}>
                <Zap size={9} /> Generate
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Send Test Invoice</label>
            <div className="flex gap-1">
              <input className={cn(compactInput, "flex-1")} type="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder="customer@example.com" />
              <button className={cn(
                "inline-flex items-center gap-0.5 px-2 py-0.5 text-[8px] font-medium rounded transition-colors",
                invoiceEmailConnected ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )} onClick={sendTestInvoice} disabled={!invoiceEmailConnected}>
                <Send size={9} /> Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Templates */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <PartyPopperIcon size={14} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Invoice Templates</h3>
            <span className="text-[8px] text-slate-400">({templates.length})</span>
          </div>
          <div className="flex gap-1">
            <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[8px] font-medium text-slate-700 rounded transition-colors" onClick={() => openTemplateEditor(null)}>
              <Plus size={9} /> New
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-1.5 mt-2 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((template) => {
            const isConnected = template.id === connectedTemplate?.id;
            const isActive = Boolean(template.active);
            return (
              <div key={template.id} className={cn(
                "rounded-lg border p-2.5 transition-all",
                isConnected ? "border-emerald-200 bg-emerald-50" : isActive ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white hover:border-slate-300"
              )}>
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <div className="text-[9px] font-semibold text-slate-900 truncate">{template.name || "Template"}</div>
                    <div className="text-[7px] text-slate-400">{template.savedAt ? formatDate(template.savedAt) : "Default"}</div>
                  </div>
                  <div className="flex gap-0.5">
                    <button className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors" onClick={() => setViewTemplate(template)}>
                      <Eye size={10} />
                    </button>
                    <button className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors" onClick={() => openTemplateEditor(template)}>
                      <Edit size={10} />
                    </button>
                    <button className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors" onClick={() => duplicateTemplate(template)}>
                      <Copy size={10} />
                    </button>
                    {template.id !== "default-template" && (
                      <button className="p-0.5 text-rose-400 hover:text-rose-600 rounded transition-colors" onClick={() => deleteTemplate(template)}>
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-0.5 mt-1">
                  <span className={cn(
                    "inline-flex px-1 py-0.5 rounded text-[6px] font-medium",
                    isActive ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
                  )}>
                    {isActive ? "Active" : "Inactive"}
                  </span>
                  {isConnected && (
                    <span className="inline-flex px-1 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[6px] font-medium">
                      <CheckCircle size={8} className="inline mr-0.5" /> Connected
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoice History */}
      <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText size={12} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Invoice History</h3>
            <span className="text-[8px] text-slate-400">({invoices.length})</span>
          </div>
          <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[8px] font-medium text-slate-700 rounded transition-colors" onClick={() => load()}>
            <RefreshCw size={9} /> Refresh
          </button>
        </div>

        <div className="px-2.5 py-1.5 border-b border-slate-100 grid grid-cols-2 gap-1 sm:grid-cols-5">
          <input className={compactInput} placeholder="Search..." value={historyFilters.q} onChange={(event) => setHistoryFilters((current) => ({ ...current, q: event.target.value }))} />
          <select className={compactSelect} value={historyFilters.status} onChange={(event) => setHistoryFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="">All statuses</option>
            {["draft", "pending", "paid", "overdue"].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <input className={compactInput} type="date" value={historyFilters.dateFrom} onChange={(event) => setHistoryFilters((current) => ({ ...current, dateFrom: event.target.value }))} />
          <input className={compactInput} type="date" value={historyFilters.dateTo} onChange={(event) => setHistoryFilters((current) => ({ ...current, dateTo: event.target.value }))} />
          <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[8px] font-medium rounded transition-colors" onClick={() => load(historyFilters)}>
            <Search size={9} /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                {["Invoice", "Customer", "Total", "Status", "Email", "Created", "Actions"].map((x) => (
                  <th key={x} className="px-2 py-1 text-left">
                    <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">{x}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-2 py-1.5">
                    <div className="text-[10px] font-semibold text-slate-900">{item.invoiceNumber}</div>
                    <div className="text-[8px] text-slate-400">{item.transactionId || "-"}</div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="text-[9px] text-slate-700">{item.userName || "-"}</div>
                    <div className="text-[7px] text-slate-400">{item.userEmail || "-"}</div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="text-[10px] font-bold text-slate-900">{item.currency || "INR"} {Number(item.grandTotal || item.amount || 0).toFixed(2)}</div>
                  </td>
                  <td className="px-2 py-1.5">
                    <span className={cn(
                      "inline-flex px-1.5 py-0.5 rounded text-[7px] font-medium",
                      item.status === "paid" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                      item.status === "pending" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                      item.status === "overdue" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                      "bg-slate-100 text-slate-600 border border-slate-200"
                    )}>
                      {item.status || "draft"}
                    </span>
                  </td>
                  <td className="px-2 py-1.5">
                    <span className={cn(
                      "inline-flex px-1.5 py-0.5 rounded text-[7px] font-medium",
                      item.emailStatus === "sent" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                      item.emailStatus === "failed" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                      "bg-slate-100 text-slate-600 border border-slate-200"
                    )}>
                      {item.emailStatus || "-"}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-[7px] text-slate-400">{formatDate(item.createdAt || item.issuedAt)}</td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-0.5">
                      <button className="p-0.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" onClick={() => viewInvoiceDetails(item.id)}>
                        <Eye size={10} />
                      </button>
                      <button className="p-0.5 text-slate-600 hover:bg-slate-50 rounded transition-colors" onClick={() => editInvoice(item)}>
                        <Edit size={10} />
                      </button>
                      <button className="p-0.5 text-slate-600 hover:bg-slate-50 rounded transition-colors" onClick={() => duplicateInvoice(item.id)}>
                        <Copy size={10} />
                      </button>
                      <a className="p-0.5 text-slate-600 hover:bg-slate-50 rounded transition-colors" href={pdfUrl(item)} target="_blank" rel="noreferrer">
                        <Download size={10} />
                      </a>
                      <button className="p-0.5 text-rose-600 hover:bg-rose-50 rounded transition-colors" onClick={() => deleteInvoice(item.id)}>
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!invoices.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <FileText size={16} className="text-slate-300" />
                      <span className="text-[10px] text-slate-500">No invoices generated yet</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Template Editor Modal */}
      {editorOpen && (
        <InvoiceBuilderModal
          templateName={templateName}
          onTemplateNameChange={setTemplateName}
          editorTemplate={editorTemplate}
          initialHtml={editorHtml}
          initialCss={editorCss}
          invoiceForm={invoiceForm}
          totals={totals}
          fullscreen={editorFullscreen}
          onFullscreenChange={setEditorFullscreen}
          saving={saving}
          onSave={(data) => saveTemplate({ setActive: false, htmlCode: data.htmlCode, cssCode: data.cssCode })}
          onSaveAsNew={(data) => saveTemplate({ setActive: true, saveAsNew: true, htmlCode: data.htmlCode, cssCode: data.cssCode })}
          onSaveAndActivate={(data) => saveTemplate({ setActive: true, htmlCode: data.htmlCode, cssCode: data.cssCode })}
          onClose={() => setEditorOpen(false)}
        />
      )}

      {/* View Template Modal */}
      {viewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onClick={() => setViewTemplate(null)}>
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-2xl shadow-slate-950/30 w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-2.5 border-b border-slate-200/60 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">{viewTemplate.name || "Template"}</h3>
              <button className="p-1 rounded-lg hover:bg-slate-100 transition-colors" onClick={() => setViewTemplate(null)}>
                <X size={14} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 rounded-lg p-2">
                  <span className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Status</span>
                  <div className="text-[10px] font-semibold text-slate-900">{viewTemplate.active ? "Active" : "Inactive"}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <span className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Saved</span>
                  <div className="text-[10px] font-semibold text-slate-900">{viewTemplate.savedAt ? formatDate(viewTemplate.savedAt) : "Starter"}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[8px] font-medium rounded transition-colors" onClick={() => { activateTemplate(viewTemplate); setViewTemplate(null); }}>
                  <CheckCircle size={9} /> Set Active
                </button>
                <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[8px] font-medium rounded transition-colors" onClick={() => { connectTemplateToEmail(viewTemplate); setViewTemplate(null); }}>
                  <LinkIcon size={9} /> Connect
                </button>
                <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[8px] font-medium text-slate-700 rounded transition-colors" onClick={() => duplicateTemplate(viewTemplate)}>
                  <Copy size={9} /> Duplicate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onClick={() => setSelectedInvoice(null)}>
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-2xl shadow-slate-950/30 w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-2.5 border-b border-slate-200/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{selectedInvoice.invoiceNumber}</h3>
                <p className="text-[9px] text-slate-500">{selectedInvoice.templateName || "Active template"}</p>
              </div>
              <button className="p-1 rounded-lg hover:bg-slate-100 transition-colors" onClick={() => setSelectedInvoice(null)}>
                <X size={14} />
              </button>
            </div>
            <div className="overflow-y-auto p-4 max-h-[calc(90vh-64px)] space-y-3">
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {[
                  ["Status", selectedInvoice.status],
                  ["Total", `${selectedInvoice.currency} ${Number(selectedInvoice.grandTotal || selectedInvoice.amount || 0).toFixed(2)}`],
                  ["Created", formatDate(selectedInvoice.createdAt)],
                  ["Email", selectedInvoice.emailStatus || "-"],
                ].map(([label, value]) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-2">
                    <span className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">{label}</span>
                    <div className="text-[10px] font-semibold text-slate-900 truncate">{value}</div>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 rounded-lg p-2">
                <span className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Customer</span>
                <div className="text-[9px] text-slate-700">{selectedInvoice.userName || "-"}</div>
                <div className="text-[8px] text-slate-400">{selectedInvoice.userEmail || "-"}</div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <a className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[8px] font-medium rounded transition-colors" href={pdfUrl(selectedInvoice)} target="_blank" rel="noreferrer">
                  <Download size={9} /> PDF
                </a>
                <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[8px] font-medium rounded transition-colors" onClick={() => sendInvoice(selectedInvoice.id)}>
                  <Send size={9} /> Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}