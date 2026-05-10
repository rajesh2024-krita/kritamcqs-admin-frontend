/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { Toolbar } from './Toolbar';
import { SidebarLeft } from './SidebarLeft';
import { SidebarRight } from './SidebarRight';
import { CanvasArea } from './CanvasArea';
import { LayersPanel } from './LayersPanel';
import { useEditorStore } from '../../store/useEditorStore';

export function Editor() {
  const { setActiveTab } = useEditorStore();

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
        <div className="w-80 border-l border-slate-200 bg-white flex flex-col animate-in slide-in-from-right duration-300">
          <div className="flex-1 overflow-y-auto">
            <SidebarRight />
          </div>
          <div className="h-64 border-t border-slate-200 overflow-y-auto bg-slate-50/50">
            <LayersPanel />
          </div>
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
