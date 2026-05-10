/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { fabric } from 'fabric';
import { Document, Packer, Paragraph, ImageRun } from 'docx';
import { saveAs } from 'file-saver';

export async function exportToPDF(canvas: fabric.Canvas) {
  if (!canvas) return;

  const page = canvas.getObjects().find(obj => (obj as any).isPage) as fabric.Rect;
  if (!page) return;

  // Save state for clean export
  const originalVpt = [...canvas.viewportTransform!];
  const originalBg = canvas.backgroundColor;
  const originalShadow = page.shadow;

  // Prepare for export: reset transform and remove artifacts
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
  canvas.backgroundColor = 'rgba(0,0,0,0)';
  page.set({ shadow: undefined });
  canvas.renderAll();

  const dataURL = canvas.toDataURL({
    format: 'png',
    quality: 1,
    left: page.left,
    top: page.top,
    width: page.width,
    height: page.height,
    multiplier: 2,
  });

  // Restore state
  canvas.setViewportTransform(originalVpt as any);
  canvas.backgroundColor = originalBg;
  page.set({ shadow: originalShadow as any });
  canvas.renderAll();

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [page.width!, page.height!],
  });

  pdf.addImage(dataURL, 'PNG', 0, 0, page.width!, page.height!);
  pdf.save(`Invoice_${Date.now()}.pdf`);
}

export function exportToImage(canvas: fabric.Canvas, format: 'png' | 'jpeg') {
  if (!canvas) return;
  const page = canvas.getObjects().find(obj => (obj as any).isPage) as fabric.Rect;
  if (!page) return;

  // Save state
  const originalVpt = [...canvas.viewportTransform!];
  const originalBg = canvas.backgroundColor;
  const originalShadow = page.shadow;

  // Prepare
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
  canvas.backgroundColor = format === 'jpeg' ? '#ffffff' : 'rgba(0,0,0,0)';
  page.set({ shadow: undefined });
  canvas.renderAll();

  const dataURL = canvas.toDataURL({
    format,
    quality: 1,
    left: page.left,
    top: page.top,
    width: page.width,
    height: page.height,
    multiplier: 2,
  });

  // Restore
  canvas.setViewportTransform(originalVpt as any);
  canvas.backgroundColor = originalBg;
  page.set({ shadow: originalShadow as any });
  canvas.renderAll();

  const link = document.createElement('a');
  link.download = `Invoice_${Date.now()}.${format === 'jpeg' ? 'jpg' : 'png'}`;
  link.href = dataURL;
  link.click();
}

export async function exportToDocx(canvas: fabric.Canvas) {
  if (!canvas) return;
  const page = canvas.getObjects().find(obj => (obj as any).isPage) as fabric.Rect;
  if (!page) return;

  // Save state
  const originalVpt = [...canvas.viewportTransform!];
  const originalBg = canvas.backgroundColor;
  const originalShadow = page.shadow;

  // Prepare
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
  canvas.backgroundColor = 'rgba(0,0,0,0)';
  page.set({ shadow: undefined });
  canvas.renderAll();

  const dataURL = canvas.toDataURL({
    format: 'png',
    quality: 1,
    left: page.left,
    top: page.top,
    width: page.width,
    height: page.height,
    multiplier: 2,
  });

  // Restore
  canvas.setViewportTransform(originalVpt as any);
  canvas.backgroundColor = originalBg;
  page.set({ shadow: originalShadow as any });
  canvas.renderAll();

  // Convert dataURL to Blob
  const response = await fetch(dataURL);
  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new ImageRun({
              data: buffer,
              transformation: {
                width: page.width!,
                height: page.height!,
              },
            }),
          ],
        }),
      ],
    }],
  });

  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, `Invoice_${Date.now()}.docx`);
  });
}
