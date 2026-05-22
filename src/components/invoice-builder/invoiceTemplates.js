/**
 * Default invoice HTML/CSS templates for the invoice builder.
 * Converted from TypeScript — used by the admin Invoice Pro editor.
 * SPDX-License-Identifier: Apache-2.0
 */

export const DEFAULT_INVOICE_HTML = `<div class="invoice-wrapper">
  <div class="invoice-container">
    <!-- Header -->
    <div class="invoice-header">
      <div class="company-info">
        <div class="company-logo">
          {{company_logo}}
        </div>
        <div>
          <h1 class="company-name">{{company_name}}</h1>
          <p class="company-detail">{{company_address}}</p>
          <p class="company-detail">{{company_email}} | {{company_phone}}</p>
        </div>
      </div>
      <div class="invoice-title-section">
        <h2 class="invoice-title">INVOICE</h2>
        <div class="invoice-meta">
          <div class="meta-row"><span class="meta-label">Invoice #</span><span class="meta-value">{{invoice_number}}</span></div>
          <div class="meta-row"><span class="meta-label">Date</span><span class="meta-value">{{invoice_date}}</span></div>
          <div class="meta-row"><span class="meta-label">Due Date</span><span class="meta-value">{{due_date}}</span></div>
        </div>
      </div>
    </div>

    <!-- Bill To -->
    <div class="bill-to-section">
      <h3 class="section-label">Bill To</h3>
      <p class="customer-name">{{customer_name}}</p>
      <p class="customer-detail">{{customer_address}}</p>
      <p class="customer-detail">{{customer_email}} | {{customer_phone}}</p>
    </div>

    <!-- Items Table -->
    <div class="items-section">
      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {{items_table}}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-grid">
        <div class="total-row"><span>Subtotal</span><span>{{subtotal}}</span></div>
        <div class="total-row"><span>Tax ({{tax_rate}})</span><span>{{tax_amount}}</span></div>
        <div class="total-row"><span>Discount</span><span>{{discount}}</span></div>
        <div class="total-row grand-total"><span>Total ({{currency}})</span><span>{{total_amount}}</span></div>
      </div>
    </div>

    <!-- Footer -->
    <div class="invoice-footer">
      <div class="footer-section">
        <h4 class="footer-heading">Payment Terms</h4>
        <p>{{payment_terms}}</p>
      </div>
      <div class="footer-section">
        <h4 class="footer-heading">Notes</h4>
        <p>{{notes}}</p>
      </div>
    </div>
  </div>
</div>`;

export const DEFAULT_INVOICE_CSS = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

.invoice-wrapper {
  display: flex;
  justify-content: center;
  padding: 30px 20px;
  background: #f0f2f5;
  min-height: 100vh;
}

.invoice-container {
  max-width: 800px;
  width: 100%;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04);
  padding: 48px;
}

/* Header */
.invoice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 32px;
  border-bottom: 2px solid #f0f2f5;
  margin-bottom: 32px;
}

.company-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.company-logo {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 11px;
  color: #9ca3af;
}

.company-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.company-name {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 2px;
}

.company-detail {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
}

.invoice-title-section {
  text-align: right;
}

.invoice-title {
  font-size: 36px;
  font-weight: 900;
  color: #111827;
  letter-spacing: -0.5px;
  margin: 0 0 16px 0;
}

.invoice-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-row {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  font-size: 13px;
}

.meta-label {
  color: #9ca3af;
  font-weight: 500;
}

.meta-value {
  color: #374151;
  font-weight: 600;
  min-width: 120px;
  text-align: left;
}

/* Bill To */
.bill-to-section {
  margin-bottom: 32px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 10px;
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.customer-name {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.customer-detail {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

/* Items Table */
.items-section {
  margin-bottom: 32px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table thead th {
  background: #f9fafb;
  padding: 12px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
  border-bottom: 2px solid #e5e7eb;
}

.items-table thead th:nth-child(2),
.items-table thead th:nth-child(3),
.items-table thead th:nth-child(4) {
  text-align: center;
  width: 100px;
}

.items-table thead th:nth-child(4) {
  text-align: right;
}

.items-table tbody td {
  padding: 12px;
  font-size: 13px;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
}

.items-table tbody td:nth-child(2),
.items-table tbody td:nth-child(3) {
  text-align: center;
}

.items-table tbody td:nth-child(4) {
  text-align: right;
  font-weight: 600;
}

/* Totals */
.totals-section {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 32px;
  padding-top: 16px;
  border-top: 2px solid #f0f2f5;
}

.totals-grid {
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #6b7280;
  padding: 4px 0;
}

.total-row span:last-child {
  font-weight: 600;
  color: #374151;
}

.total-row.grand-total {
  font-size: 18px;
  font-weight: 800;
  color: #111827;
  border-top: 2px solid #e5e7eb;
  padding-top: 12px;
  margin-top: 4px;
}

.total-row.grand-total span:last-child {
  color: #059669;
  font-size: 20px;
}

/* Footer */
.invoice-footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.footer-heading {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #9ca3af;
  margin-bottom: 6px;
}

.footer-section p {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}

/* Print styles */
@media print {
  .invoice-wrapper {
    padding: 0;
    background: white;
  }
  .invoice-container {
    box-shadow: none;
    border-radius: 0;
    padding: 40px;
  }
}

/* Responsive */
@media (max-width: 640px) {
  .invoice-container {
    padding: 24px;
  }
  .invoice-header {
    flex-direction: column;
    gap: 20px;
  }
  .invoice-title-section {
    text-align: left;
  }
  .meta-row {
    justify-content: flex-start;
  }
  .invoice-footer {
    grid-template-columns: 1fr;
  }
  .totals-grid {
    width: 100%;
  }
}`;