/**
 * MediaLibrary — Drag-and-drop image upload with thumbnail gallery and preview modal.
 * Uses crypto.randomUUID() instead of the `uuid` package to avoid extra dependencies.
 * Converted from TypeScript for the admin Invoice Pro integration.
 * @license SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef } from 'react';
import { useInvoiceBuilderStore } from './useInvoiceBuilderStore';
import { subscriptionService } from '../../api/subscriptionService';
import {
  ChevronDown,
  ChevronRight,
  Image,
  Upload,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Eye,
  X,
} from 'lucide-react';

/** Inline UUID generator — replaces the `uuid` package dependency. */
const generateId = () => crypto.randomUUID();

export function MediaLibrary() {
  const { uploadedImages, addImage, removeImage, mediaLibraryOpen, setMediaLibraryOpen } =
    useInvoiceBuilderStore();
  const fileInputRef = useRef(null);
  const [copiedId, setCopiedId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = useCallback(
    async (files) => {
      if (!files) return;
      setError('');
      setUploading(true);
      try {
        for (const file of Array.from(files)) {
          if (!file.type.startsWith('image/')) continue;
          const response = await subscriptionService.uploadInvoiceAsset(file);
          const asset = response.data || {};
          const storedUrl = asset.publicUrl || asset.url;
          if (!storedUrl) throw new Error('Upload completed but no image URL was returned');
          const newImage = {
            id: generateId(),
            name: file.name,
            dataUrl: storedUrl,
            url: storedUrl,
            publicUrl: storedUrl,
            relativeUrl: asset.url,
            html: asset.html || `<img src="${storedUrl}" alt="${file.name}" />`,
            size: file.size,
            createdAt: Date.now(),
          };
          addImage(newImage);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Image upload failed');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [addImage]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleCopyUrl = useCallback(
    async (img) => {
      await navigator.clipboard.writeText(img.publicUrl || img.url || img.dataUrl);
      setCopiedId(img.id);
      setTimeout(() => setCopiedId(null), 1500);
    },
    []
  );

  const handleCopyHtml = useCallback(async (img) => {
    const url = img.publicUrl || img.url || img.dataUrl;
    await navigator.clipboard.writeText(img.html || `<img src="${url}" alt="${img.name}" />`);
    setCopiedId(img.id);
    setTimeout(() => setCopiedId(null), 1500);
  }, []);

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="media-library">
      {/* Accordion Header */}
      <button
        onClick={() => setMediaLibraryOpen(!mediaLibraryOpen)}
        className="variable-mapper-header"
      >
        <div className="vm-header-left">
          <div className="vm-icon media-icon">
            <Image size={16} />
          </div>
          <div>
            <span className="vm-title">Media Library</span>
            <span className="vm-count">{uploadedImages.length} images</span>
          </div>
        </div>
        {mediaLibraryOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>

      {/* Accordion Content */}
      {mediaLibraryOpen && (
        <div className="media-library-content">
          {/* Upload Zone */}
          <div
            className={`media-upload-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <Upload size={24} className="upload-icon" />
            <p className="upload-text">
              <strong>{uploading ? 'Uploading...' : 'Click to upload'}</strong>{uploading ? '' : ' or drag & drop'}
            </p>
            <p className="upload-hint">Stored in uploads and ready to use in HTML</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden-input"
              disabled={uploading}
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>
          {error ? <p className="media-upload-error">{error}</p> : null}

          {/* Image Gallery */}
          {uploadedImages.length > 0 && (
            <div className="media-gallery">
              {uploadedImages.map((img, idx) => (
                <div key={img.id} className="media-card">
                  {/* Thumbnail */}
                  <div className="media-thumbnail" onClick={() => setPreviewImage(img)}>
                    <img src={img.dataUrl} alt={img.name} />
                    <div className="media-thumb-overlay">
                      <Eye size={18} />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="media-info">
                    <p className="media-name" title={img.name}>
                      {img.name}
                    </p>
                    <div className="media-meta">
                      <span className="media-size">{formatSize(img.size)}</span>
                      <code className="media-variable-code">{img.publicUrl || img.url || `{{image_${idx}}}`}</code>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="media-actions">
                    <button
                      onClick={() => handleCopyUrl(img)}
                      className={`media-action-btn ${copiedId === img.id ? 'copied' : ''}`}
                      title="Copy stored image URL"
                    >
                      {copiedId === img.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <button
                      onClick={() => handleCopyHtml(img)}
                      className="media-action-btn"
                      title="Copy HTML image tag"
                    >
                      <ExternalLink size={14} />
                    </button>
                    <button
                      onClick={() => removeImage(img.id)}
                      className="media-action-btn media-delete-btn"
                      title="Remove image"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {uploadedImages.length === 0 && (
            <div className="media-empty">
              <Image size={32} className="media-empty-icon" />
              <p>No images uploaded yet</p>
              <p className="media-empty-hint">
                Upload images, copy the stored URL, and paste it into your HTML.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="media-preview-modal" onClick={() => setPreviewImage(null)}>
          <div className="media-preview-content" onClick={(e) => e.stopPropagation()}>
            <button className="media-preview-close" onClick={() => setPreviewImage(null)}>
              <X size={20} />
            </button>
            <img src={previewImage.dataUrl} alt={previewImage.name} className="media-preview-img" />
            <div className="media-preview-info">
              <p className="media-preview-name">{previewImage.name}</p>
              <p className="media-preview-size">{formatSize(previewImage.size)}</p>
              <code className="media-preview-variable">
                {previewImage.publicUrl || previewImage.url || `{{image_${uploadedImages.indexOf(previewImage)}}}`}
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
