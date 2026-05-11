/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';

export function Toolbar() {
  const { undo, redo, historyIndex, history } = useEditorStore();

  return (
    <div className="z-50 flex h-12 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="font-bold text-lg tracking-tighter text-blue-600">INVOICE<span className="text-slate-900">PRO</span></span>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Editor</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={undo} disabled={historyIndex <= 0} className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-30" title="Undo">
          <Undo2 size={16} />
        </button>
        <button onClick={redo} disabled={historyIndex >= history.length - 1} className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-30" title="Redo">
          <Redo2 size={16} />
        </button>
        <div className="h-5 w-px bg-slate-200" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Use the side panels for insert, mapping, properties, layers, and export actions</span>
      </div>
    </div>
  );
}
