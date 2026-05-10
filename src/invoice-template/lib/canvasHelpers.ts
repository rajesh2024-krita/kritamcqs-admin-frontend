/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { fabric } from 'fabric';

const defaultHeaders = ['Description', 'Qty', 'Price', 'Tax', 'Total'];
const defaultCells = [
  ['Premium Subscription', '1', '{{baseAmount}}', '{{taxAmount}}', '{{totalAmount}}'],
  ['Discount', '', '', '', '{{discountAmount}}'],
  ['Transaction', '', '', '', '{{transactionId}}'],
  ['Status', '', '', '', '{{paymentStatus}}'],
];

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
  const cells = Array.from({ length: Math.max(0, rows - 1) }).map((_, row) =>
    Array.from({ length: cols }).map((__, col) => meta.cells?.[row]?.[col] ?? defaultCells[row]?.[col] ?? ''),
  );
  const tableWidth = 650;
  const colWidth = tableWidth / cols;
  const objects: fabric.Object[] = [];

  headers.forEach((header, index) => {
    objects.push(...makeCell(header, index * colWidth, 0, colWidth, true));
  });

  for (let row = 1; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const value = cells[row - 1]?.[col] ?? '';
      objects.push(...makeCell(value, col * colWidth, row * 34, colWidth, false));
    }
  }

  (group as any).invoiceTable = { ...meta, rows, cols, headers, cells };
  group.remove(...group.getObjects());
  objects.forEach((object) => group.addWithUpdate(object));
  group.set({
    width: tableWidth,
    height: rows * 34,
    dirty: true,
  });
  group.setCoords();
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
    selectable: true,
    hasControls: true,
    lockScalingFlip: true,
  }) as fabric.Group & { invoiceTable?: any };

  tableGroup.invoiceTable = {
    rows: 5,
    cols: defaultHeaders.length,
    headers: defaultHeaders,
    cells: defaultCells,
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
  const cols = Number(active.invoiceTable.cols || defaultHeaders.length);
  active.invoiceTable = {
    ...active.invoiceTable,
    rows: Number(active.invoiceTable.rows || 1) + 1,
    cells: [...(active.invoiceTable.cells || []), Array.from({ length: cols }).map(() => '')],
  };
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
    cells: (active.invoiceTable.cells || []).map((row: string[]) => [...row, '']),
  };
  rebuildInvoiceTable(active, canvas);
  return true;
};

export const updateInvoiceTable = (canvas: fabric.Canvas, patch: Record<string, any>) => {
  const active = canvas.getActiveObject() as fabric.Group & { invoiceTable?: any };
  if (!active?.invoiceTable) return false;
  const current = active.invoiceTable;
  const cols = Math.max(1, Number(patch.cols ?? current.cols ?? defaultHeaders.length));
  const rows = Math.max(1, Number(patch.rows ?? current.rows ?? 5));
  const headers = Array.from({ length: cols }).map((_, index) => patch.headers?.[index] ?? current.headers?.[index] ?? `Column ${index + 1}`);
  const sourceCells = patch.cells || current.cells || [];
  const cells = Array.from({ length: Math.max(0, rows - 1) }).map((_, row) =>
    Array.from({ length: cols }).map((__, col) => sourceCells?.[row]?.[col] ?? ''),
  );

  active.invoiceTable = {
    ...current,
    ...patch,
    rows,
    cols,
    headers,
    cells,
  };
  rebuildInvoiceTable(active, canvas);
  canvas.setActiveObject(active);
  canvas.fire('object:modified', { target: active });
  canvas.requestRenderAll();
  return true;
};
