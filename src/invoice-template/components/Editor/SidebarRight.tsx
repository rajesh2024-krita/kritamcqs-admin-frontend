/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { 
  Type, Bold, Italic, Underline, AlignLeft, AlignCenter, 
  AlignRight, AlignJustify, Trash2, Layers, Move, Maximize2, RotateCcw,
  Palette, Lock, Unlock, EyeOff, Copy
} from 'lucide-react';
import { FONTS } from '../../constants/editor';

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
  });

  const activeObject = selectedObjects.length === 1 ? selectedObjects[0] : null;

  useEffect(() => {
    if (activeObject) {
      setProps({
        fill: activeObject.get('fill') || '#000000',
        left: Math.round(activeObject.get('left') || 0),
        top: Math.round(activeObject.get('top') || 0),
        width: Math.round(activeObject.get('width') || 0),
        height: Math.round(activeObject.get('height') || 0),
        scaleX: activeObject.get('scaleX') ?? 1,
        scaleY: activeObject.get('scaleY') ?? 1,
        angle: Math.round(activeObject.get('angle') || 0),
        opacity: activeObject.get('opacity') ?? 1,
        fontFamily: activeObject.get('fontFamily') || 'Inter',
        fontSize: activeObject.get('fontSize') || 20,
        fontWeight: activeObject.get('fontWeight') || 'normal',
        ...(activeObject.type === 'i-text' || activeObject.type === 'text' ? {
          fontStyle: activeObject.get('fontStyle') || 'normal',
          underline: activeObject.get('underline') || false,
          textAlign: activeObject.get('textAlign') || 'left',
        } : {
          fontStyle: 'normal',
          underline: false,
          textAlign: 'left',
        })
      });
    }
  }, [activeObject]);

  const updateProp = (key: string, value: any) => {
    if (!activeObject || !canvas) return;
    activeObject.set(key, value);
    canvas.renderAll();
    setProps({ ...props, [key]: value });
    pushHistory();
  };

  const deleteObject = () => {
    if (!canvas) return;
    canvas.remove(...selectedObjects);
    canvas.discardActiveObject();
    canvas.renderAll();
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
          <button onClick={() => {}} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"><Copy size={14} /></button>
          <button onClick={deleteObject} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
        </div>
      </div>

      {/* Transform */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <Maximize2 size={12} className="text-slate-400" />
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Transform</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <PropGroup label="X Position" value={props.left} onChange={(v: number) => updateProp('left', v)} />
          <PropGroup label="Y Position" value={props.top} onChange={(v: number) => updateProp('top', v)} />
          <PropGroup label="Width" value={Math.round(props.width * props.scaleX)} onChange={(v: number) => updateProp('width', v / props.scaleX)} />
          <PropGroup label="Height" value={Math.round(props.height * props.scaleY)} onChange={(v: number) => updateProp('height', v / props.scaleY)} />
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

      {/* Appearance */}
      <section className="flex flex-col gap-4 border-t border-slate-100 pt-6 pb-20">
        <div className="flex items-center gap-2 mb-1">
          <Palette size={12} className="text-slate-400" />
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Appearance</span>
        </div>
        <div className="flex flex-col gap-4">
           <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fill Color</span>
              <div className="relative w-20 h-8 rounded border border-slate-200 overflow-hidden ring-1 ring-white cursor-pointer group">
                  <div className="absolute inset-0 z-0" style={{ backgroundColor: props.fill }} />
                  <input 
                    type="color" 
                    className="absolute inset-[-10px] opacity-0 cursor-pointer" 
                    value={typeof props.fill === 'string' ? props.fill : '#000000'}
                    onChange={(e) => updateProp('fill', e.target.value)}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/10 transition-opacity">
                     <Palette size={12} className="text-white" />
                  </div>
              </div>
           </div>
           
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
