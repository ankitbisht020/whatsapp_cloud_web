import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Trash2,
  Eye,
  FileText,
  Globe,
  CheckCircle,
  Upload,
  Image as ImageIcon,
  FileVideo,
  FileBadge,
  X,
} from 'lucide-react';
import Modal from '../components/Modal';
import {
  dummyVariables,
  getLanguageLabel,
  LANGUAGE_OPTIONS,
  type MediaAsset,
} from '../data/mockData';
import { useTemplatesStore, useToastStore } from '../store/useStore';

const TemplatesPage: React.FC = () => {
  const templates = useTemplatesStore((state) => state.templates);
  const isLoading = useTemplatesStore((state) => state.isLoading);
  const isUploadingMedia = useTemplatesStore((state) => state.isUploadingMedia);
  const error = useTemplatesStore((state) => state.error);
  const fetchTemplates = useTemplatesStore((state) => state.fetchTemplates);
  const uploadTemplateMedia = useTemplatesStore((state) => state.uploadTemplateMedia);
  const createTemplate = useTemplatesStore((state) => state.createTemplate);
  const deleteTemplate = useTemplatesStore((state) => state.deleteTemplate);
  const addToast = useToastStore((state) => state.addToast);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formName, setFormName] = useState('');
  const [formLang, setFormLang] = useState('en');
  const [formHeader, setFormHeader] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formFooter, setFormFooter] = useState('');
  const [formMedia, setFormMedia] = useState<MediaAsset | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void fetchTemplates().catch(() => undefined);
  }, [fetchTemplates]);

  const hasLivePreview =
    Boolean(formName.trim()) ||
    Boolean(formHeader.trim()) ||
    Boolean(formBody.trim()) ||
    Boolean(formFooter.trim()) ||
    Boolean(formMedia);

  const replaceVariables = (text: string) => {
    let result = text;
    Object.entries(dummyVariables).forEach(([key, value]) => {
      result = result.replaceAll(key, value);
    });
    return result;
  };

  const renderBodyWithHighlights = (text: string) =>
    text.split(/(\{\{\d+\}\})/g).map((part, index) => {
      if (/\{\{\d+\}\}/.test(part)) {
        const value = dummyVariables[part] || part;
        return (
          <span key={`${part}-${index}`} className="wa-variable">
            {value}
          </span>
        );
      }

      return <span key={`${part}-${index}`}>{part}</span>;
    });

  const renderMediaBlock = (media: MediaAsset) => {
    if (media.type === 'image') {
      return (
        <div className="template-media-preview template-media-image">
          <img src={media.url} alt={media.originalName || media.filename} />
        </div>
      );
    }

    return (
      <div className="template-media-preview template-media-file">
        {media.type === 'video' ? <FileVideo size={20} /> : <FileBadge size={20} />}
        <div>
          <strong>{media.originalName || media.filename}</strong>
          <span>{media.mimeType}</span>
        </div>
      </div>
    );
  };

  const resetCreateForm = () => {
    setFormName('');
    setFormLang('en');
    setFormHeader('');
    setFormBody('');
    setFormFooter('');
    setFormMedia(null);
    setFormErrors({});

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const uploadedMedia = await uploadTemplateMedia(file);
      setFormMedia(uploadedMedia);
      addToast({
        type: 'success',
        title: 'Media Uploaded',
        message: `${uploadedMedia.originalName || uploadedMedia.filename} is attached to this template.`,
      });
    } catch (uploadError) {
      addToast({
        type: 'error',
        title: 'Unable to upload media',
        message: uploadError instanceof Error ? uploadError.message : 'Please try again.',
      });
    }
  };

  const handleCreate = async () => {
    const errors: Record<string, string> = {};

    if (!formName.trim()) {
      errors.name = 'Template name is required';
    }

    if (!formBody.trim()) {
      errors.body = 'Message body is required';
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createTemplate({
        name: formName.trim(),
        language: formLang,
        headerContent: formHeader.trim(),
        body: formBody.trim(),
        footer: formFooter.trim(),
        media: formMedia,
      });

      addToast({
        type: 'success',
        title: 'Template Created',
        message: `"${formName.trim()}" is ready to use.`,
      });

      resetCreateForm();
      setShowCreateModal(false);
    } catch (submitError) {
      addToast({
        type: 'error',
        title: 'Unable to create template',
        message: submitError instanceof Error ? submitError.message : 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    try {
      await deleteTemplate(id);
      addToast({
        type: 'success',
        title: 'Template Deleted',
        message: `"${name}" has been removed.`,
      });
    } catch (deleteError) {
      addToast({
        type: 'error',
        title: 'Unable to delete template',
        message: deleteError instanceof Error ? deleteError.message : 'Please try again.',
      });
    }
  };

  const openPreview = (id: string) => {
    setPreviewId(id);
    setShowPreviewModal(true);
  };

  const previewTemplate = templates.find((template) => template.id === previewId);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="page-header">
        <div>
          <h2>Templates</h2>
          <p>Create and manage WhatsApp message templates</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} /> Create Template
        </button>
      </div>

      {error && (
        <div
          className="card"
          style={{
            marginBottom: '20px',
            border: '1px solid rgba(220, 38, 38, 0.18)',
            background: '#fef2f2',
          }}
        >
          <div style={{ padding: '16px 24px', color: '#991b1b', fontSize: '0.88rem' }}>
            {error}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="card">
          <div className="empty-state">
            <FileText size={48} />
            <h3>Loading templates</h3>
            <p>Fetching the latest template list from the API.</p>
          </div>
        </div>
      ) : templates.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <FileText size={48} />
            <h3>No templates yet</h3>
            <p>Create your first WhatsApp template to get started.</p>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> Create Template
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '20px',
          }}
        >
          {templates.map((template) => (
            <motion.div
              key={template.id}
              className="card"
              whileHover={{ y: -4, boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }}
              transition={{ duration: 0.2 }}
            >
              <div className="card-header">
                <div>
                  <h3 style={{ marginBottom: '4px' }}>{template.name}</h3>
                  <div className="flex items-center gap-2">
                    <Globe size={13} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {getLanguageLabel(template.language)}
                    </span>
                    {template.media && (
                      <span className="badge badge-info" style={{ marginLeft: '6px' }}>
                        {template.media.type}
                      </span>
                    )}
                  </div>
                </div>
                <span className="badge badge-success">
                  <CheckCircle size={14} color="#16a34a" /> approved
                </span>
              </div>
              <div className="card-body">
                {template.media && renderMediaBlock(template.media)}
                {template.headerContent && (
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      marginBottom: '8px',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {template.headerContent}
                  </div>
                )}
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {template.body}
                </p>
                {template.footer && (
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      marginTop: '8px',
                      fontStyle: 'italic',
                    }}
                  >
                    {template.footer}
                  </p>
                )}
              </div>
              <div
                style={{
                  padding: '12px 24px',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <button className="btn btn-ghost btn-sm" onClick={() => openPreview(template.id)}>
                  <Eye size={15} /> Preview
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => void handleDeleteTemplate(template.id, template.name)}
                  style={{ color: 'var(--color-danger)' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetCreateForm();
        }}
        title="Create Template"
        size="xl"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowCreateModal(false);
                resetCreateForm();
              }}
            >
              Cancel
            </button>
            <button className="btn btn-primary" onClick={() => void handleCreate()} disabled={isSubmitting}>
              <Plus size={16} /> {isSubmitting ? 'Creating...' : 'Create Template'}
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <div className="form-group">
              <label className="form-label">Template Name *</label>
              <input
                type="text"
                className={`form-input ${formErrors.name ? 'error' : ''}`}
                placeholder="e.g., Welcome Message"
                value={formName}
                onChange={(event) => setFormName(event.target.value)}
              />
              {formErrors.name && <div className="form-error">{formErrors.name}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Language</label>
              <select
                className="form-input form-select"
                value={formLang}
                onChange={(event) => setFormLang(event.target.value)}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Header</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Special Offer"
                value={formHeader}
                onChange={(event) => setFormHeader(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Body *{' '}
                <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>
                  (Use {'{{1}}'}, {'{{2}}'} for variables)
                </span>
              </label>
              <textarea
                className={`form-input form-textarea ${formErrors.body ? 'error' : ''}`}
                placeholder="e.g., Hello {{1}}, welcome to our service!"
                value={formBody}
                onChange={(event) => setFormBody(event.target.value)}
                rows={5}
              />
              {formErrors.body && <div className="form-error">{formErrors.body}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Footer</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Reply STOP to unsubscribe"
                value={formFooter}
                onChange={(event) => setFormFooter(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Optional Media Header</label>
              <div
                className={`file-upload-zone ${formMedia ? 'active' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                style={{ padding: '24px' }}
              >
                <Upload size={30} />
                <p>{isUploadingMedia ? 'Uploading media...' : 'Click to upload image, video, or document'}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  This uses the secured `/media/upload` endpoint before template creation.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  onChange={handleMediaUpload}
                />
              </div>

              {formMedia && (
                <div className="template-media-selected">
                  <div className="template-media-selected-copy">
                    <strong>{formMedia.originalName || formMedia.filename}</strong>
                    <span>
                      {formMedia.type} • {Math.max(1, Math.round(formMedia.size / 1024))} KB
                    </span>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    onClick={() => setFormMedia(null)}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-secondary)',
                marginBottom: '12px',
              }}
            >
              Live Preview
            </div>
            <div className="wa-preview">
              <div className="wa-preview-header">
                <div className="wa-preview-header-avatar">B</div>
                <div className="wa-preview-header-info">
                  <h4>{formName.trim() || 'BroadcastHub'}</h4>
                  <span>{getLanguageLabel(formLang)}</span>
                </div>
              </div>

              {hasLivePreview ? (
                <div className="wa-bubble outgoing">
                  {formMedia && renderMediaBlock(formMedia)}
                  {formHeader && <div className="wa-header-text">{replaceVariables(formHeader)}</div>}
                  <div>
                    {formBody ? (
                      renderBodyWithHighlights(formBody)
                    ) : (
                      <span style={{ color: '#aaa' }}>
                        {formName.trim()
                          ? `Template "${formName.trim()}" is ready for message content...`
                          : 'Message body preview...'}
                      </span>
                    )}
                  </div>
                  {formFooter && <div className="wa-footer-text">{formFooter}</div>}
                  <span className="wa-time">12:30 PM</span>
                </div>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                  }}
                >
                  Start typing to see a live preview
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={previewTemplate ? `Preview: ${previewTemplate.name}` : 'Preview'}
        size="lg"
      >
        {previewTemplate && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <div className="form-group">
                <label className="form-label">Template Name</label>
                <p style={{ fontSize: '0.88rem' }}>{previewTemplate.name}</p>
              </div>
              <div className="form-group">
                <label className="form-label">Language</label>
                <p style={{ fontSize: '0.88rem' }}>{getLanguageLabel(previewTemplate.language)}</p>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <span className="badge badge-success">
                  <CheckCircle size={14} color="#16a34a" /> approved
                </span>
              </div>
              {previewTemplate.media && (
                <div className="form-group">
                  <label className="form-label">Media</label>
                  {renderMediaBlock(previewTemplate.media)}
                </div>
              )}
              {previewTemplate.headerContent && (
                <div className="form-group">
                  <label className="form-label">Header</label>
                  <p style={{ fontSize: '0.88rem' }}>{previewTemplate.headerContent}</p>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Body (Raw)</label>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    background: '#f8fafc',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {previewTemplate.body}
                </p>
              </div>
              {previewTemplate.footer && (
                <div className="form-group">
                  <label className="form-label">Footer</label>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {previewTemplate.footer}
                  </p>
                </div>
              )}
            </div>

            <div>
              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-secondary)',
                  marginBottom: '12px',
                }}
              >
                WhatsApp Preview
              </div>
              <div className="wa-preview">
                <div className="wa-preview-header">
                  <div className="wa-preview-header-avatar">B</div>
                  <div className="wa-preview-header-info">
                    <h4>{previewTemplate.name}</h4>
                    <span>{getLanguageLabel(previewTemplate.language)}</span>
                  </div>
                </div>
                <div className="wa-bubble outgoing">
                  {previewTemplate.media && renderMediaBlock(previewTemplate.media)}
                  {previewTemplate.headerContent && (
                    <div className="wa-header-text">
                      {replaceVariables(previewTemplate.headerContent)}
                    </div>
                  )}
                  <div>{renderBodyWithHighlights(previewTemplate.body)}</div>
                  {previewTemplate.footer && (
                    <div className="wa-footer-text">{previewTemplate.footer}</div>
                  )}
                  <span className="wa-time">12:30 PM</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default TemplatesPage;
