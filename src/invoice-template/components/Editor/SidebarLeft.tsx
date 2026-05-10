/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Square, Circle, Triangle, Type, Image as ImageIcon, 
  Table, LayoutTemplate, Palette, Upload, Search, Star, 
  QrCode, Barcode, Grid2X2, CaseUpper, Database
} from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { fabric } from 'fabric';

import { addInvoiceTableColumn, addInvoiceTableRow, createInvoiceTable } from '../../lib/canvasHelpers';

const sections = [
  { id: 'elements', icon: ShapesIcon, label: 'Elements' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'tables', icon: Table, label: 'Tables' },
  { id: 'uploads', icon: Upload, label: 'Uploads' },
  { id: 'mapping', icon: Database, label: 'Mapping' },
];

const mappingGroups = [
  {
    title: 'Billing To',
    fields: [
      ['Customer Name', '{{userName}}'],
      ['Customer Email', '{{userEmail}}'],
      ['Customer Mobile', '{{userMobile}}'],
      ['Customer Address', '{{customerAddress}}'],
      ['Customer GSTIN', '{{customerGstin}}'],
    ],
  },
  {
    title: 'Purchase',
    fields: [
      ['Plan / Product', '{{planName}}'],
      ['Product Description', '{{productDescription}}'],
      ['Quantity', '{{quantity}}'],
      ['Base Amount', '{{baseAmount}}'],
      ['Discount', '{{discountAmount}}'],
      ['Tax', '{{taxAmount}}'],
      ['Total Amount', '{{totalAmount}}'],
    ],
  },
  {
    title: 'Invoice & Payment',
    fields: [
      ['Invoice Number', '{{invoiceNumber}}'],
      ['Invoice Date', '{{invoiceDate}}'],
      ['Due Date', '{{dueDate}}'],
      ['Payment Status', '{{paymentStatus}}'],
      ['Transaction ID', '{{transactionId}}'],
      ['Currency', '{{currency}}'],
      ['Paid Stamp', '{{paidStampText}}'],
    ],
  },
];

function ShapesIcon(props: any) {
  return (
    <div className="grid grid-cols-2 gap-0.5" {...props}>
      <Square size={8} />
      <Circle size={8} />
      <Triangle size={10} />
      <div className="w-2 h-2 bg-current rounded-sm" />
    </div>
  )
}

export function SidebarLeft() {
  const [activeSection, setActiveSection] = useState('elements');
  const { canvas } = useEditorStore();

  const addText = (text: string, fontSize: number = 20, isBold: boolean = false) => {
    if (!canvas) return;
    const t = new fabric.IText(text, {
      left: 100,
      top: 100,
      fontSize,
      fontFamily: 'Inter',
      fontWeight: isBold ? 'bold' : 'normal',
      fill: '#333',
    });
    canvas.add(t);
    canvas.setActiveObject(t);
    canvas.renderAll();
  };

  const addMappedField = (label: string, token: string) => {
    addText(`${label}: ${token}`, 16, false);
  };

  const addShape = (type: 'rect' | 'circle' | 'triangle') => {
    if (!canvas) return;
    let shape;
    const common = { left: 150, top: 150, fill: '#3B82F6', width: 100, height: 100 };
    
    if (type === 'rect') shape = new fabric.Rect(common);
    if (type === 'circle') shape = new fabric.Circle({ ...common, radius: 50 });
    if (type === 'triangle') shape = new fabric.Triangle(common);
    
    if (shape) {
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files?.[0]) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (f) => {
      const data = f.target?.result as string;
      fabric.Image.fromURL(data, (img) => {
        // Scale down if too large
        if (img.width! > 400) {
          img.scaleToWidth(400);
        }
        
        img.set({
          left: 100,
          top: 100,
        });
        
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      });
    };
    
    reader.readAsDataURL(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="w-72 border-r border-slate-200 bg-white flex overflow-hidden">
      <input 
        type="file" 
        id="image-upload" 
        className="hidden" 
        accept="image/*" 
        onChange={handleImageUpload} 
      />
      {/* Mini Rail */}
      <div className="w-20 border-r border-slate-100 flex flex-col items-center py-4 gap-4 bg-slate-50/50">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex flex-col items-center gap-1 p-2 w-full transition-all group ${
              activeSection === s.id ? 'text-blue-600 border-l-2 border-blue-600 bg-white' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <s.icon size={22} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-tight">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
           <div className="relative flex-1">
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               placeholder={`Search ${activeSection}...`} 
               className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-none"
             />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          {activeSection === 'text' && (
            <div className="flex flex-col gap-3">
              <button onClick={() => addText('Add a heading', 48, true)} className="w-full text-left p-4 bg-slate-50 rounded-lg hover:ring-1 hover:ring-blue-500 transition-all font-bold text-2xl">Heading</button>
              <button onClick={() => addText('Add a subheading', 28, true)} className="w-full text-left p-3 bg-slate-50 rounded-lg hover:ring-1 hover:ring-blue-500 transition-all font-semibold text-lg text-slate-700">Subheading</button>
              <button onClick={() => addText('Add body text', 16)} className="w-full text-left p-3 bg-slate-50 rounded-lg hover:ring-1 hover:ring-blue-500 transition-all text-sm text-slate-500">Body Text</button>
              
              <div className="mt-4 flex flex-col gap-2">
                 <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Styles</span>
                 <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => addText('INVOICE', 64, true)} className="h-12 bg-slate-100 rounded flex items-center justify-center font-black text-xs">INVOICE</button>
                    <button onClick={() => addText('Thank You', 32)} className="h-12 bg-slate-100 rounded flex items-center justify-center italic text-xs font-serif">Thank You</button>
                 </div>
              </div>
            </div>
          )}

          {activeSection === 'elements' && (
            <div className="flex flex-col gap-6">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 block">Shapes</span>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => addShape('rect')} className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200"><Square size={24} className="text-slate-600" /></button>
                  <button onClick={() => addShape('circle')} className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200"><Circle size={24} className="text-slate-600" /></button>
                  <button onClick={() => addShape('triangle')} className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200"><Triangle size={24} className="text-slate-600" /></button>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 block">Icons</span>
                <div className="grid grid-cols-4 gap-2">
                  {[Star, QrCode, Barcode, Grid2X2, CaseUpper].map((Icon, i) => (
                     <button key={i} className="aspect-square bg-slate-50 rounded flex items-center justify-center hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-200 text-slate-500">
                        <Icon size={18} />
                     </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'tables' && (
            <div className="flex flex-col gap-4">
               <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Presets</span>
               <button 
                 onClick={() => canvas && createInvoiceTable(canvas)}
                 className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-white transition-all text-left"
               >
                  <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center text-blue-600">
                     <Table size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Invoice Table</div>
                    <div className="text-[10px] text-slate-500">Items, Qty, Price, Total</div>
                  </div>
               </button>
               <div className="rounded-xl border border-slate-200 bg-white p-3">
                 <div className="text-xs font-black text-slate-700">Selected Table</div>
                 <p className="mt-1 text-[10px] leading-4 text-slate-500">Select an invoice table on the canvas, then add rows or columns.</p>
                 <div className="mt-3 grid grid-cols-2 gap-2">
                   <button
                     onClick={() => canvas && !addInvoiceTableRow(canvas) && alert('Select an invoice table first.')}
                     className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-bold text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                   >
                     Add Row
                   </button>
                   <button
                     onClick={() => canvas && !addInvoiceTableColumn(canvas) && alert('Select an invoice table first.')}
                     className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-bold text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                   >
                     Add Column
                   </button>
                 </div>
               </div>
            </div>
          )}

          {activeSection === 'uploads' && (
            <div className="flex flex-col gap-4">
               <label 
                 htmlFor="image-upload"
                 className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer"
               >
                  <Upload size={24} className="text-blue-500" />
                  <span className="text-xs font-bold">Upload Files</span>
                  <span className="text-[10px] text-slate-400 text-center">Images or Logos (SVG, PNG, JPG)</span>
               </label>
            </div>
          )}

          {activeSection === 'mapping' && (
            <div className="flex flex-col gap-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                <div className="text-xs font-black text-blue-700">App Payload Mapping</div>
                <p className="mt-1 text-[10px] leading-4 text-blue-700/80">Click any field to place it on the invoice. These values are fetched automatically from the student, subscription, plan, and payment payload when the invoice is generated.</p>
              </div>
              {mappingGroups.map((group) => (
                <div key={group.title} className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{group.title}</span>
                  <div className="grid grid-cols-1 gap-2">
                    {group.fields.map(([label, token]) => (
                      <button
                        key={token}
                        onClick={() => addMappedField(label, token)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition-all hover:border-blue-300 hover:bg-blue-50"
                      >
                        <span className="block text-xs font-bold text-slate-700">{label}</span>
                        <span className="mt-0.5 block font-mono text-[10px] text-blue-600">{token}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={() => addText('Bill To\n{{userName}}\n{{userEmail}}\n{{userMobile}}\n{{customerAddress}}', 16, true)}
                className="rounded-lg border border-slate-200 bg-slate-900 px-3 py-3 text-left text-xs font-bold text-white hover:bg-slate-800"
              >
                Insert Billing Block
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
