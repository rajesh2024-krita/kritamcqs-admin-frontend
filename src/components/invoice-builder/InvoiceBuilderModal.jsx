/**
 * InvoiceBuilderModal — Full-screen modal wrapping the Pro invoice editor
 * (CodeEditor + LivePreview + VariableMapper + MediaLibrary).
 *
 * Replaces the old basic textarea editor in InvoiceSystemPage.jsx.
 * Uses the bridged Zustand store (useInvoiceBuilderStore) so all child
 * components work without persist middleware.
 *
 * @license SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useInvoiceBuilderStore } from './useInvoiceBuilderStore';
import { CodeEditor } from './CodeEditor';
import { LivePreview } from './LivePreview';
import { VariableMapper } from './VariableMapper';
import { MediaLibrary } from './MediaLibrary';
import { cn, ui } from '../../ui';
import {
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';

/**
 * @param {object} props
 * @param {string} props.templateName
 * @param {(v: string) => void} props.onTemplateNameChange
 * @param {object|null} props.editorTemplate
 * @param {string} props.initialHtml
 * @param {string} props.initialCss
 * @param {object} props.invoiceForm
 * @param {object} props.totals
 * @param {boolean} props.fullscreen
 * @param {(v: boolean) => void} props.onFullscreenChange
 * @param {boolean} props.saving
 * @param {(data: {htmlCode: string, cssCode: string}) => void} props.onSave
 * @param {(data: {htmlCode: string, cssCode: string}) => void} props.onSaveAsNew
 * @param {(data: {htmlCode: string, cssCode: string}) => void} props.onSaveAndActivate
 * @param {() => void} props.onClose
 */
export function InvoiceBuilderModal({
  templateName,
  onTemplateNameChange,
  editorTemplate,
  initialHtml,
  initialCss,
  invoiceForm,
  totals,
  fullscreen,
  onFullscreenChange,
  saving,
  onSave,
  onSaveAsNew,
  onSaveAndActivate,
  onClose,
}) {
  const store = useInvoiceBuilderStore();
  const initRef = useRef(false);

  // Sync store with parent data on mount and when invoice form changes
  useEffect(() => {
    store.initFromParent(invoiceForm, totals);
    initRef.current = true;
  }, []);

  useEffect(() => {
    if (initRef.current) {
      store.initFromParent(invoiceForm, totals);
    }
  }, [invoiceForm, totals]);

  // Initialise editor code from parent props (only on first open)
  useEffect(() => {
    store.setHtmlCode(initialHtml);
    store.setCssCode(initialCss);
    store.setFullscreen(fullscreen);
  }, []);

  // Keep fullscreen in sync
  useEffect(() => {
    store.setFullscreen(fullscreen);
  }, [fullscreen]);

  // Bubble fullscreen changes up
  useEffect(() => {
    // Subscribing via effect — use store's isFullscreen
    const unsub = useInvoiceBuilderStore.subscribe((state) => {
      if (state.isFullscreen !== fullscreen) {
        onFullscreenChange(state.isFullscreen);
      }
    });
    return unsub;
  }, [fullscreen, onFullscreenChange]);

  const {
    variableMapperOpen,
    setVariableMapperOpen,
    mediaLibraryOpen,
    setMediaLibraryOpen,
  } = store;

  const [leftPanelCollapsed, setLeftPanelCollapsed] = React.useState(false);

  const handleSave = useCallback(() => {
    const { htmlCode, cssCode } = useInvoiceBuilderStore.getState();
    onSave({ htmlCode, cssCode });
  }, [onSave]);

  const handleSaveAsNew = useCallback(() => {
    const { htmlCode, cssCode } = useInvoiceBuilderStore.getState();
    onSaveAsNew({ htmlCode, cssCode });
  }, [onSaveAsNew]);

  const handleSaveAndActivate = useCallback(() => {
    const { htmlCode, cssCode } = useInvoiceBuilderStore.getState();
    onSaveAndActivate({ htmlCode, cssCode });
  }, [onSaveAndActivate]);

  const isFullscreen = store.isFullscreen;

  return (
    <div className="invoice-pro-editor">
      {/* Modal backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-2 sm:p-4">
        <div
          className={`flex flex-col overflow-hidden bg-white shadow-2xl ${
            isFullscreen
              ? 'fixed inset-0 max-h-none w-screen max-w-none rounded-none'
              : 'max-h-[96vh] w-full max-w-[1500px] rounded-xl'
          }`}
        >
          {/* --- Header bar — matches original modal styling --- */}
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className={ui.eyebrow}>Invoice Pro Template Editor</div>
              <h3 className="text-2xl font-black tracking-tight text-slate-900">
                {editorTemplate ? 'Edit Template' : 'Create Template'}
              </h3>
              <p className={ui.muted}>
                Write HTML + CSS with mapping variables. Use the Variable Mapper for available fields.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[260px_auto_auto_auto_auto_auto] sm:items-center">
              <input
                className={ui.input}
                value={templateName}
                onChange={(e) => onTemplateNameChange(e.target.value)}
                placeholder="Template name"
              />
              <button
                className={cn(ui.buttonBase, ui.buttonSecondary)}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                className={cn(ui.buttonBase, ui.buttonSecondary)}
                onClick={handleSaveAsNew}
                disabled={saving}
              >
                Save as New
              </button>
              <button
                className={cn(ui.buttonBase, ui.buttonPrimary)}
                onClick={handleSaveAndActivate}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save & Set Active'}
              </button>
              <button
                className={cn(ui.buttonBase, ui.buttonSecondary)}
                onClick={() => onFullscreenChange(!isFullscreen)}
              >
                {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
              </button>
              <button
                className={cn(ui.buttonBase, ui.buttonGhost)}
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>

          {/* --- Builder body --- */}
          <div className="builder-main">
            {/* Left Panel — Code Editor */}
            <div className={`builder-left ${leftPanelCollapsed ? 'collapsed' : ''}`}>
              {!leftPanelCollapsed && <CodeEditor />}
            </div>

            {/* Panel Resizer / Collapse Toggle */}
            <button
              onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
              className="panel-toggle"
              title={leftPanelCollapsed ? 'Expand Editor' : 'Collapse Editor'}
            >
              {leftPanelCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>

            {/* Right Panel — Preview + Accordions */}
            <div className="builder-right">
              {/* Accordion Panels */}
              <div className="accordion-stack">
                <VariableMapper />
                <MediaLibrary />
              </div>

              {/* Live Preview */}
              <LivePreview />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}