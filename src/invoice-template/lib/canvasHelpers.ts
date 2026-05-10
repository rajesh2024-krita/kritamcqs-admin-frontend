/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { fabric } from 'fabric';

const defaultHeaders = ['Description', 'Qty', 'Price', 'Tax', 'Total'];

function getPage(canvas: fabric.Canvas) {
  return canvas.getObjects().find(obj => (obj as any).isPage) as fabric.Rect | undefined;
}

function makeCell(text: string, left: number, top: number, width: number, header = false) {
  const rect = new fabric.Rect({
    width,
    height: 34,
    fill: header ? '#0f172a' : '#ffffff',
    stroke: '#cbd5e1',
    strokeWidth: 1,
    left,
    top,
    selectable: false,
  });

  const label = new fabric.IText(text, {
    fontSize: header ? 13 : 12,
    fontWeight: header ? 'bold' : 'normal',
    fontFamily: 'Inter',
    left: left + 10,
    top: top + 9,
    fill: header ? '#ffffff' : '#334155',
  });

  return [rect, label];
}

function rebuildInvoiceTable(group: fabric.Group, canvas: fabric.Canvas) {
  const meta = (group as any).invoiceTable || { rows: 4, cols: defaultHeaders.length, headers: defaultHeaders };
  const cols = Math.max(1, Number(meta.cols || defaultHeaders.length));
  const rows = Math.max(1, Number(meta.rows || 4));
  const headers = Array.from({ length: cols }).map((_, index) => meta.headers?.[index] || `Column ${index + 1}`);
  const tableWidth = 650;
  const colWidth = tableWidth / cols;
  const objects: fabric.Object[] = [];

  headers.forEach((header, index) => {
    objects.push(...makeCell(header, index * colWidth, 0, colWidth, true));
  });

  for (let row = 1; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const value = col === 0 ? 'Item / Service' : col === cols - 1 ? '{{totalAmount}}' : '0';
      objects.push(...makeCell(value, col * colWidth, row * 34, colWidth, false));
    }
  }

  group._objects = objects;
  group.width = tableWidth;
  group.height = rows * 34;
  group.dirty = true;
  canvas.requestRenderAll();
}

export const createInvoiceTable = (canvas: fabric.Canvas) => {
  const page = getPage(canvas);
  const startX = Number(page?.left || 0) + 72;
  const startY = Number(page?.top || 0) + 360;
  const tableGroup = new fabric.Group([], {
    left: startX,
    top: startY,
    subTargetCheck: true,
    objectCaching: false,
  }) as fabric.Group & { invoiceTable?: any };

  tableGroup.invoiceTable = {
    rows: 5,
    cols: defaultHeaders.length,
    headers: defaultHeaders,
  };
  rebuildInvoiceTable(tableGroup, canvas);
  tableGroup.set({
    left: startX,
    top: startY,
  });

  canvas.add(tableGroup);
  canvas.setActiveObject(tableGroup);
  canvas.bringToFront(tableGroup);
  canvas.requestRenderAll();
};

export const addInvoiceTableRow = (canvas: fabric.Canvas) => {
  const active = canvas.getActiveObject() as fabric.Group & { invoiceTable?: any };
  if (!active?.invoiceTable) return false;
  active.invoiceTable = { ...active.invoiceTable, rows: Number(active.invoiceTable.rows || 1) + 1 };
  rebuildInvoiceTable(active, canvas);
  return true;
};

export const addInvoiceTableColumn = (canvas: fabric.Canvas) => {
  const active = canvas.getActiveObject() as fabric.Group & { invoiceTable?: any };
  if (!active?.invoiceTable) return false;
  const nextCol = Number(active.invoiceTable.cols || defaultHeaders.length) + 1;
  active.invoiceTable = {
    ...active.invoiceTable,
    cols: nextCol,
    headers: [...(active.invoiceTable.headers || defaultHeaders), `Column ${nextCol}`],
  };
  rebuildInvoiceTable(active, canvas);
  return true;
};
