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
    <div
      className={`preview-container ${isFullscreen ? 'fullscreen' : ''}`}
      ref={containerRef}
    >
      {/* Preview Toolbar */}
      <div className="preview-toolbar">
        <div className="preview-toolbar-left">
          <span className="preview-label">Live Preview</span>
          <span className="preview-badge">Auto-reload</span>
        </div>

        <div className="preview-toolbar-center">
          <div className="zoom-controls">
            <button onClick={zoomOut} className="zoom-btn" title="Zoom Out">
              <ZoomOut size={16} />
            </button>
            <span className="zoom-value">{Math.round(zoom * 100)}%</span>
            <button onClick={zoomIn} className="zoom-btn" title="Zoom In">
              <ZoomIn size={16} />
            </button>
            <button onClick={zoomToFit} className="zoom-btn zoom-reset" title="Reset Zoom">
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        <div className="preview-toolbar-right">
          <button onClick={handleCopyHtml} className="preview-action-btn" title="Copy HTML">
            {htmlCopied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
          </button>
          <button onClick={handlePrint} className="preview-action-btn" title="Print Invoice">
            <Printer size={15} />
          </button>
          <button onClick={handleDownloadHtml} className="preview-action-btn" title="Download HTML">
            <Download size={15} />
          </button>
          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="preview-action-btn preview-action-btn-primary"
            title="Export PDF"
          >
            {isExporting ? (
              <span className="spinner-small" />
            ) : (
              <>
                <Download size={15} />
                <span className="export-pdf-text">PDF</span>
              </>
            )}
          </button>
          <button
            onClick={toggleFullscreen}
            className="preview-action-btn"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* Scroll Controls */}
      <div className="scroll-controls-v">
        <button
          onClick={() => handleScroll('up')}
          className="scroll-btn scroll-btn-top"
          title="Scroll Up"
        >
          <ChevronUp size={14} />
        </button>
        <button
          onClick={() => handleScroll('down')}
          className="scroll-btn scroll-btn-bottom"
          title="Scroll Down"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      <div className="scroll-controls-h">
        <button
          onClick={() => handleScroll('left')}
          className="scroll-btn scroll-btn-left"
          title="Scroll Left"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={() => handleScroll('right')}
          className="scroll-btn scroll-btn-right"
          title="Scroll Right"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* iFrame Preview */}
      <div className="preview-iframe-wrapper" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
        <iframe
          ref={iframeRef}
          srcDoc={previewDoc}
          title="Invoice Live Preview"
          sandbox="allow-same-origin allow-scripts"
          className="preview-iframe"
          style={{
            width: `${100 / zoom}%`,
            height: zoom < 1 ? `${100 / zoom}%` : '100%',
          }}
        />
      </div>
    </div>
  );

  // If fullscreen, render at portal level
  if (isFullscreen) {
    return (
      <div className="fullscreen-overlay">
        <div className="fullscreen-header">
          <span className="fullscreen-title">Invoice Preview — Fullscreen</span>
          <button onClick={toggleFullscreen} className="fullscreen-close-btn">
            <Minimize2 size={18} />
            Exit Fullscreen
          </button>
        </div>
        {previewContent}
      </div>
    );
  }

  return previewContent;
}