/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { 
  Type, Bold, Italic, Underline, AlignLeft, AlignCenter, 
  AlignRight, AlignJustify, Trash2, Layers, Move, Maximize2, RotateCcw,
  Palette, Lock, Unlock, Copy, BringToFront, SendToBack
} from 'lucide-react';
import { FONTS } from '../../constants/editor';
import {
  addInvoiceTableColumnAt,
  addInvoiceTableRowAt,
  deleteInvoiceTableColumnAt,
  deleteInvoiceTableRowAt,
  duplicateInvoiceTableColumnAt,
  duplicateInvoiceTableRowAt,
  updateInvoiceTable,
} from '../../lib/canvasHelpers';

export function SidebarRight() {
  const { selectedObjects, canvas, pushHistory } = useEditorStore();
  const [props, setProps] = useState<any>({
    fill: '#000000',
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    opacity: 1,
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: 'normal',
    fontStyle: 'normal',
    underline: false,
    textAlign: 'left',
    stroke: '#000000',
    strokeWidth: 0,
    backgroundColor: '#ffffff',
    invoiceTable: null,
  });

  const activeObject = selectedObjects.length === 1 ? selectedObjects[0] : null;

  const syncPropsFromObject = (object: any) => {
    if (!object) return;
    setProps({
      fill: object.get('fill') || '#000000',
      left: Math.round(object.get('left') || 0),
      top: Math.round(object.get('top') || 0),
      width: Math.round(object.getScaledWidth?.() || (Number(object.get('width') || 0) * Number(object.get('scaleX') ?? 1))),
      height: Math.round(object.getScaledHeight?.() || (Number(object.get('height') || 0) * Number(object.get('scaleY') ?? 1))),
      scaleX: object.get('scaleX') ?? 1,
      scaleY: object.get('scaleY') ?? 1,
      angle: Math.round(object.get('angle') || 0),
      opacity: object.get('opacity') ?? 1,
      fontFamily: object.get('fontFamily') || 'Inter',
      fontSize: object.get('fontSize') || 20,
      fontWeight: object.get('fontWeight') || 'normal',
      stroke: object.get('stroke') || '#000000',
      strokeWidth: object.get('strokeWidth') || 0,
      backgroundColor: object.get('backgroundColor') || '#ffffff',
      invoiceTable: (object as any).invoiceTable || null,
      ...(object.type === 'i-text' || object.type === 'text' ? {
        text: object.get('text') || '',
        fontStyle: object.get('fontStyle') || 'normal',
        underline: object.get('underline') || false,
        textAlign: object.get('textAlign') || 'left',
      } : {
        text: '',
        fontStyle: 'normal',
        underline: false,
        textAlign: 'left',
      })
    });
  };

  useEffect(() => {
    syncPropsFromObject(activeObject);
  }, [activeObject]);

  useEffect(() => {
    if (!canvas) return;
    const refresh = (event?: any) => {
      const selected = canvas.getActiveObjects();
      const target = event?.target;
      const nextActive = selected.length === 1 ? selected[0] : activeObject;
      if (target && activeObject && target !== activeObject && !selected.includes(target)) return;
      syncPropsFromObject(nextActive);
    };

    canvas.on('selection:created', refresh);
    canvas.on('selection:updated', refresh);
    canvas.on('object:moving', refresh);
    canvas.on('object:scaling', refresh);
    canvas.on('object:rotating', refresh);
    canvas.on('object:skewing', refresh);
    canvas.on('object:modified', refresh);
    canvas.on('object:resizing', refresh);
    canvas.on('text:changed', refresh);

    return () => {
      canvas.off('selection:created', refresh);
      canvas.off('selection:updated', refresh);
      canvas.off('object:moving', refresh);
      canvas.off('object:scaling', refresh);
      canvas.off('object:rotating', refresh);
      canvas.off('object:skewing', refresh);
      canvas.off('object:modified', refresh);
      canvas.off('object:resizing', refresh);
      canvas.off('text:changed', refresh);
    };
  }, [canvas, activeObject]);

  const updateProp = (key: string, value: any, commitHistory = true) => {
    if (!activeObject || !canvas) return;
    activeObject.set(key, value);
    activeObject.setCoords();
    canvas.requestRenderAll();
    syncPropsFromObject(activeObject);
    if (commitHistory) pushHistory();
  };

  const updateDisplaySize = (key: 'width' | 'height', value: number) => {
    if (!activeObject || !canvas) return;
    const baseKey = key === 'width' ? 'width' : 'height';
    const scaleKey = key === 'width' ? 'scaleX' : 'scaleY';
    const baseSize = Math.max(1, Number(activeObject.get(baseKey) || 1));
    const nextSize = Math.max(1, Number(value || 1));
    activeObject.set(scaleKey, nextSize / baseSize);
    activeObject.setCoords();
    canvas.requestRenderAll();
    syncPropsFromObject(activeObject);
    pushHistory();
  };

  const updateTable = (patch: Record<string, any>) => {
    if (!canvas || !activeObject) return;
    updateInvoiceTable(canvas, { ...(activeObject as any).invoiceTable, ...patch });
    syncPropsFromObject(activeObject);
    pushHistory();
  };

  const updateTableHeader = (index: number, value: string) => {
    const headers = [...(props.invoiceTable?.headers || [])];
    headers[index] = value;
    updateTable({ headers });
  };

  const updateTableCell = (rowIndex: number, colIndex: number, value: string) => {
    const cells = (props.invoiceTable?.cells || []).map((row: string[]) => [...row]);
    while (cells.length <= rowIndex) cells.push([]);
    cells[rowIndex][colIndex] = value;
    updateTable({ cells });
  };

  const updateTableStyle = (patch: Record<string, any>) => {
    updateTable({ style: { ...(props.invoiceTable?.style || {}), ...patch } });
  };

  const updateColumnWidth = (index: number, value: number) => {
    const colWidths = [...(props.invoiceTable?.colWidths || [])];
    colWidths[index] = Math.max(24, Number(value || 24));
    updateTable({ colWidths });
  };

  const updateRowHeight = (index: number, value: number) => {
    const rowHeights = [...(props.invoiceTable?.rowHeights || [])];
    rowHeights[index] = Math.max(18, Number(value || 18));
    updateTable({ rowHeights });
  };

  const duplicateObject = async () => {
    if (!activeObject || !canvas) return;
    activeObject.clone((clone: any) => {
      clone.set({ left: Number(activeObject.left || 0) + 24, top: Number(activeObject.top || 0) + 24 });
      canvas.add(clone);
      canvas.setActiveObject(clone);
      canvas.renderAll();
      pushHistory();
    }, ['isPage', 'id', 'invoiceTable']);
  };

  const deleteObject = () => {
    if (!canvas) return;
    canvas.remove(...selectedObjects);
    canvas.discardActiveObject();
    canvas.renderAll();
    pushHistory();
  };

  const toggleLock = () => {
    if (!activeObject || !canvas) return;
    const nextLocked = Boolean(activeObject.get('lockMovementX'));
    activeObject.set({
      lockMovementX: !nextLocked,
      lockMovementY: !nextLocked,
      lockScalingX: !nextLocked,
      lockScalingY: !nextLocked,
      lockRotation: !nextLocked,
      selectable: true,
      evented: true,
    });
    canvas.requestRenderAll();
    pushHistory();
  };

  const bringForward = () => {
    if (!activeObject || !canvas) return;
    canvas.bringForward(activeObject);
    canvas.requestRenderAll();
    pushHistory();
  };

  const sendBackward = () => {
    if (!activeObject || !canvas) return;
    canvas.sendBackwards(activeObject);
    const page = canvas.getObjects().find((obj: any) => obj.isPage);
    if (page) canvas.sendToBack(page);
    canvas.requestRenderAll();
    pushHistory();
  };

  if (!activeObject) {
    return (
      <div className="flex flex-col h-full bg-white p-6">
        <div className="flex flex-col items-center justify-center h-full text-center gap-4">
           <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
             <Move size={24} className="text-slate-300" />
           </div>
           <div className="flex flex-col gap-1">
             <span className="text-sm font-bold text-slate-700">No Selection</span>
             <p className="text-[10px] text-slate-400 font-medium max-w-[140px]">Select an element to view and edit its properties.</p>
           </div>
        </div>
      </div>
    );
  }

  const isText = activeObject.type === 'i-text' || activeObject.type === 'text';
  const isInvoiceTable = Boolean((activeObject as any).invoiceTable);

  return (
    <div className="flex flex-col overflow-y-auto bg-white p-6 gap-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
            {isText ? <Type size={14} /> : <Maximize2 size={14} />}
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">{activeObject.type}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={bringForward} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600" title="Bring forward"><BringToFront size={14} /></button>
          <button onClick={sendBackward} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600" title="Send backward"><SendToBack size={14} /></button>
          <button onClick={toggleLock} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600" title="Lock or unlock">{activeObject.get('lockMovementX') ? <Lock size={14} /> : <Unlock size={14} />}</button>
          <button onClick={duplicateObject} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"><Copy size={14} /></button>
          <button onClick={deleteObject} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
        </div>
      </div>

      {/* Transform */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <Maximize2 size={12} className="text-slate-400" />
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Transform</span>
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
          <PropGroup label="X Position" value={props.left} onChange={(v: number) => updateProp('left', v)} />
          <PropGroup label="Y Position" value={props.top} onChange={(v: number) => updateProp('top', v)} />
          <PropGroup label="Width" value={props.width} onChange={(v: number) => updateDisplaySize('width', v)} />
          <PropGroup label="Height" value={props.height} onChange={(v: number) => updateDisplaySize('height', v)} />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-1">
           <PropGroup label="Rotate" value={props.angle} suffix="°" onChange={(v: number) => updateProp('angle', v)} />
           <PropGroup label="Opacity" value={Math.round(props.opacity * 100)} suffix="%" onChange={(v: number) => updateProp('opacity', v / 100)} />
        </div>
      </section>

      {/* Text Settings */}
      {isText && (
        <section className="flex flex-col gap-4 border-t border-slate-100 pt-6">
          <div className="flex items-center gap-2 mb-1">
            <Type size={12} className="text-slate-400" />
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Typography</span>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 tracking-wider">Font Family</label>
              <select 
                value={props.fontFamily} 
                onChange={(e) => updateProp('fontFamily', e.target.value)}
                className="text-xs border border-slate-200 rounded p-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                {FONTS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 tracking-wider">Text Content</label>
              <textarea
                value={props.text || ''}
                onChange={(e) => updateProp('text', e.target.value)}
                className="min-h-24 w-full resize-y rounded border border-slate-200 bg-slate-50/50 p-2 text-xs outline-none transition-colors hover:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <PropGroup label="Size" value={props.fontSize} onChange={(v: number) => updateProp('fontSize', v)} />
              </div>
              <div className="flex gap-1 mt-4">
                 <button 
                  onClick={() => updateProp('fontWeight', props.fontWeight === 'bold' ? 'normal' : 'bold')}
                  className={`p-2 border rounded ${props.fontWeight === 'bold' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'hover:bg-slate-50 border-slate-200'}`}
                 >
                   <Bold size={14} />
                 </button>
                 <button 
                  onClick={() => updateProp('fontStyle', props.fontStyle === 'italic' ? 'normal' : 'italic')}
                  className={`p-2 border rounded ${props.fontStyle === 'italic' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'hover:bg-slate-50 border-slate-200'}`}
                 >
                   <Italic size={14} />
                 </button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1 mt-2">
              {['left', 'center', 'right', 'justify'].map((align) => (
                <button 
                  key={align}
                  onClick={() => updateProp('textAlign', align)}
                  className={`p-2 border rounded flex items-center justify-center ${props.textAlign === align ? 'bg-blue-50 border-blue-200 text-blue-600' : 'hover:bg-slate-50 border-slate-200'}`}
                >
                  {align === 'left' && <AlignLeft size={14} />}
                  {align === 'center' && <AlignCenter size={14} />}
                  {align === 'right' && <AlignRight size={14} />}
                  {align === 'justify' && <AlignJustify size={14} />}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {isInvoiceTable && (
        <section className="flex flex-col gap-4 border-t border-slate-100 pt-6">
          <div className="flex items-center gap-2 mb-1">
            <Layers size={12} className="text-slate-400" />
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Table Editor</span>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
            <PropGroup label="Rows" value={props.invoiceTable?.rows || 1} onChange={(v: number) => updateTable({ rows: Math.max(1, Math.round(v)) })} />
            <PropGroup label="Columns" value={props.invoiceTable?.cols || 1} onChange={(v: number) => updateTable({ cols: Math.max(1, Math.round(v)) })} />
          </div>
          <div className="rounded-lg border border-slate-100 bg-white p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Rows</p>
            <div className="grid grid-cols-2 gap-2">
              <button className="rounded border border-slate-200 px-2 py-1 text-[10px] font-bold hover:bg-slate-50" onClick={() => canvas && addInvoiceTableRowAt(canvas, 0) && pushHistory()}>Add Row Above</button>
              <button className="rounded border border-slate-200 px-2 py-1 text-[10px] font-bold hover:bg-slate-50" onClick={() => canvas && addInvoiceTableRowAt(canvas, Number(props.invoiceTable?.cells?.length || 0)) && pushHistory()}>Add Row Below</button>
              <button className="rounded border border-slate-200 px-2 py-1 text-[10px] font-bold hover:bg-slate-50" onClick={() => canvas && duplicateInvoiceTableRowAt(canvas, Math.max(0, Number(props.invoiceTable?.cells?.length || 1) - 1)) && pushHistory()}>Duplicate Last Row</button>
              <button className="rounded border border-rose-200 px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50" onClick={() => canvas && deleteInvoiceTableRowAt(canvas, Math.max(0, Number(props.invoiceTable?.cells?.length || 1) - 1)) && pushHistory()}>Delete Last Row</button>
            </div>
          </div>
          <div className="rounded-lg border border-slate-100 bg-white p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Columns</p>
            <div className="grid grid-cols-2 gap-2">
              <button className="rounded border border-slate-200 px-2 py-1 text-[10px] font-bold hover:bg-slate-50" onClick={() => canvas && addInvoiceTableColumnAt(canvas, 0) && pushHistory()}>Add Column Left</button>
              <button className="rounded border border-slate-200 px-2 py-1 text-[10px] font-bold hover:bg-slate-50" onClick={() => canvas && addInvoiceTableColumnAt(canvas, Number(props.invoiceTable?.cols || 0)) && pushHistory()}>Add Column Right</button>
              <button className="rounded border border-slate-200 px-2 py-1 text-[10px] font-bold hover:bg-slate-50" onClick={() => canvas && duplicateInvoiceTableColumnAt(canvas, Math.max(0, Number(props.invoiceTable?.cols || 1) - 1)) && pushHistory()}>Duplicate Last Column</button>
              <button className="rounded border border-rose-200 px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50" onClick={() => canvas && deleteInvoiceTableColumnAt(canvas, Math.max(0, Number(props.invoiceTable?.cols || 1) - 1)) && pushHistory()}>Delete Last Column</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
            <PropGroup label="Border Width" value={props.invoiceTable?.style?.borderWidth ?? 1} onChange={(v: number) => updateTableStyle({ borderWidth: Math.max(0, v) })} />
            <PropGroup label="Cell Padding" value={props.invoiceTable?.style?.padding ?? 10} onChange={(v: number) => updateTableStyle({ padding: Math.max(0, v) })} />
            <ColorPicker label="Border Color" value={props.invoiceTable?.style?.borderColor || '#cbd5e1'} onChange={(value: string) => updateTableStyle({ borderColor: value })} />
            <ColorPicker label="Header Background" value={props.invoiceTable?.style?.headerBackground || '#0f172a'} onChange={(value: string) => updateTableStyle({ headerBackground: value })} />
            <ColorPicker label="Header Text" value={props.invoiceTable?.style?.headerTextColor || '#ffffff'} onChange={(value: string) => updateTableStyle({ headerTextColor: value })} />
            <ColorPicker label="Body Background" value={props.invoiceTable?.style?.bodyBackground || '#ffffff'} onChange={(value: string) => updateTableStyle({ bodyBackground: value })} />
            <label className="col-span-2 flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Border Style
              <select className="rounded border border-slate-200 bg-white p-1.5 text-xs normal-case tracking-normal" value={props.invoiceTable?.style?.borderStyle || 'solid'} onChange={(event) => updateTableStyle({ borderStyle: event.target.value })}>
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
            </label>
            <label className="col-span-2 flex items-center gap-2 text-xs font-bold text-slate-600">
              <input type="checkbox" checked={Boolean(props.invoiceTable?.style?.useAlternateRows)} onChange={(event) => updateTableStyle({ useAlternateRows: event.target.checked })} />
              Alternate row colors
            </label>
          </div>
          <div className="space-y-3">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Headers</p>
              <div className="grid gap-2">
                {Array.from({ length: Number(props.invoiceTable?.cols || 0) }).map((_, index) => (
                  <div key={`header-${index}`} className="grid grid-cols-[1fr_68px] gap-2">
                    <input
                      value={props.invoiceTable?.headers?.[index] || ''}
                      onChange={(event) => updateTableHeader(index, event.target.value)}
                      className="w-full rounded border border-slate-200 bg-slate-50/50 px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder={`Column ${index + 1}`}
                    />
                    <input
                      type="number"
                      value={Math.round(props.invoiceTable?.colWidths?.[index] || 100)}
                      onChange={(event) => updateColumnWidth(index, Number(event.target.value || 0))}
                      className="w-full rounded border border-slate-200 bg-slate-50/50 px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Rows</p>
              <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                {Array.from({ length: Math.max(0, Number(props.invoiceTable?.rows || 1) - 1) }).map((_, rowIndex) => (
                  <div key={`row-${rowIndex}`} className="rounded-lg border border-slate-100 bg-white p-2">
                    <div className="mb-2 grid grid-cols-[1fr_68px] items-center gap-2">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Row {rowIndex + 1}</p>
                      <input
                        type="number"
                        value={Math.round(props.invoiceTable?.rowHeights?.[rowIndex + 1] || 34)}
                        onChange={(event) => updateRowHeight(rowIndex + 1, Number(event.target.value || 0))}
                        className="w-full rounded border border-slate-200 bg-slate-50/50 px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid gap-2">
                      {Array.from({ length: Number(props.invoiceTable?.cols || 0) }).map((__, colIndex) => (
                        <input
                          key={`cell-${rowIndex}-${colIndex}`}
                          value={props.invoiceTable?.cells?.[rowIndex]?.[colIndex] || ''}
                          onChange={(event) => updateTableCell(rowIndex, colIndex, event.target.value)}
                          className="w-full rounded border border-slate-200 bg-slate-50/50 px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder={props.invoiceTable?.headers?.[colIndex] || `Column ${colIndex + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Appearance */}
      <section className="flex flex-col gap-4 border-t border-slate-100 pt-6 pb-20">
        <div className="flex items-center gap-2 mb-1">
          <Palette size={12} className="text-slate-400" />
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Appearance</span>
        </div>
        <div className="flex flex-col gap-4">
           <ColorPicker label={isText ? "Text / Fill Color" : "Fill Color"} value={typeof props.fill === 'string' ? props.fill : '#000000'} onChange={(value: string) => updateProp('fill', value)} />
           <ColorPicker label="Border / Stroke Color" value={typeof props.stroke === 'string' ? props.stroke : '#000000'} onChange={(value: string) => updateProp('stroke', value)} />
           {isText ? <ColorPicker label="Text Box Background" value={typeof props.backgroundColor === 'string' ? props.backgroundColor : '#ffffff'} onChange={(value: string) => updateProp('backgroundColor', value)} /> : null}
           <PropGroup label="Border Width" value={props.strokeWidth} onChange={(v: number) => updateProp('strokeWidth', Math.max(0, v))} />
           
           <div className="grid grid-cols-2 gap-3 mt-2">
              <button className="flex items-center justify-center gap-2 py-2 px-3 border border-slate-200 rounded text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 transition-all">
                <Layers size={12} /> Shadow
              </button>
              <button className="flex items-center justify-center gap-2 py-2 px-3 border border-slate-200 rounded text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 transition-all">
                <Layers size={12} /> Border
              </button>
           </div>
        </div>
      </section>
    </div>
  );
}

function ColorPicker({ label, value, onChange }: any) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2">
        <input
          className="h-8 w-16 rounded border border-slate-200 bg-white p-0.5"
          type="color"
          value={value || '#000000'}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          className="w-24 rounded border border-slate-200 bg-slate-50/50 px-2 py-1.5 font-mono text-[10px] outline-none focus:ring-1 focus:ring-blue-500"
          value={value || '#000000'}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}

function PropGroup({ label, value, onChange, suffix = '' }: any) {
  const displayValue = isNaN(value) || value === undefined || value === null ? '' : value;

  return (
    <div className="flex flex-col gap-1.5 flex-1 ring-slate-100 ring-offset-2">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">{label}</label>
      <div className="relative">
        <input 
          type="number" 
          value={displayValue} 
          onChange={(e) => {
            const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
            onChange(val);
          }}
          className="w-full text-xs font-mono border border-slate-200 rounded p-1.5 focus:ring-1 focus:ring-blue-500 outline-none pr-6 bg-slate-50/50 hover:bg-white transition-colors"
        />
        {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300 pointer-events-none">{suffix}</span>}
      </div>
    </div>
  );
}

