/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Toolbar } from './Toolbar';
import { SidebarLeft } from './SidebarLeft';
import { SidebarRight } from './SidebarRight';
import { CanvasArea } from './CanvasArea';
import { LayersPanel } from './LayersPanel';
import { ChevronDown, ChevronRight, Layers, SlidersHorizontal } from 'lucide-react';

export function Editor() {
  const [openPanels, setOpenPanels] = useState({ properties: true, layers: true });

  useEffect(() => {
    // Initial setup if needed
  }, []);

  return (
    <div id="editor-container" className="flex min-h-[760px] h-[calc(100vh-190px)] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-[#F0F2F5] font-sans text-slate-900 shadow-sm">
      {/* Top Toolbar */}
      <Toolbar />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        <SidebarLeft />

        {/* Main Workspace */}
        <div className="flex-1 relative overflow-hidden bg-slate-100 flex flex-col">
           <CanvasArea />
        </div>

        {/* Right Panels (Properties + Layers) */}
        <div className="sticky right-0 top-0 z-20 flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white animate-in slide-in-from-right duration-300">
          <AccordionHeader
            icon={SlidersHorizontal}
            label="Properties"
            open={openPanels.properties}
            onClick={() => setOpenPanels((current) => ({ ...current, properties: !current.properties }))}
          />
          {openPanels.properties ? (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <SidebarRight />
            </div>
          ) : null}
          <AccordionHeader
            icon={Layers}
            label="Layers"
            open={openPanels.layers}
            onClick={() => setOpenPanels((current) => ({ ...current, layers: !current.layers }))}
          />
          {openPanels.layers ? (
            <div className="h-72 overflow-y-auto bg-slate-50/50">
              <LayersPanel />
            </div>
          ) : null}
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-8 bg-white border-t border-slate-200 flex items-center justify-between px-4 text-[10px] uppercase tracking-wider font-medium text-slate-500">
        <div className="flex items-center gap-4">
          <span>Ready</span>
          <span className="flex items-center gap-1">
             <div className="w-2 h-2 rounded-full bg-emerald-500" />
             Autosaved
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>Page 1 of 1</span>
          <span>794 x 1123 px</span>
        </div>
      </div>
    </div>
  );
}

function AccordionHeader({ icon: Icon, label, open, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="flex h-10 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500"
    >
      <span className="flex items-center gap-2"><Icon size={14} />{label}</span>
      {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
    </button>
  );
}
