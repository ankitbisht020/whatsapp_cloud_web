import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  Users,
  X,
  CheckCircle,
  FileText,
  Zap,
  FileVideo,
  FileBadge,
} from 'lucide-react';
import { dummyVariables } from '../data/mockData';
import {
  useBroadcastsStore,
  useContactsStore,
  useLogsStore,
  useTemplatesStore,
  useToastStore,
} from '../store/useStore';

const BroadcastPage: React.FC = () => {
  const contacts = useContactsStore((state) => state.contacts);
  const contactsLoading = useContactsStore((state) => state.isLoading);
  const contactsError = useContactsStore((state) => state.error);
  const fetchContacts = useContactsStore((state) => state.fetchContacts);

  const templates = useTemplatesStore((state) => state.templates);
  const templatesLoading = useTemplatesStore((state) => state.isLoading);
  const templatesError = useTemplatesStore((state) => state.error);
  const fetchTemplates = useTemplatesStore((state) => state.fetchTemplates);

  const createBroadcast = useBroadcastsStore((state) => state.createBroadcast);
  const broadcastsError = useBroadcastsStore((state) => state.error);
  const fetchBroadcasts = useBroadcastsStore((state) => state.fetchBroadcasts);

  const fetchLogs = useLogsStore((state) => state.fetchLogs);
  const addToast = useToastStore((state) => state.addToast);

  const [broadcastName, setBroadcastName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectionMode, setSelectionMode] = useState<'individual' | 'tag'>('tag');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    void Promise.allSettled([fetchContacts(), fetchTemplates(), fetchBroadcasts()]);
  }, [fetchBroadcasts, fetchContacts, fetchTemplates]);

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    contacts.forEach((contact) => contact.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [contacts]);

  const targetContacts = useMemo(() => {
    if (selectionMode === 'individual') {
      return contacts.filter((contact) => selectedContactIds.includes(contact.id));
    }

    if (selectedTags.length === 0) {
      return [];
    }

    return contacts.filter((contact) => contact.tags.some((tag) => selectedTags.includes(tag)));
  }, [contacts, selectedContactIds, selectedTags, selectionMode]);

  const toggleContact = (id: string) => {
    setSelectedContactIds((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((previous) =>
      previous.includes(tag) ? previous.filter((item) => item !== tag) : [...previous, tag],
    );
  };

  const replaceVariables = (text: string) => {
    let result = text;
    Object.entries(dummyVariables).forEach(([key, value]) => {
      result = result.replaceAll(key, value);
    });
    return result;
  };

  const renderMediaBlock = () => {
    if (!selectedTemplate?.media) {
      return null;
    }

    if (selectedTemplate.media.type === 'image') {
      return (
        <div className="template-media-preview template-media-image">
          <img
            src={selectedTemplate.media.url}
            alt={selectedTemplate.media.originalName || selectedTemplate.media.filename}
          />
        </div>
      );
    }

    return (
      <div className="template-media-preview template-media-file">
        {selectedTemplate.media.type === 'video' ? <FileVideo size={20} /> : <FileBadge size={20} />}
        <div>
          <strong>{selectedTemplate.media.originalName || selectedTemplate.media.filename}</strong>
          <span>{selectedTemplate.media.mimeType}</span>
        </div>
      </div>
    );
  };

  const handleSend = async () => {
    if (!selectedTemplateId || targetContacts.length === 0 || !broadcastName.trim()) {
      return;
    }

    setShowConfirm(false);
    setIsSending(true);

    try {
      const createdBroadcast = await createBroadcast({
        name: broadcastName.trim(),
        templateId: selectedTemplateId,
        contactIds: selectionMode === 'individual' ? selectedContactIds : [],
        tags: selectionMode === 'tag' ? selectedTags : [],
      });

      await Promise.allSettled([fetchBroadcasts(), fetchLogs()]);

      addToast({
        type: 'success',
        title: 'Broadcast Queued',
        message: `"${createdBroadcast.name}" was queued for ${targetContacts.length} recipients.`,
      });

      setBroadcastName('');
      setSelectedTemplateId('');
      setSelectedContactIds([]);
      setSelectedTags([]);
    } catch (sendError) {
      addToast({
        type: 'error',
        title: 'Unable to queue broadcast',
        message: sendError instanceof Error ? sendError.message : 'Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const pageError = contactsError || templatesError || broadcastsError;
  const isLoading = contactsLoading || templatesLoading;
  const canSend = Boolean(broadcastName.trim() && selectedTemplateId && targetContacts.length > 0);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="page-header">
        <div>
          <h2>Broadcast</h2>
          <p>Send messages to your contacts at scale</p>
        </div>
      </div>

      {pageError && (
        <div
          className="card"
          style={{
            marginBottom: '20px',
            border: '1px solid rgba(220, 38, 38, 0.18)',
            background: '#fef2f2',
          }}
        >
          <div style={{ padding: '16px 24px', color: '#991b1b', fontSize: '0.88rem' }}>
            {pageError}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <h3>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    color: 'white',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    marginRight: '10px',
                  }}
                >
                  1
                </span>
                Campaign Details
              </h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Broadcast Name *</label>
                <input
                  className="form-input"
                  placeholder="e.g., April Campaign"
                  value={broadcastName}
                  onChange={(event) => setBroadcastName(event.target.value)}
                />
              </div>

              {isLoading ? (
                <div className="empty-state" style={{ padding: '30px' }}>
                  <FileText size={36} />
                  <h3>Loading templates</h3>
                  <p>Fetching approved templates from the backend.</p>
                </div>
              ) : templates.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px' }}>
                  <FileText size={36} />
                  <h3>No templates found</h3>
                  <p>Create a template first before you send a broadcast.</p>
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Template *</label>
                  <select
                    className="form-input form-select"
                    value={selectedTemplateId}
                    onChange={(event) => setSelectedTemplateId(event.target.value)}
                  >
                    <option value="">Choose a template...</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.language.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    color: 'white',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    marginRight: '10px',
                  }}
                >
                  2
                </span>
                Select Recipients
              </h3>
              <div className="flex gap-2">
                <button
                  className={`btn btn-sm ${selectionMode === 'tag' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectionMode('tag')}
                >
                  By Tag
                </button>
                <button
                  className={`btn btn-sm ${selectionMode === 'individual' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectionMode('individual')}
                >
                  Individual
                </button>
              </div>
            </div>
            <div className="card-body">
              {contactsLoading ? (
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Loading contacts...
                </p>
              ) : selectionMode === 'tag' ? (
                <div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    Select tags to include contacts:
                  </p>
                  <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        className={`btn btn-sm ${selectedTags.includes(tag) ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => toggleTag(tag)}
                        style={{ textTransform: 'capitalize' }}
                      >
                        {selectedTags.includes(tag) && <CheckCircle size={13} />}
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    Select individual contacts:
                  </p>
                  {selectedContactIds.length > 0 && (
                    <div className="multi-select-tags" style={{ marginBottom: '14px' }}>
                      {selectedContactIds.map((id) => {
                        const contact = contacts.find((item) => item.id === id);

                        return contact ? (
                          <span key={id} className="multi-select-tag">
                            {contact.name}
                            <button onClick={() => toggleContact(id)}>
                              <X size={12} />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                  <div
                    style={{
                      maxHeight: '240px',
                      overflowY: 'auto',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        onClick={() => toggleContact(contact.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 14px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f1f5f9',
                          background: selectedContactIds.includes(contact.id) ? '#f0fdf4' : 'white',
                          transition: 'background 0.1s',
                        }}
                      >
                        <div className={`checkbox ${selectedContactIds.includes(contact.id) ? 'checked' : ''}`}>
                          {selectedContactIds.includes(contact.id) && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{contact.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {contact.phone}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    color: 'white',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    marginRight: '10px',
                  }}
                >
                  3
                </span>
                Review & Send
              </h3>
            </div>
            <div className="card-body">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '16px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Template
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                    {selectedTemplate?.name || '-'}
                  </div>
                  {selectedTemplate?.media && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {selectedTemplate.media.type} header attached
                    </div>
                  )}
                </div>
                <div
                  style={{
                    background: '#f0fdf4',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Recipients
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.4rem', color: 'var(--color-primary)' }}>
                    {targetContacts.length}
                  </div>
                </div>
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Est. Cost
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                    ~INR {(targetContacts.length * 0.5).toFixed(2)}
                  </div>
                </div>
              </div>

              {!showConfirm ? (
                <button
                  className="btn btn-primary btn-lg w-full"
                  disabled={!canSend || isSending}
                  onClick={() => setShowConfirm(true)}
                  style={{ justifyContent: 'center' }}
                >
                  {isSending ? (
                    <>
                      <span
                        style={{
                          width: '18px',
                          height: '18px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: 'white',
                          borderRadius: '50%',
                          animation: 'spin 0.7s linear infinite',
                        }}
                      />
                      Queueing...
                    </>
                  ) : (
                    <>
                      <Send size={18} /> Queue Broadcast
                    </>
                  )}
                </button>
              ) : (
                <div
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fcd34d',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    textAlign: 'center',
                  }}
                >
                  <p style={{ fontWeight: 600, marginBottom: '12px', fontSize: '0.9rem' }}>
                    Queue {targetContacts.length} messages using "{selectedTemplate?.name}"?
                  </p>
                  <div className="flex gap-3" style={{ justifyContent: 'center' }}>
                    <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>
                      Cancel
                    </button>
                    <button className="btn btn-primary" onClick={() => void handleSend()} disabled={isSending}>
                      <Zap size={16} /> Confirm & Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ position: 'sticky', top: 'calc(var(--navbar-height) + 28px)', alignSelf: 'start' }}>
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
            Message Preview
          </div>
          <div className="wa-preview" style={{ minHeight: '400px' }}>
            <div className="wa-preview-header">
              <div className="wa-preview-header-avatar">B</div>
              <div className="wa-preview-header-info">
                <h4>{selectedTemplate?.name || 'BroadcastHub'}</h4>
                <span>{selectedTemplate?.language?.toUpperCase() || 'preview'}</span>
              </div>
            </div>

            {selectedTemplate ? (
              <div className="wa-bubble outgoing">
                {renderMediaBlock()}
                {selectedTemplate.headerType !== 'none' && selectedTemplate.headerContent && (
                  <div className="wa-header-text">
                    {replaceVariables(selectedTemplate.headerContent)}
                  </div>
                )}
                <div>{replaceVariables(selectedTemplate.body)}</div>
                {selectedTemplate.footer && (
                  <div className="wa-footer-text">{selectedTemplate.footer}</div>
                )}
                <span className="wa-time">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                }}
              >
                <FileText size={36} style={{ marginBottom: '8px', opacity: 0.4 }} />
                <p>Select a template to see the preview</p>
              </div>
            )}
          </div>

          {targetContacts.length > 0 && (
            <div className="card" style={{ marginTop: '16px' }}>
              <div className="card-header">
                <h3 style={{ fontSize: '0.85rem' }}>
                  <Users size={15} style={{ marginRight: '6px', verticalAlign: '-2px' }} />
                  Recipients ({targetContacts.length})
                </h3>
              </div>
              <div
                style={{
                  maxHeight: '180px',
                  overflowY: 'auto',
                  padding: '8px 0',
                }}
              >
                {targetContacts.slice(0, 10).map((contact) => (
                  <div
                    key={contact.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '6px 24px',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #25D366, #128C7E)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {contact.name
                        .split(' ')
                        .map((name) => name[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 500 }}>{contact.name}</span>
                  </div>
                ))}
                {targetContacts.length > 10 && (
                  <div
                    style={{
                      padding: '6px 24px',
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    +{targetContacts.length - 10} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default BroadcastPage;
