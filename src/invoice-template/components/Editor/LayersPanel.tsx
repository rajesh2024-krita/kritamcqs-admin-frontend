/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { 
  Layers, Eye, EyeOff, Lock, Unlock, 
  ChevronDown, ChevronRight, Hash, Type, 
  Square, Circle, Image as ImageIcon
} from 'lucide-react';
import { fabric } from 'fabric';

export function LayersPanel() {
  const { canvas, pushHistory } = useEditorStore();
  const [objects, setObjects] = useState<fabric.Object[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!canvas) return;

    const updateLayers = () => {
      // Get objects in reverse order (top to bottom)
      const objs = [...canvas.getObjects()].reverse();
      setObjects(objs);
      
      const active = canvas.getActiveObject();
      // @ts-ignore
      setSelectedId(active ? active._id || null : null);
    };

    updateLayers();
    canvas.on('object:added', updateLayers);
    canvas.on('object:removed', updateLayers);
    canvas.on('selection:created', updateLayers);
    canvas.on('selection:cleared', updateLayers);
    canvas.on('object:modified', updateLayers);

    return () => {
      canvas.off('object:added', updateLayers);
      canvas.off('object:removed', updateLayers);
    };
  }, [canvas]);

  const selectObject = (obj: fabric.Object) => {
    if (!canvas) return;
    canvas.setActiveObject(obj);
    canvas.renderAll();
  };

  const toggleVisibility = (obj: fabric.Object, e: React.MouseEvent) => {
    e.stopPropagation();
    obj.visible = !obj.visible;
    canvas?.renderAll();
    setObjects([...objects]);
  };

  const toggleLock = (obj: fabric.Object, e: React.MouseEvent) => {
    e.stopPropagation();
    // @ts-ignore
    obj.selectable = !obj.selectable;
    // @ts-ignore
    obj.evented = obj.selectable;
    canvas?.renderAll();
    setObjects([...objects]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'i-text':
      case 'text': return <Type size={12} />;
      case 'rect': return <Square size={12} />;
      case 'circle': return <Circle size={12} />;
      case 'image': return <ImageIcon size={12} />;
      default: return <Hash size={12} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="px-4 py-2 border-b border-slate-200 flex items-center justify-between bg-white/80 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-slate-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Layers</span>
        </div>
        <span className="text-[9px] font-mono text-slate-400">{objects.length} Objects</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {objects.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
             <span className="text-[10px] font-medium italic">Empty Canvas</span>
          </div>
        ) : (
          <div className="flex flex-col">
            {objects.map((obj, i) => {
              // @ts-ignore
              const isPage = obj.isPage;
              if (isPage) return null; // Don't show page object in layers

              const isActive = canvas?.getActiveObjects().includes(obj);

              return (
                <div 
                  key={i}
                  onClick={() => selectObject(obj)}
                  className={`group flex items-center gap-3 px-4 py-2 cursor-pointer transition-all border-b border-slate-100/50 ${
                    isActive ? 'bg-blue-50/80 border-l-2 border-l-blue-500' : 'hover:bg-white'
                  }`}
                >
                  <div className={`p-1.5 rounded ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    {getIcon(obj.type || '')}
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <span className={`text-[10px] truncate font-medium ${isActive ? 'text-blue-700' : 'text-slate-600'}`}>
                      {obj.type === 'i-text' ? (obj as fabric.IText).text?.slice(0, 20) || 'Text' : obj.type}
                    </span>
                    <span className="text-[8px] text-slate-400 uppercase tracking-tighter">Layer {objects.length - i}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => toggleVisibility(obj, e)}
                      className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
                    >
                      {obj.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                    <button 
                      onClick={(e) => toggleLock(obj, e)}
                      className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
                    >
                      {obj.selectable ? <Unlock size={12} /> : <Lock size={12} className="text-amber-500" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
