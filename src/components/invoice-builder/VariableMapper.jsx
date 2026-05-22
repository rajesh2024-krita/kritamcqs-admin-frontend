/**
 * VariableMapper — Accordion listing all mapping variables with search filter and copy buttons.
 * Converted from TypeScript for the admin Invoice Pro integration.
 * @license SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { useInvoiceBuilderStore, MAPPING_VARIABLES } from './useInvoiceBuilderStore';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Variable,
  Info,
  Search,
} from 'lucide-react';
import { copyVariable } from './exportUtils';

export function VariableMapper() {
  const { variableMapperOpen, setVariableMapperOpen } = useInvoiceBuilderStore();
  const [search, setSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);
  const [hoveredVar, setHoveredVar] = useState(null);

  const filteredVars = MAPPING_VARIABLES.filter(
    (v) =>
      v.label.toLowerCase().includes(search.toLowerCase()) ||
      v.key.toLowerCase().includes(search.toLowerCase()) ||
      v.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = useCallback(async (variable) => {
    const success = await copyVariable(variable);
    if (success) {
      setCopiedKey(variable);
      setTimeout(() => setCopiedKey(null), 1500);
    }
  }, []);

  return (
    <div className="variable-mapper">
      {/* Accordion Header */}
      <button
        onClick={() => setVariableMapperOpen(!variableMapperOpen)}
        className="variable-mapper-header"
      >
        <div className="vm-header-left">
          <div className="vm-icon">
            <Variable size={16} />
          </div>
          <div>
            <span className="vm-title">Mapping Variables</span>
            <span className="vm-count">{MAPPING_VARIABLES.length} variables</span>
          </div>
        </div>
        {variableMapperOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>

      {/* Accordion Content */}
      {variableMapperOpen && (
        <div className="variable-mapper-content">
          {/* Search */}
          <div className="vm-search">
            <Search size={14} className="vm-search-icon" />
            <input
              type="text"
              placeholder="Search variables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="vm-search-input"
            />
          </div>

          {/* Variable List */}
          <div className="vm-list">
            {filteredVars.map((variable) => (
              <div
                key={variable.key}
                className="vm-item"
                onMouseEnter={() => setHoveredVar(variable.key)}
                onMouseLeave={() => setHoveredVar(null)}
              >
                <div className="vm-item-main">
                  <div className="vm-item-info">
                    <div className="vm-item-top">
                      <code className="vm-item-key">{variable.key}</code>
                      <span className="vm-item-label">{variable.label}</span>
                    </div>
                    <p className="vm-item-desc">{variable.description}</p>
                    {variable.example && (
                      <p className="vm-item-example">
                        <span className="example-prefix">Example:</span> {variable.example}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleCopy(variable.key)}
                    className={`vm-copy-btn ${copiedKey === variable.key ? 'copied' : ''}`}
                    title={`Copy ${variable.key}`}
                  >
                    {copiedKey === variable.key ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>

                {/* Tooltip on hover */}
                {hoveredVar === variable.key && (
                  <div className="vm-tooltip">
                    <Info size={12} />
                    <span>
                      Use <code>{variable.key}</code> in your HTML or CSS template. It will be
                      replaced automatically with real data in the preview and exports.
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredVars.length === 0 && (
            <div className="vm-empty">
              <Variable size={24} className="vm-empty-icon" />
              <p>No variables match your search</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}