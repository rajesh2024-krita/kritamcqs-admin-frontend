/**
 * CodeEditor — Tabbed HTML/CSS editor with word wrap, copy, and Tab indentation.
 * Converted from TypeScript for the admin Invoice Pro integration.
 * @license SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useCallback, useState } from 'react';
import { useInvoiceBuilderStore } from './useInvoiceBuilderStore';
import {
  Code2,
  Copy,
  Check,
  WrapText,
  Eye,
  FileCode2,
} from 'lucide-react';

export function CodeEditor() {
  const {
    htmlCode,
    cssCode,
    setHtmlCode,
    setCssCode,
    activeEditorTab,
    setActiveEditorTab,
  } = useInvoiceBuilderStore();

  const htmlRef = useRef(null);
  const cssRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);

  const currentCode = activeEditorTab === 'html' ? htmlCode : cssCode;
  const currentRef = activeEditorTab === 'html' ? htmlRef : cssRef;

  const handleChange = useCallback(
    (e) => {
      if (activeEditorTab === 'html') {
        setHtmlCode(e.target.value);
      } else {
        setCssCode(e.target.value);
      }
    },
    [activeEditorTab, setHtmlCode, setCssCode]
  );

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [currentCode]);

  const handleKeyDown = useCallback(
    (e) => {
      // Tab key support
      if (e.key === 'Tab') {
        e.preventDefault();
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        const newValue = value.substring(0, start) + '  ' + value.substring(end);

        if (activeEditorTab === 'html') {
          setHtmlCode(newValue);
        } else {
          setCssCode(newValue);
        }

        // Restore cursor position after React re-render
        requestAnimationFrame(() => {
          textarea.selectionStart = start + 2;
          textarea.selectionEnd = start + 2;
        });
      }
    },
    [activeEditorTab, setHtmlCode, setCssCode]
  );

  const lineCount = currentCode.split('\n').length;
  const charCount = currentCode.length;

  return (
    <div className="code-editor-panel">
      {/* Editor Header */}
      <div className="editor-header">
        <div className="editor-header-left">
          <div className="editor-icon-wrapper">
            <Code2 size={16} />
          </div>
          <div>
            <h3 className="editor-title">HTML/CSS Editor</h3>
            <p className="editor-subtitle">Write your invoice template code</p>
          </div>
        </div>
        <div className="editor-header-actions">
          <button
            onClick={() => setWordWrap(!wordWrap)}
            className={`editor-action-btn ${wordWrap ? 'active' : ''}`}
            title="Toggle word wrap"
          >
            <WrapText size={15} />
          </button>
          <button onClick={handleCopy} className="editor-action-btn" title="Copy code">
            {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
          </button>
        </div>
      </div>

      {/* Tab Switch */}
      <div className="editor-tabs">
        <button
          onClick={() => setActiveEditorTab('html')}
          className={`editor-tab ${activeEditorTab === 'html' ? 'active' : ''}`}
        >
          <FileCode2 size={14} />
          <span>HTML</span>
        </button>
        <button
          onClick={() => setActiveEditorTab('css')}
          className={`editor-tab ${activeEditorTab === 'css' ? 'active' : ''}`}
        >
          <Eye size={14} />
          <span>CSS</span>
        </button>
      </div>

      {/* Code Textarea */}
      <div className="editor-textarea-container">
        <textarea
          ref={currentRef}
          value={currentCode}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={`editor-textarea ${wordWrap ? 'word-wrap' : ''}`}
          spellCheck={false}
          placeholder={
            activeEditorTab === 'html'
              ? '<!-- Write your invoice HTML here... -->\n<!-- Use variables like {{customer_name}}, {{invoice_number}}, etc. -->'
              : '/* Write your invoice CSS styles here... */'
          }
        />
      </div>

      {/* Status Bar */}
      <div className="editor-statusbar">
        <span className="status-item">
          <span className="status-dot html-dot" />
          {activeEditorTab.toUpperCase()}
        </span>
        <span className="status-item">Lines: {lineCount}</span>
        <span className="status-item">Chars: {charCount.toLocaleString()}</span>
      </div>
    </div>
  );
}