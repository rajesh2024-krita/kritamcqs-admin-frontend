/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { useEditorStore } from '../../store/useEditorStore';
import { PAGE_HEIGHT, PAGE_WIDTH } from '../../constants/editor';

export function CanvasArea() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setCanvas, setSelectedObjects, pushHistory, zoom, setZoom } = useEditorStore();
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // Initialize Fabric Canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: '#F0F2F5',
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = canvas;
    setCanvas(canvas);

    // Initial Page setup
    const page = new fabric.Rect({
      left: (canvas.width! - PAGE_WIDTH) / 2,
      top: 50,
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      fill: 'white',
      shadow: new fabric.Shadow({
        color: 'rgba(0,0,0,0.1)',
        blur: 10,
        offsetX: 0,
        offsetY: 2,
      }),
      selectable: false,
      hoverCursor: 'default',
      // @ts-ignore - custom property to identify background
      isPage: true,
    });

    canvas.add(page);
    canvas.sendToBack(page);

    // Event listeners
    const handleSelection = () => {
      setSelectedObjects(canvas.getActiveObjects());
    };

    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', () => setSelectedObjects([]));
    
    canvas.on('object:modified', () => {
      pushHistory();
    });

    // Panning support
    let isPanning = false;
    let lastPosX: number;
    let lastPosY: number;

    canvas.on('mouse:down', (opt) => {
      const evt = opt.e;
      // Pan with middle button, or Alt key, or Space (space handled via key events usually)
      if (evt.altKey || evt.button === 1) { 
        isPanning = true;
        canvas.selection = false;
        canvas.defaultCursor = 'grabbing';
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
        canvas.renderAll();
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (isPanning && opt.e) {
        const e = opt.e;
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += e.clientX - lastPosX;
          vpt[5] += e.clientY - lastPosY;
          canvas.requestRenderAll();
          lastPosX = e.clientX;
          lastPosY = e.clientY;
        }
      }
    });

    canvas.on('mouse:up', () => {
      isPanning = false;
      canvas.selection = true;
      canvas.defaultCursor = 'default';
      canvas.renderAll();
    });

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current) return;
      canvas.setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
      canvas.renderAll();
    });

    resizeObserver.observe(containerRef.current);

    // Center page initially
    setTimeout(() => {
      const page = canvas.getObjects().find(obj => (obj as any).isPage) as fabric.Rect;
      if (page) centerPage(canvas, page);
    }, 100);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      canvas.dispose();
    };
  }, []);

  const centerPage = (canvas: fabric.Canvas, page: fabric.Rect) => {
    const vWidth = canvas.getWidth();
    const vHeight = canvas.getHeight();
    if (!containerRef.current) return;
    
    // Calculate zoom to fit page with some margin
    const margin = 100;
    const zoomVal = Math.min(
        (vWidth - margin) / PAGE_WIDTH,
        (vHeight - margin) / PAGE_HEIGHT
    );
    
    canvas.setZoom(zoomVal);
    setZoom(zoomVal);
    
    // Center the page in the viewport
    const vpt = [...canvas.viewportTransform];
    vpt[4] = (vWidth / 2) - (PAGE_WIDTH * zoomVal / 2);
    vpt[5] = (vHeight / 2) - (PAGE_HEIGHT * zoomVal / 2);
    canvas.setViewportTransform(vpt as any);

    // Sync scrollbars
    containerRef.current.scrollLeft = 1000 - vpt[4];
    containerRef.current.scrollTop = 500 - vpt[5];
  };

  // Handle zooming via wheel
  const handleWheel = (e: React.WheelEvent) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (e.ctrlKey) {
      const delta = e.deltaY;
      let newZoom = canvas.getZoom();
      newZoom *= 0.999 ** delta;
      if (newZoom > 20) newZoom = 20;
      if (newZoom < 0.05) newZoom = 0.05;
      if (isNaN(newZoom)) return;

      const pointer = canvas.getPointer(e.nativeEvent);
      canvas.zoomToPoint(new fabric.Point(pointer.x, pointer.y), newZoom);
      setZoom(newZoom);
      e.preventDefault();
      e.stopPropagation();
    } else {
      // Standard scrolling/panning with mouse wheel
      const vpt = [...canvas.viewportTransform];
      if (e.shiftKey) {
        vpt[4] -= e.deltaY; // Horizontal scroll
      } else {
        vpt[5] -= e.deltaY; // Vertical scroll
      }
      canvas.setViewportTransform(vpt as any);
      canvas.requestRenderAll();
      e.preventDefault();
    }
  };

  const handleZoomUpdate = (newZoom: number) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || isNaN(newZoom)) return;
    
    // Zoom to center of screen
    const center = new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2);
    canvas.zoomToPoint(center, newZoom);
    setZoom(newZoom);
  };

  // Handle scrolling via native scrollbars
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !containerRef.current) return;
    
    const vpt = [...canvas.viewportTransform];
    vpt[4] = -containerRef.current.scrollLeft + 1000; // Offset by half of our sizer padding
    vpt[5] = -containerRef.current.scrollTop + 500;
    canvas.setViewportTransform(vpt as any);
    canvas.requestRenderAll();
  };

  return (
    <div 
      className="flex-1 relative outline-none bg-[#F0F2F5] flex flex-col min-w-0 min-h-0"
    >
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent group"
        onWheel={handleWheel}
        onScroll={handleScroll}
      >
        <div className="absolute top-0 left-0" style={{ width: PAGE_WIDTH * zoom + 2000, height: PAGE_HEIGHT * zoom + 2000 }}>
          {/* This sizer div creates scrollable area */}
        </div>
        <div className="sticky top-0 left-0 w-full h-full pointer-events-none">
           <canvas ref={canvasRef} className="pointer-events-auto" />
        </div>
      
        {/* Zoom Controls Overlay */}
        <div className="fixed bottom-6 right-80 flex items-center bg-white rounded-full shadow-lg border border-slate-200 px-3 py-1 gap-3 z-30">
           <button 
             onClick={() => {
               const canvas = fabricCanvasRef.current;
               const page = canvas?.getObjects().find(obj => (obj as any).isPage) as fabric.Rect;
               if (canvas && page) centerPage(canvas, page);
             }} 
             className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-500 text-[10px] font-bold px-2"
           >
             Center
           </button>
           <div className="w-px h-4 bg-slate-200 mx-1" />
           <button onClick={() => handleZoomUpdate(zoom * 0.9)} className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-600">-</button>
           <span className="text-[10px] font-bold text-slate-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
           <button onClick={() => handleZoomUpdate(zoom * 1.1)} className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-600">+</button>
        </div>
      </div>

      {/* Rulers Placeholder */}
      <div className="absolute top-0 left-0 w-full h-5 bg-white border-b border-slate-200 flex items-end pointer-events-none opacity-50">
         {Array.from({ length: 40 }).map((_, i) => (
           <div key={i} className="h-2 w-[50px] border-l border-slate-300 text-[8px] pl-1 font-mono">{i * 50}</div>
         ))}
      </div>
      <div className="absolute top-0 left-0 h-full w-5 bg-white border-r border-slate-200 flex flex-col items-end pointer-events-none opacity-50">
         {Array.from({ length: 60 }).map((_, i) => (
           <div key={i} className="w-2 h-[50px] border-t border-slate-300 text-[8px] pt-1 pr-1 font-mono orientation-sideways transform rotate-180" style={{ writingMode: 'vertical-rl' }}>{i * 50}</div>
         ))}
      </div>
    </div>
  );
}
