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

import React, { useEffect, useRef, useCallback, useState } from 'react';
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
  Save,
  Copy,
  CheckCircle,
  Layers,
  Maximize2,
  Minimize2,
  Palette,
  Code,
  Eye,
  Monitor,
  Smartphone,
  Tablet,
  Layout,
  Grid,
  Columns,
  ChevronDown,
  ChevronRight,
  Menu,
  Maximize,
  Minimize,
  Settings,
  Zap,
  Sparkles,
  RefreshCw,
  Download,
  Upload,
  Share2,
  Printer,
  File,
  Folder,
  HardDrive,
  Cloud,
  Server,
  Globe,
  Link,
  Type,
  Bold,
  Italic,
  Underline,
  List,
  Quote,
  Code as CodeIcon,
  Image,
  Video,
  Music
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
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-2 sm:p-3 animate-in fade-in duration-200">
        <div
          className={cn(
            "flex flex-col overflow-hidden bg-white shadow-2xl transition-all duration-300 h-screen",
            isFullscreen
              ? 'fixed inset-0 w-screen max-w-none rounded-none'
              : 'max-h-[94vh] w-full max-w-[1600px] rounded-xl border border-slate-200/60'
          )}
        >
          {/* --- Header Bar --- */}
          <div className="flex flex-col gap-2 border-b border-slate-200/60 bg-white/95 backdrop-blur-sm p-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25">
                <FileText size={14} className="text-white" />
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-indigo-600">
                  {editorTemplate ? 'Edit Template' : 'Create Template'}
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Invoice Pro Template Editor
                </h3>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <input
                className="w-full sm:w-48 px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={templateName}
                onChange={(e) => onTemplateNameChange(e.target.value)}
                placeholder="Template name"
              />
              <button
                className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[8px] font-medium text-slate-700 rounded-lg transition-colors disabled:opacity-50"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={10} /> {saving ? '...' : 'Save'}
              </button>
              <button
                className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[8px] font-medium text-slate-700 rounded-lg transition-colors disabled:opacity-50"
                onClick={handleSaveAsNew}
                disabled={saving}
              >
                <Copy size={10} /> Copy
              </button>
              <button
                className="inline-flex items-center gap-0.5 px-2.5 py-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-[8px] font-medium rounded-lg transition-all shadow-sm shadow-indigo-500/25 disabled:opacity-50"
                onClick={handleSaveAndActivate}
                disabled={saving}
              >
                <CheckCircle size={10} /> {saving ? '...' : 'Save & Activate'}
              </button>
              <button
                className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[8px] font-medium text-slate-700 rounded-lg transition-colors"
                onClick={() => onFullscreenChange(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
              </button>
              <button
                className="inline-flex items-center gap-0.5 px-2 py-0.5 hover:bg-slate-100 text-[8px] font-medium text-slate-600 rounded-lg transition-colors"
                onClick={onClose}
              >
                <X size={10} /> Close
              </button>
            </div>
          </div>

          {/* --- Mobile Tabs --- */}
          <div className="lg:hidden flex border-b border-slate-200/60 bg-slate-50/50 p-1 gap-0.5">
            {[
              { key: 'editor', label: 'Editor', icon: Code },
              { key: 'preview', label: 'Preview', icon: Eye },
              { key: 'variables', label: 'Variables', icon: Layers },
              { key: 'media', label: 'Media', icon: Image },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  className={cn(
                    "flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 text-[8px] font-medium rounded-lg transition-all",
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/25"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <Icon size={10} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* --- Builder Body --- */}
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            {/* Left Panel — Code Editor */}
            <div className={cn(
              "flex flex-col transition-all duration-300",
              leftPanelCollapsed ? "lg:w-12" : "lg:w-1/2",
              "lg:flex lg:border-r border-slate-200/60",
              activeTab !== 'editor' && "hidden lg:flex"
            )}>
              <div className="flex items-center justify-between p-1.5 bg-slate-50/50 border-b border-slate-200/50">
                <div className="flex items-center gap-1.5">
                  <Code size={12} className="text-indigo-600" />
                  <span className="text-[8px] font-medium text-slate-600">HTML + CSS</span>
                </div>
                <button
                  onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
                  className="p-0.5 rounded hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-600"
                  title={leftPanelCollapsed ? 'Expand Editor' : 'Collapse Editor'}
                >
                  {leftPanelCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
                </button>
              </div>
              {!leftPanelCollapsed && (
                <div className="flex-1 overflow-hidden">
                  <CodeEditor />
                </div>
              )}
            </div>

            {/* Right Panel — Preview + Accordions */}
            <div className={cn(
              "flex-1 flex flex-col overflow-hidden",
              activeTab !== 'preview' && activeTab !== 'variables' && activeTab !== 'media' && "lg:flex",
              activeTab === 'editor' && "hidden lg:flex"
            )}>
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Accordion Panels */}
                <div className={cn(
                  "border-b border-slate-200/60 bg-slate-50/50",
                  activeTab === 'variables' ? "block" : activeTab === 'media' ? "block" : "hidden lg:block"
                )}>
                  <div className="flex">
                    <VariableMapper />
                    <MediaLibrary />
                  </div>
                </div>

                {/* Live Preview */}
                <div className={cn(
                  "flex-1 overflow-hidden",
                  activeTab === 'preview' ? "block" : "hidden lg:block"
                )}>
                  <LivePreview />
                </div>
              </div>
            </div>
          </div>

          {/* --- Footer --- */}
          <div className="border-t border-slate-200/60 bg-white/95 backdrop-blur-sm px-3 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[7px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Live Preview
              </span>
              <span className="text-slate-300">|</span>
              <span>Variables: {store.variables?.length || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-[7px] text-slate-400">
              <span>v{store.version || '1.0'}</span>
              {isFullscreen && (
                <span className="text-indigo-600 font-medium">Fullscreen</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}