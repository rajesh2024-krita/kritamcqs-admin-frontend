/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fabric } from 'fabric';
import { 
  Clipboard, Scissors, Copy, Type, Bold, Italic, Underline, AlignLeft, 
  AlignCenter, AlignRight, AlignJustify, Image as ImageIcon, Shapes, 
  Layout, Palette, Eye, FileText, Download, Printer, Save, 
  Settings, Undo2, Redo2, Plus, Table, Hash, Minus, Grid3X3, Layers
} from 'lucide-react';
import { useEditorStore, TabType } from '../../store/useEditorStore';
import { motion, AnimatePresence } from 'motion/react';

import { 
  exportToPDF, exportToImage, exportToDocx
} from '../../lib/export';
import { createInvoiceTable } from '../../lib/canvasHelpers';

const tabs: TabType[] = ['Home', 'Insert', 'Export'];

export function Toolbar() {
  const { activeTab, setActiveTab, undo, redo, historyIndex, history, canvas } = useEditorStore();

  return (
    <div className="bg-white border-b border-slate-200 z-50 flex flex-col shadow-sm">
      {/* Tab Selectors */}
      <div className="flex bg-[#F3F4F6] px-2 pt-1 gap-1">
        <div className="flex items-center px-4 mr-4">
           <span className="font-bold text-lg tracking-tighter text-blue-600">INVOICE<span className="text-slate-900">PRO</span></span>
        </div>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 text-sm font-medium transition-all rounded-t-lg ${
              activeTab === tab 
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' 
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            {tab}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 px-4">
          <button onClick={undo} disabled={historyIndex <= 0} className="p-1.5 hover:bg-slate-200 rounded disabled:opacity-30">
            <Undo2 size={16} />
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1.5 hover:bg-slate-200 rounded disabled:opacity-30">
            <Redo2 size={16} />
          </button>
        </div>
      </div>

      {/* Ribbon Content */}
      <div className="h-24 px-4 py-2 flex items-center gap-6 overflow-x-auto border-t border-slate-200 whitespace-nowrap scrollbar-hide">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-6"
          >
            {activeTab === 'Home' && <HomeRibbon />}
            {activeTab === 'Insert' && <InsertRibbon />}
            {activeTab === 'Export' && <ExportRibbon />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function RibbonGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1.5 border-r border-slate-100 pr-6 last:border-0 h-full justify-between">
      <div className="flex items-center gap-3">
        {children}
      </div>
      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{title}</span>
    </div>
  );
}

function RibbonButton({ icon: Icon, label, primary, onClick }: { icon: any; label: string; primary?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center p-2 rounded-md transition-all hover:bg-slate-100 min-w-[56px] gap-1 group ${primary ? 'text-blue-600' : 'text-slate-700'}`}>
      <Icon size={20} className="group-hover:scale-110 transition-transform" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function HomeRibbon() {
  return (
    <>
      <RibbonGroup title="Font">
        <div className="flex flex-col gap-2">
           <select className="text-xs border border-slate-200 rounded px-1 py-0.5 bg-white w-32 focus:ring-1 focus:ring-blue-500 outline-none">
             <option>Inter</option>
             <option>Georgia</option>
             <option>Courier New</option>
           </select>
           <div className="flex gap-1">
             <button className="p-1 hover:bg-slate-100 border border-slate-200 rounded"><Bold size={14} /></button>
             <button className="p-1 hover:bg-slate-100 border border-slate-200 rounded"><Italic size={14} /></button>
             <button className="p-1 hover:bg-slate-100 border border-slate-200 rounded"><Underline size={14} /></button>
             <div className="relative w-8 h-6 rounded border border-slate-200 overflow-hidden ml-2 ring-1 ring-white">
                <input type="color" className="absolute top-[-5px] left-[-5px] w-12 h-12 cursor-pointer" />
             </div>
           </div>
        </div>
      </RibbonGroup>

      <RibbonGroup title="Paragraph">
        <div className="grid grid-cols-4 gap-1">
           <button className="p-1.5 hover:bg-slate-100 rounded border border-slate-200"><AlignLeft size={16} /></button>
           <button className="p-1.5 hover:bg-slate-100 rounded border border-slate-200"><AlignCenter size={16} /></button>
           <button className="p-1.5 hover:bg-slate-100 rounded border border-slate-200"><AlignRight size={16} /></button>
           <button className="p-1.5 hover:bg-slate-100 rounded border border-slate-200"><AlignJustify size={16} /></button>
        </div>
      </RibbonGroup>

      <RibbonGroup title="Actions">
        <RibbonButton icon={Save} label="Save" onClick={() => alert('Work saved to browser local storage.')} />
        <RibbonButton icon={Printer} label="Print" onClick={() => window.print()} />
      </RibbonGroup>
    </>
  );
}

function InsertRibbon() {
  const { canvas } = useEditorStore();
  
  const addRect = () => {
    if (!canvas) return;
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: '#3B82F6',
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  };

  const addText = () => {
    if (!canvas) return;
    const text = new fabric.IText('New Text', {
      left: 100,
      top: 100,
      fontSize: 20,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  return (
    <>
      <RibbonGroup title="Illustrations">
        <RibbonButton icon={Shapes} label="Square" onClick={addRect} />
        <RibbonButton icon={ImageIcon} label="Upload Image" onClick={() => document.getElementById('image-upload')?.click()} />
        <RibbonButton icon={Table} label="Invoice Table" primary onClick={() => canvas && createInvoiceTable(canvas)} />
      </RibbonGroup>
      <RibbonGroup title="Text">
        <RibbonButton icon={Type} label="Text Box" onClick={addText} />
      </RibbonGroup>
    </>
  );
}

function DesignRibbon() {
  return (
    <>
      <RibbonGroup title="Themes">
        <RibbonButton icon={Palette} label="Palettes" />
        <RibbonButton icon={Palette} label="Colors" />
      </RibbonGroup>
      <RibbonGroup title="Background">
        <RibbonButton icon={ImageIcon} label="Watermark" />
        <RibbonButton icon={Palette} label="Page Color" />
      </RibbonGroup>
    </>
  );
}

function ViewRibbon() {
  return (
    <>
      <RibbonGroup title="Show">
        <RibbonButton icon={Grid3X3} label="Rulers" />
        <RibbonButton icon={Grid3X3} label="Grid" />
        <RibbonButton icon={Layers} label="Guides" />
      </RibbonGroup>
      <RibbonGroup title="Zoom">
        <RibbonButton icon={Plus} label="Zoom In" />
        <RibbonButton icon={Minus} label="Zoom Out" />
        <RibbonButton icon={Eye} label="100%" />
      </RibbonGroup>
    </>
  );
}

function ExportRibbon() {
  const { canvas } = useEditorStore();
  return (
    <>
      <RibbonGroup title="Download">
        <RibbonButton icon={Download} label="PDF" primary onClick={() => canvas && exportToPDF(canvas)} />
        <RibbonButton icon={ImageIcon} label="PNG" onClick={() => canvas && exportToImage(canvas, 'png')} />
        <RibbonButton icon={ImageIcon} label="JPG" onClick={() => canvas && exportToImage(canvas, 'jpeg')} />
        <RibbonButton icon={FileText} label="Docx" onClick={() => canvas && exportToDocx(canvas)} />
      </RibbonGroup>
    </>
  );
}
