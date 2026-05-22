/**
 * Export utilities for the invoice builder.
 * PDF export, print, copy, and download functions.
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';

/**
 * Converts the preview document HTML string to a PDF blob using jsPDF.
 * Renders via an offscreen iframe for accurate HTML → canvas capture.
 */
export async function exportToPDF(previewDocString, invoiceData) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '800px';
  iframe.style.height = '1200px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  return new Promise((resolve) => {
    iframe.onload = async () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) {
          document.body.removeChild(iframe);
          resolve();
          return;
        }

        doc.open();
        doc.write(previewDocString);
        doc.close();

        // Wait for fonts/images to load
        await new Promise((r) => setTimeout(r, 500));

        const body = doc.body;
        const contentHeight = body.scrollHeight;
        const contentWidth = body.scrollWidth;

        const pdf = new jsPDF({
          orientation: contentWidth > contentHeight ? 'landscape' : 'portrait',
          unit: 'px',
          format: [contentWidth + 20, contentHeight + 20],
        });

        // Use inline SVG rendering for accurate output
        const svgString = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${contentWidth}" height="${contentHeight}">
            <foreignObject width="100%" height="100%">
              <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Inter,system-ui,sans-serif;">
                ${body.innerHTML}
              </div>
            </foreignObject>
          </svg>`;

        const svgDataUrl =
          'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = contentWidth;
          canvas.height = contentHeight;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, contentWidth, contentHeight);
          ctx.drawImage(img, 0, 0);

          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 10, 10, contentWidth, contentHeight);
          const invNum = (invoiceData?.invoice_number || 'INV').replace(/[^a-zA-Z0-9]/g, '_');
          pdf.save(`Invoice_${invNum}_${Date.now()}.pdf`);

          document.body.removeChild(iframe);
          resolve();
        };

        img.src = svgDataUrl;
      } catch {
        document.body.removeChild(iframe);
        resolve();
      }
    };
  });
}

/**
 * Opens the invoice in the browser's native print dialog (Ctrl+P / Cmd+P).
 */
export function printInvoice(previewDocString) {
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) return;

  printWindow.document.open();
  printWindow.document.write(previewDocString);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}

/**
 * Copies the invoice HTML string to clipboard for email integration.
 */
export async function copyInvoiceHtml(previewDocString) {
  try {
    await navigator.clipboard.writeText(previewDocString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Triggers download of the invoice as an HTML file.
 */
export function downloadInvoiceHtml(previewDocString, invoiceData) {
  const blob = new Blob([previewDocString], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const invNum = (invoiceData?.invoice_number || 'INV').replace(/[^a-zA-Z0-9]/g, '_');
  link.download = `Invoice_${invNum}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copies a mapping variable (e.g., {{customer_name}}) to clipboard.
 */
export async function copyVariable(variable) {
  try {
    await navigator.clipboard.writeText(variable);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = variable;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const result = document.execCommand('copy');
    document.body.removeChild(textarea);
    return result;
  }
}