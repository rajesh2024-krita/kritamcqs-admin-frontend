/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fabric } from 'fabric';

export type TabType = 'Home' | 'Insert' | 'Design' | 'Layout' | 'References' | 'View' | 'Templates' | 'Export';

interface EditorState {
  canvas: fabric.Canvas | null;
  setCanvas: (canvas: fabric.Canvas) => void;
  // ... rest of the interface
}

export const useEditorStore = create<any>()(
  persist(
    (set, get) => ({
      canvas: null,
      setCanvas: (canvas: any) => set({ canvas }),
      
      activeTab: 'Home',
      setActiveTab: (activeTab: any) => set({ activeTab }),
      
      selectedObjects: [],
      setSelectedObjects: (selectedObjects: any) => set({ selectedObjects }),
      
      zoom: 1,
      setZoom: (zoom: any) => {
        const canvas = get().canvas;
        if (canvas) {
          canvas.setZoom(zoom);
          set({ zoom });
        }
      },
      
      history: [],
      historyIndex: -1,
      
      pushHistory: () => {
        const canvas = get().canvas;
        if (!canvas) return;
        
        const json = JSON.stringify(canvas.toJSON());
        const { history, historyIndex } = get();
        
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(json);
        
        if (newHistory.length > 50) newHistory.shift();
        
        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },
      
      undo: () => {
        const { canvas, history, historyIndex } = get();
        if (!canvas || historyIndex <= 0) return;
        
        const prevIndex = historyIndex - 1;
        const json = JSON.parse(history[prevIndex]);
        canvas.loadFromJSON(json, () => {
          canvas.renderAll();
          set({ historyIndex: prevIndex });
        });
      },
      
      redo: () => {
        const { canvas, history, historyIndex } = get();
        if (!canvas || historyIndex >= history.length - 1) return;
        
        const nextIndex = historyIndex + 1;
        const json = JSON.parse(history[nextIndex]);
        canvas.loadFromJSON(json, () => {
          canvas.renderAll();
          set({ historyIndex: nextIndex });
        });
      },
      
      invoiceData: {
        number: 'INV-' + Math.floor(Math.random() * 1000000),
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: 'USD',
        items: [],
        notes: '',
        terms: '',
      },
      setInvoiceData: (data: any) => set((state: any) => ({
        invoiceData: { ...state.invoiceData, ...data }
      })),
    }),
    {
      name: 'invoice-pro-storage',
      partialize: (state) => ({ invoiceData: state.invoiceData }), // Only persist data, not the canvas instance
    }
  )
);
