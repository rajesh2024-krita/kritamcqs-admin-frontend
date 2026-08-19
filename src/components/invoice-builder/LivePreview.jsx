/**
 * LivePreview — Real-time iframe preview with zoom, scroll, fullscreen, and export controls.
 * Converted from TypeScript for the admin Invoice Pro integration.
 * @license SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useInvoiceBuilderStore } from './useInvoiceBuilderStore';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Printer,
  Download,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  RefreshCw,
  Settings,
  Layout,
  Grid,
  Maximize,
  Minimize,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  File,
  FileCheck,
  Clipboard,
  Printer as PrinterIcon,
  ExternalLink
} from 'lucide-react';
import { exportToPDF, printInvoice, copyInvoiceHtml, downloadInvoiceHtml } from './exportUtils';

export function LivePreview() {
  const {
    getPreviewDoc,
    zoom,
    zoomIn,
    zoomOut,
    zoomToFit,
    isFullscreen,
    toggleFullscreen,
    setFullscreen,
    invoiceForm,
  } = useInvoiceBuilderStore();

  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [htmlCopied, setHtmlCopied] = useState(false);
  const [scrollPos, setScrollPos] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(true);

  const previewDoc = getPreviewDoc();

  // Derive invoiceData for export filenames (mirrors original store's invoiceData)
  const invoiceData = invoiceForm
    ? { invoice_number: invoiceForm.invoiceNumber || 'INV' }
    : null;

  // Update iframe content when code changes
  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(previewDoc);
        doc.close();
      }
    }
  }, [previewDoc]);

  // Listen for Escape to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setFullscreen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, setFullscreen]);

  const handleExportPdf = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportToPDF(previewDoc, invoiceData);
    } finally {
      setIsExporting(false);
    }
  }, [previewDoc, invoiceData]);

  const handlePrint = useCallback(() => {
    printInvoice(previewDoc);
  }, [previewDoc]);

  const handleCopyHtml = useCallback(async () => {
    const success = await copyInvoiceHtml(previewDoc);
    if (success) {
      setHtmlCopied(true);
      setTimeout(() => setHtmlCopied(false), 2000);
    }
  }, [previewDoc]);

  const handleDownloadHtml = useCallback(() => {
    downloadInvoiceHtml(previewDoc, invoiceData);
  }, [previewDoc, invoiceData]);

  const handleScroll = useCallback(
    (direction) => {
      const container = containerRef.current;
      if (!container) return;
      const step = 100;
      const newPos = { ...scrollPos };
      switch (direction) {
        case 'up':
          newPos.y = Math.max(0, newPos.y - step);
          break;
        case 'down':
          newPos.y = newPos.y + step;
          break;
        case 'left':
          newPos.x = Math.max(0, newPos.x - step);
          break;
        case 'right':
          newPos.x = newPos.x + step;
          break;
      }
      setScrollPos(newPos);
      container.scrollTo({ left: newPos.x, top: newPos.y, behavior: 'smooth' });
    },
    [scrollPos]
  );

  const previewContent = (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200/60 overflow-hidden">
      {/* Preview Toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-slate-50/50 border-b border-slate-200/50">
        <div className="flex items-center gap-2">
          <Eye size={12} className="text-indigo-600" />
          <span className="text-[8px] font-medium text-slate-600">Live Preview</span>
          <span className="inline-flex px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[6px] font-medium text-emerald-700">
            Auto-reload
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Zoom Controls */}
          <div className="flex items-center gap-0.5 bg-white rounded-lg border border-slate-200 px-1 py-0.5">
            <button
              onClick={zoomOut}
              className="p-0.5 rounded hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
              title="Zoom Out"
            >
              <ZoomOut size={12} />
            </button>
            <span className="text-[8px] font-medium text-slate-600 min-w-[32px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-0.5 rounded hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
              title="Zoom In"
            >
              <ZoomIn size={12} />
            </button>
            <button
              onClick={zoomToFit}
              className="p-0.5 rounded hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
              title="Reset Zoom"
            >
              <RotateCcw size={10} />
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={handleCopyHtml}
            className="p-1 rounded hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
            title="Copy HTML"
          >
            {htmlCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
          </button>
          <button
            onClick={handlePrint}
            className="p-1 rounded hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
            title="Print Invoice"
          >
            <Printer size={12} />
          </button>
          <button
            onClick={handleDownloadHtml}
            className="p-1 rounded hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
            title="Download HTML"
          >
            <Download size={12} />
          </button>
          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[7px] font-medium rounded-lg transition-colors shadow-sm shadow-indigo-500/25 disabled:opacity-50"
            title="Export PDF"
          >
            {isExporting ? (
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Download size={10} />
                <span>PDF</span>
              </>
            )}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1 rounded hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div
        className="flex-1 relative overflow-auto bg-slate-100"
        ref={containerRef}
      >
        {/* Scroll Controls - Vertical */}
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-10">
          <button
            onClick={() => handleScroll('up')}
            className="p-0.5 rounded bg-white/80 hover:bg-white shadow-sm border border-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
            title="Scroll Up"
          >
            <ChevronUp size={12} />
          </button>
          <button
            onClick={() => handleScroll('down')}
            className="p-0.5 rounded bg-white/80 hover:bg-white shadow-sm border border-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
            title="Scroll Down"
          >
            <ChevronDown size={12} />
          </button>
        </div>

        {/* Scroll Controls - Horizontal */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5 z-10">
          <button
            onClick={() => handleScroll('left')}
            className="p-0.5 rounded bg-white/80 hover:bg-white shadow-sm border border-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
            title="Scroll Left"
          >
            <ChevronLeft size={12} />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="p-0.5 rounded bg-white/80 hover:bg-white shadow-sm border border-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
            title="Scroll Right"
          >
            <ChevronRight size={12} />
          </button>
        </div>

        {/* iFrame Preview */}
        <div
          className="preview-iframe-wrapper"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: `${100 / zoom}%`,
            height: `${100 / zoom}%`,
          }}
        >
          <iframe
            ref={iframeRef}
            srcDoc={previewDoc}
            title="Invoice Live Preview"
            sandbox="allow-same-origin allow-scripts"
            className="w-full h-full border-0 bg-white"
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-50/50 border-t border-slate-200/50">
        <div className="flex items-center gap-2 text-[7px] text-slate-400">
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          <span className="text-slate-300">|</span>
          <span>Document: {invoiceData?.invoice_number || 'INV'}</span>
        </div>
        <div className="flex items-center gap-2 text-[7px] text-slate-400">
          <span className="flex items-center gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Live
          </span>
          <span className="text-slate-300">|</span>
          <span>v{Math.round(zoom * 100)}%</span>
        </div>
      </div>
    </div>
  );

  // If fullscreen, render at portal level
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[60] bg-slate-900/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <Eye size={16} className="text-indigo-400" />
            <span className="text-sm font-semibold text-white">Invoice Preview — Fullscreen</span>
            <span className="inline-flex px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/20 rounded text-[7px] font-medium text-emerald-400">
              Live
            </span>
          </div>
          <button
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white text-[9px] font-medium rounded-lg transition-colors"
          >
            <Minimize2 size={14} />
            Exit Fullscreen
          </button>
        </div>
        <div className="flex-1 overflow-hidden p-4">
          {previewContent}
        </div>
      </div>
    );
  }

  return previewContent;
}