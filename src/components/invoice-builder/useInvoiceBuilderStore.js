/**
 * Bridged Zustand store for the Invoice Pro Editor.
 * Does NOT use persist middleware — the parent InvoiceSystemPage controls save/load via API.
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { DEFAULT_INVOICE_HTML, DEFAULT_INVOICE_CSS } from './invoiceTemplates';

/**
 * Mapping variables shown in the VariableMapper accordion.
 */
export const MAPPING_VARIABLES = [
  { key: '{{customer_name}}', label: 'Customer Name', description: 'Full name of the customer', example: 'John Doe' },
  { key: '{{customer_email}}', label: 'Customer Email', description: 'Email address of the customer', example: 'john@example.com' },
  { key: '{{customer_address}}', label: 'Customer Address', description: 'Billing/shipping address', example: '123 Main St, New York, NY 10001' },
  { key: '{{customer_phone}}', label: 'Customer Phone', description: 'Phone number', example: '+1 (555) 123-4567' },
  { key: '{{invoice_number}}', label: 'Invoice Number', description: 'Unique invoice identifier', example: 'INV-20240521-001' },
  { key: '{{invoice_date}}', label: 'Invoice Date', description: 'Date of invoice issuance', example: 'May 21, 2024' },
  { key: '{{due_date}}', label: 'Due Date', description: 'Payment due date', example: 'June 5, 2024' },
  { key: '{{company_name}}', label: 'Company Name', description: 'Your company/business name', example: 'Acme Inc.' },
  { key: '{{company_address}}', label: 'Company Address', description: 'Your business address', example: '456 Business Ave, Suite 100, NY' },
  { key: '{{company_email}}', label: 'Company Email', description: 'Your business email', example: 'billing@acme.com' },
  { key: '{{company_phone}}', label: 'Company Phone', description: 'Your business phone', example: '+1 (555) 987-6543' },
  { key: '{{company_logo}}', label: 'Company Logo URL', description: 'URL or data URL for company logo', example: 'https://example.com/logo.png' },
  { key: '{{description}}', label: 'Description', description: 'First invoice item description', example: 'Premium subscription purchase' },
  { key: '{{quantity}}', label: 'Quantity', description: 'First invoice item quantity', example: '1' },
  { key: '{{amount}}', label: 'Amount', description: 'Invoice payable amount', example: 'INR 1,000.00' },
  { key: '{{item_amount}}', label: 'Item Amount', description: 'First invoice item price', example: 'INR 1,000.00' },
  { key: '{{subtotal}}', label: 'Subtotal', description: 'Sum before tax & discount', example: '$1,000.00' },
  { key: '{{base_amount}}', label: 'Base Amount', description: 'Amount before discount, GST, and charges', example: 'INR 1,000.00' },
  { key: '{{tax_rate}}', label: 'Tax Rate', description: 'Tax percentage', example: '10%' },
  { key: '{{tax_amount}}', label: 'Tax Amount', description: 'Calculated tax', example: '$100.00' },
  { key: '{{gst}}', label: 'GST', description: 'GST/tax amount', example: 'INR 180.00' },
  { key: '{{gst_rate}}', label: 'GST Rate', description: 'GST/tax percentage', example: '18%' },
  { key: '{{discount}}', label: 'Discount', description: 'Discount amount', example: '$50.00' },
  { key: '{{discount_amount}}', label: 'Discount Amount', description: 'Total invoice discount', example: 'INR 100.00' },
  { key: '{{transaction_id}}', label: 'Transaction ID', description: 'Payment transaction/reference id', example: 'pay_Nabc123' },
  { key: '{{platform_charge}}', label: 'Platform Charge', description: 'Convenience/platform charge', example: 'INR 20.00' },
  { key: '{{platform_charge_gst}}', label: 'Platform Charge GST', description: 'GST on platform/convenience charge', example: 'INR 3.60' },
  { key: '{{total_charges}}', label: 'Total Charges', description: 'Platform charge plus GST', example: 'INR 23.60' },
  { key: '{{total_amount}}', label: 'Total Amount', description: 'Final payable amount', example: '$1,050.00' },
  { key: '{{total}}', label: 'Total', description: 'Final payable amount', example: 'INR 1,203.60' },
  { key: '{{currency}}', label: 'Currency', description: 'Currency symbol/code', example: 'USD' },
  { key: '{{payment_terms}}', label: 'Payment Terms', description: 'Terms of payment', example: 'Net 15 Days' },
  { key: '{{notes}}', label: 'Notes', description: 'Additional notes or remarks', example: 'Thank you for your business!' },
  { key: '{{items_table}}', label: 'Items Table', description: 'Line items table rows (auto-generated)', example: '<tr><td>Web Design</td><td>1</td><td>$500.00</td><td>$500.00</td></tr>' },
  { key: '{{#items}}...{{/items}}', label: 'Items Loop', description: 'Repeat custom HTML for every item using item_name, item_description, item_quantity, item_price, item_discount, item_tax, and item_total', example: '{{#items}}<tr><td>{{item_description}}</td><td>{{item_quantity}}</td><td>{{item_total}}</td></tr>{{/items}}' },
];

function formatMoney(currency, value) {
  return `${currency || 'INR'} ${Number(value || 0).toFixed(2)}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

/**
 * Build live preview data from the parent's invoice form.
 * This mirrors the logic from InvoiceSystemPage's buildInvoiceTemplateData.
 */
function buildPreviewData(invoiceForm, totals) {
  const currency = invoiceForm.currency || 'INR';
  const firstItem = (invoiceForm.items || [])[0] || {};
  const convenienceCharge = Number(invoiceForm.convenienceCharge || invoiceForm.platformCharge || 0);
  const convenienceChargeGst = Number(invoiceForm.convenienceChargeGst || invoiceForm.platformChargeGst || 0);
  const totalCharges = convenienceCharge + convenienceChargeGst;
  const taxPercent = Number(invoiceForm.defaultTaxPercent || firstItem.tax || 0);
  const itemRows = (invoiceForm.items || []).map((item) => {
    const taxable = Math.max(0, Number(item.quantity || 0) * Number(item.price || 0) - Number(item.discount || 0));
    const total = taxable + (taxable * Number(item.tax || 0)) / 100;
    return {
      item_name: item.product || item.description || 'Item',
      item_description: item.description || '',
      item_quantity: item.quantity || 0,
      item_price: formatMoney(currency, item.price),
      item_tax: `${Number(item.tax || 0)}%`,
      item_discount: formatMoney(currency, item.discount),
      item_total: formatMoney(currency, total),
    };
  });

  const itemsHtml = itemRows.map((item) =>
    `<tr><td>${escapeHtml(item.item_name)}</td><td>${escapeHtml(item.item_quantity)}</td><td>${escapeHtml(item.item_price)}</td><td>${escapeHtml(item.item_total)}</td></tr>`
  ).join('');

  return {
    invoice_number: invoiceForm.invoiceNumber || 'INV-DRAFT',
    customer_name: invoiceForm.customerCompany?.name || invoiceForm.userName || '',
    customer_email: invoiceForm.customerCompany?.email || invoiceForm.userEmail || '',
    customer_phone: invoiceForm.customerCompany?.phone || '',
    customer_address: invoiceForm.customerCompany?.address || '',
    invoice_date: invoiceForm.invoiceDate || '',
    due_date: invoiceForm.dueDate || '',
    company_name: invoiceForm.billingCompany?.name || 'Krita NEET JEE',
    company_address: invoiceForm.billingCompany?.address || '',
    company_email: invoiceForm.billingCompany?.email || '',
    company_phone: invoiceForm.billingCompany?.phone || '',
    company_logo: invoiceForm.logoUrl || '',
    description: firstItem.description || firstItem.product || '',
    item_description: firstItem.description || '',
    quantity: firstItem.quantity || 1,
    item_quantity: firstItem.quantity || 1,
    item_amount: formatMoney(currency, firstItem.price),
    items: itemsHtml,
    subtotal: formatMoney(currency, totals.subtotal),
    base_amount: formatMoney(currency, totals.subtotal),
    tax_rate: `${taxPercent}%`,
    gst_rate: `${taxPercent}%`,
    tax_amount: formatMoney(currency, totals.taxTotal),
    gst: formatMoney(currency, totals.taxTotal),
    discount: formatMoney(currency, totals.discountTotal),
    discount_amount: formatMoney(currency, totals.discountTotal),
    transaction_id: invoiceForm.transactionId || '',
    transactionId: invoiceForm.transactionId || '',
    platform_charge: formatMoney(currency, convenienceCharge),
    convenience_charge: formatMoney(currency, convenienceCharge),
    platform_charge_gst: formatMoney(currency, convenienceChargeGst),
    convenience_charge_gst: formatMoney(currency, convenienceChargeGst),
    total_charges: formatMoney(currency, totalCharges),
    amount: formatMoney(currency, totals.grandTotal),
    total_amount: formatMoney(currency, totals.grandTotal),
    total: formatMoney(currency, totals.grandTotal),
    currency,
    payment_terms: invoiceForm.terms || 'Net 15 Days',
    notes: invoiceForm.notes || 'Thank you for your business!',
    itemRows,
  };
}

export const useInvoiceBuilderStore = create((set, get) => ({
  // Editor
  htmlCode: DEFAULT_INVOICE_HTML,
  cssCode: DEFAULT_INVOICE_CSS,
  setHtmlCode: (code) => set({ htmlCode: code }),
  setCssCode: (code) => set({ cssCode: code }),

  // Preview
  zoom: 1,
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(3, zoom)) }),
  zoomIn: () => {
    const current = get().zoom;
    const newZoom = Math.min(3, current + 0.1);
    set({ zoom: Math.round(newZoom * 100) / 100 });
  },
  zoomOut: () => {
    const current = get().zoom;
    const newZoom = Math.max(0.25, current - 0.1);
    set({ zoom: Math.round(newZoom * 100) / 100 });
  },
  zoomToFit: () => set({ zoom: 1 }),
  isFullscreen: false,
  toggleFullscreen: () => set((s) => ({ isFullscreen: !s.isFullscreen })),
  setFullscreen: (val) => set({ isFullscreen: val }),

  // Invoice form data from parent — synced externally via init()
  invoiceForm: null,
  totals: null,
  initFromParent: (invoiceForm, totals) => set({ invoiceForm, totals }),

  // Media
  uploadedImages: [],
  addImage: (image) => set((s) => ({ uploadedImages: [...s.uploadedImages, image] })),
  removeImage: (id) => set((s) => ({ uploadedImages: s.uploadedImages.filter((img) => img.id !== id) })),

  // Active Tab
  activeEditorTab: 'html',
  setActiveEditorTab: (tab) => set({ activeEditorTab: tab }),

  // Accordion
  variableMapperOpen: false,
  setVariableMapperOpen: (open) => set({ variableMapperOpen: open }),
  mediaLibraryOpen: false,
  setMediaLibraryOpen: (open) => set({ mediaLibraryOpen: open }),

  // Generated preview document
  getPreviewDoc: () => {
    const { htmlCode, cssCode, invoiceForm, totals, uploadedImages } = get();
    if (!invoiceForm) {
      // Fallback: render with just the code, no variable replacement
      return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><style>*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter','Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased}${cssCode}</style></head><body>${htmlCode}</body></html>`;
    }
    const data = buildPreviewData(invoiceForm, totals);

    let processed = htmlCode;
    let processedCss = cssCode;

    // First handle {{#items}}...{{/items}} loop (admin template syntax)
    processed = processed.replace(/\{\{#items\}\}([\s\S]*?)\{\{\/items\}\}/g, (_match, inner) =>
      data.itemRows.map((item) => inner.replace(/\{\{\s*([\w_]+)\s*\}\}/g, (__match, key) => escapeHtml(item[key] ?? ''))).join('')
    );

    // Replace standard variables
    processed = processed.replace(/\{\{\s*([\w_]+)\s*\}\}/g, (_match, key) => {
      // Handle special {{items_table}} replacement
      if (key === 'items_table') {
        return data.items;
      }
      return data[key] ?? '';
    });

    processedCss = processedCss.replace(/\{\{\s*([\w_]+)\s*\}\}/g, (_match, key) => data[key] ?? '');

    // Replace uploaded image URLs - {{image_0}}, {{image_1}}, etc.
    uploadedImages.forEach((img, idx) => {
      const imageUrl = img.publicUrl || img.url || img.dataUrl;
      processed = processed.replaceAll(`{{image_${idx}}}`, imageUrl);
      processedCss = processedCss.replaceAll(`{{image_${idx}}}`, imageUrl);
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
    ${processedCss}
  </style>
</head>
<body>${processed}</body>
</html>`;
  },
}));
