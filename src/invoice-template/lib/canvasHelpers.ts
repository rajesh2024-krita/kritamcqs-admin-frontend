/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { fabric } from 'fabric';

export const defaultHeaders = ['Description', 'Qty', 'Price', 'Tax', 'Charges', 'Final Amount'];
const defaultCells = [
  ['{{planName}}', '1', '{{planAmount}}', '{{taxAmount}}', '{{totalCharges}}', '{{finalAmount}}'],
  ['Discount', '', '', '', '', '{{discountAmount}}'],
  ['Convenience Fee', '', '', '', '{{convenienceCharge}}', ''],
  ['GST on Convenience Fee', '', '', '', '{{convenienceChargeGst}}', ''],
  ['Transaction', '', '', '', '', '{{transactionId}}'],
];

function getPage(canvas: fabric.Canvas) {
  return canvas.getObjects().find(obj => (obj as any).isPage) as fabric.Rect | undefined;
}

const defaultTableStyle = {
  tableWidth: 650,
  rowHeight: 34,
  borderColor: '#cbd5e1',
  borderWidth: 1,
  borderStyle: 'solid',
  headerBackground: '#0f172a',
  headerTextColor: '#ffffff',
  bodyTextColor: '#334155',
  bodyBackground: '#ffffff',
  alternateRowBackground: '#f8fafc',
  useAlternateRows: false,
  padding: 10,
};

function normalizeTable(meta: any = {}) {
  const cols = Math.max(1, Number(meta.cols || defaultHeaders.length));
  const rows = Math.max(1, Number(meta.rows || defaultCells.length + 1));
  const style = { ...defaultTableStyle, ...(meta.style || {}) };
  const tableWidth = Math.max(80, Number(style.tableWidth || defaultTableStyle.tableWidth));
  const colWidths = Array.from({ length: cols }).map((_, index) => Number(meta.colWidths?.[index] || tableWidth / cols));
  const rowHeights = Array.from({ length: rows }).map((_, index) => Number(meta.rowHeights?.[index] || style.rowHeight || defaultTableStyle.rowHeight));
  const headers = Array.from({ length: cols }).map((_, index) => meta.headers?.[index] || defaultHeaders[index] || `Column ${index + 1}`);
  const cells = Array.from({ length: Math.max(0, rows - 1) }).map((_, row) =>
    Array.from({ length: cols }).map((__, col) => meta.cells?.[row]?.[col] ?? defaultCells[row]?.[col] ?? ''),
  );
  return { ...meta, rows, cols, headers, cells, style, colWidths, rowHeights };
}

function makeCell(text: string, left: number, top: number, width: number, height: number, meta: any, header = false, row = 0, col = 0) {
  const style = meta.style || defaultTableStyle;
  const cellKey = header ? `h-${col}` : `${row - 1}-${col}`;
  const cellStyle = meta.cellStyles?.[cellKey] || {};
  const fill = cellStyle.fill
    || (header ? style.headerBackground : meta.rowColors?.[row] || meta.colColors?.[col] || (style.useAlternateRows && row % 2 === 0 ? style.alternateRowBackground : style.bodyBackground));
  const strokeWidth = Number(style.borderWidth || 0);
  const dashArray = style.borderStyle === 'dashed' ? [6, 4] : style.borderStyle === 'dotted' ? [1, 4] : undefined;
  const rect = new fabric.Rect({
    width,
    height,
    fill,
    stroke: style.borderColor,
    strokeWidth,
    strokeDashArray: dashArray,
    left,
    top,
    selectable: false,
  });

  const label = new fabric.IText(text, {
    fontSize: header ? 13 : 12,
    fontWeight: header ? 'bold' : 'normal',
    fontFamily: 'Inter',
    left: left + Number(style.padding || 0),
    top: top + Math.max(4, height / 2 - 7),
    fill: cellStyle.color || (header ? style.headerTextColor : style.bodyTextColor),
  });

  return [rect, label];
}

function rebuildInvoiceTable(group: fabric.Group, canvas: fabric.Canvas) {
  const meta = normalizeTable((group as any).invoiceTable);
  const objects: fabric.Object[] = [];
  const tableWidth = meta.colWidths.reduce((sum: number, value: number) => sum + value, 0);
  const tableHeight = meta.rowHeights.reduce((sum: number, value: number) => sum + value, 0);

  let x = 0;
  meta.headers.forEach((header: string, index: number) => {
    objects.push(...makeCell(header, x, 0, meta.colWidths[index], meta.rowHeights[0], meta, true, 0, index));
    x += meta.colWidths[index];
  });

  let y = meta.rowHeights[0];
  for (let row = 1; row < meta.rows; row += 1) {
    x = 0;
    for (let col = 0; col < meta.cols; col += 1) {
      const value = meta.cells[row - 1]?.[col] ?? '';
      objects.push(...makeCell(value, x, y, meta.colWidths[col], meta.rowHeights[row], meta, false, row, col));
      x += meta.colWidths[col];
    }
    y += meta.rowHeights[row];
  }

  (group as any).invoiceTable = meta;
  group.remove(...group.getObjects());
  objects.forEach((object) => group.addWithUpdate(object));
  group.set({
    width: tableWidth,
    height: tableHeight,
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
    rows: 6,
    cols: defaultHeaders.length,
    headers: defaultHeaders,
    cells: defaultCells,
    style: defaultTableStyle,
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
  return editInvoiceTable(canvas, (meta) => {
    meta.cells.push(Array.from({ length: meta.cols }).map(() => ''));
    meta.rowHeights.push(meta.style.rowHeight);
    meta.rows += 1;
    return meta;
  });
};

export const addInvoiceTableColumn = (canvas: fabric.Canvas) => {
  return editInvoiceTable(canvas, (meta) => {
    const nextCol = meta.cols + 1;
    meta.cols = nextCol;
    meta.headers.push(`Column ${nextCol}`);
    meta.colWidths.push(Math.max(60, Number(meta.style.tableWidth || defaultTableStyle.tableWidth) / nextCol));
    meta.cells = meta.cells.map((row: string[]) => [...row, '']);
    return meta;
  });
};

export const editInvoiceTable = (canvas: fabric.Canvas, edit: (meta: any) => any) => {
  const active = canvas.getActiveObject() as fabric.Group & { invoiceTable?: any };
  if (!active?.invoiceTable) return false;
  active.invoiceTable = normalizeTable(edit(normalizeTable(active.invoiceTable)));
  rebuildInvoiceTable(active, canvas);
  canvas.setActiveObject(active);
  canvas.fire('object:modified', { target: active });
  return true;
};

export const addInvoiceTableRowAt = (canvas: fabric.Canvas, index: number) => editInvoiceTable(canvas, (meta) => {
  const insertAt = Math.max(0, Math.min(meta.cells.length, index));
  meta.cells.splice(insertAt, 0, Array.from({ length: meta.cols }).map(() => ''));
  meta.rowHeights.splice(insertAt + 1, 0, meta.style.rowHeight);
  meta.rows += 1;
  return meta;
});

export const deleteInvoiceTableRowAt = (canvas: fabric.Canvas, index: number) => editInvoiceTable(canvas, (meta) => {
  if (meta.cells.length <= 1) return meta;
  const removeAt = Math.max(0, Math.min(meta.cells.length - 1, index));
  meta.cells.splice(removeAt, 1);
  meta.rowHeights.splice(removeAt + 1, 1);
  meta.rows -= 1;
  return meta;
});

export const duplicateInvoiceTableRowAt = (canvas: fabric.Canvas, index: number) => editInvoiceTable(canvas, (meta) => {
  const sourceAt = Math.max(0, Math.min(meta.cells.length - 1, index));
  meta.cells.splice(sourceAt + 1, 0, [...(meta.cells[sourceAt] || [])]);
  meta.rowHeights.splice(sourceAt + 2, 0, meta.rowHeights[sourceAt + 1] || meta.style.rowHeight);
  meta.rows += 1;
  return meta;
});

export const addInvoiceTableColumnAt = (canvas: fabric.Canvas, index: number) => editInvoiceTable(canvas, (meta) => {
  const insertAt = Math.max(0, Math.min(meta.cols, index));
  meta.headers.splice(insertAt, 0, `Column ${insertAt + 1}`);
  meta.colWidths.splice(insertAt, 0, Math.max(60, Number(meta.style.tableWidth || defaultTableStyle.tableWidth) / (meta.cols + 1)));
  meta.cells = meta.cells.map((row: string[]) => {
    const next = [...row];
    next.splice(insertAt, 0, '');
    return next;
  });
  meta.cols += 1;
  return meta;
});

export const deleteInvoiceTableColumnAt = (canvas: fabric.Canvas, index: number) => editInvoiceTable(canvas, (meta) => {
  if (meta.cols <= 1) return meta;
  const removeAt = Math.max(0, Math.min(meta.cols - 1, index));
  meta.headers.splice(removeAt, 1);
  meta.colWidths.splice(removeAt, 1);
  meta.cells = meta.cells.map((row: string[]) => row.filter((_, col) => col !== removeAt));
  meta.cols -= 1;
  return meta;
});

export const duplicateInvoiceTableColumnAt = (canvas: fabric.Canvas, index: number) => editInvoiceTable(canvas, (meta) => {
  const sourceAt = Math.max(0, Math.min(meta.cols - 1, index));
  meta.headers.splice(sourceAt + 1, 0, `${meta.headers[sourceAt] || `Column ${sourceAt + 1}`} Copy`);
  meta.colWidths.splice(sourceAt + 1, 0, meta.colWidths[sourceAt] || 100);
  meta.cells = meta.cells.map((row: string[]) => {
    const next = [...row];
    next.splice(sourceAt + 1, 0, row[sourceAt] || '');
    return next;
  });
  meta.cols += 1;
  return meta;
});

export const updateInvoiceTable = (canvas: fabric.Canvas, patch: Record<string, any>) => {
  const active = canvas.getActiveObject() as fabric.Group & { invoiceTable?: any };
  if (!active?.invoiceTable) return false;
  const current = normalizeTable(active.invoiceTable);
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
