import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Upload,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  FileSpreadsheet,
  Users,
} from 'lucide-react';
import Modal from '../components/Modal';
import { useContactsStore, useToastStore } from '../store/useStore';

const ITEMS_PER_PAGE = 8;

const ContactsPage: React.FC = () => {
  const contacts = useContactsStore((state) => state.contacts);
  const isLoading = useContactsStore((state) => state.isLoading);
  const error = useContactsStore((state) => state.error);
  const fetchContacts = useContactsStore((state) => state.fetchContacts);
  const createContact = useContactsStore((state) => state.createContact);
  const uploadContacts = useContactsStore((state) => state.uploadContacts);
  const deleteContact = useContactsStore((state) => state.deleteContact);
  const deleteContacts = useContactsStore((state) => state.deleteContacts);
  const addToast = useToastStore((state) => state.addToast);

  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<{ name: string; phone: string; tags: string[] }[]>([]);

  useEffect(() => {
    void fetchContacts().catch(() => undefined);
  }, [fetchContacts]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    contacts.forEach((contact) => contact.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [contacts]);

  const filtered = useMemo(() => {
    let result = contacts;

    if (search) {
      const query = search.toLowerCase();
      result = result.filter(
        (contact) =>
          contact.name.toLowerCase().includes(query) || contact.phone.toLowerCase().includes(query),
      );
    }

    if (filterTag !== 'all') {
      result = result.filter((contact) => contact.tags.includes(filterTag));
    }

    return result;
  }, [contacts, search, filterTag]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const toggleSelect = (id: string) => {
    setSelected((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
    );
  };

  const toggleAll = () => {
    if (selected.length === paginated.length && paginated.length > 0) {
      setSelected([]);
      return;
    }

    setSelected(paginated.map((contact) => contact.id));
  };

  const handleAddContact = async () => {
    const errors: { name?: string; phone?: string } = {};

    if (!formName.trim()) {
      errors.name = 'Name is required';
    }

    if (!formPhone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?\d[\d\s-]{7,}$/.test(formPhone.trim())) {
      errors.phone = 'Invalid phone number format';
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const tags = formTags
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean);

      await createContact({
        name: formName.trim(),
        phone: formPhone.trim().replace(/\s+/g, ''),
        tags,
      });

      addToast({
        type: 'success',
        title: 'Contact Added',
        message: `${formName.trim()} has been added.`,
      });

      setFormName('');
      setFormPhone('');
      setFormTags('');
      setFormErrors({});
      setShowAddModal(false);
    } catch (submitError) {
      addToast({
        type: 'error',
        title: 'Unable to add contact',
        message: submitError instanceof Error ? submitError.message : 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selected.length === 0) {
      return;
    }

    try {
      await deleteContacts(selected);
      addToast({
        type: 'success',
        title: 'Contacts Deleted',
        message: `${selected.length} contacts removed.`,
      });
      setSelected([]);
    } catch (deleteError) {
      addToast({
        type: 'error',
        title: 'Unable to delete contacts',
        message: deleteError instanceof Error ? deleteError.message : 'Please try again.',
      });
    }
  };

  const handleDeleteContact = async (id: string, name: string) => {
    try {
      await deleteContact(id);
      setSelected((previous) => previous.filter((item) => item !== id));
      addToast({
        type: 'success',
        title: 'Deleted',
        message: `${name} removed.`,
      });
    } catch (deleteError) {
      addToast({
        type: 'error',
        title: 'Unable to delete contact',
        message: deleteError instanceof Error ? deleteError.message : 'Please try again.',
      });
    }
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file ?? null);

    if (!file) {
      setCsvPreview([]);
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const text = readerEvent.target?.result as string;
      const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
      const parsed: { name: string; phone: string; tags: string[] }[] = [];
      const start = lines[0]?.toLowerCase().includes('name') ? 1 : 0;

      for (let index = start; index < lines.length; index += 1) {
        const cols = lines[index].split(',').map((col) => col.trim());

        if (cols.length >= 2) {
          parsed.push({
            name: cols[0],
            phone: cols[1],
            tags: cols[2]
              ? cols[2]
                  .split(';')
                  .map((tag) => tag.trim().toLowerCase())
                  .filter(Boolean)
              : [],
          });
        }
      }

      setCsvPreview(parsed);
    };

    reader.readAsText(file);
  };

  const clearBulkUpload = () => {
    setCsvPreview([]);
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBulkImport = async () => {
    if (!selectedFile) {
      return;
    }

    setIsBulkUploading(true);

    try {
      const result = await uploadContacts(selectedFile);
      addToast({
        type: 'success',
        title: 'Contacts Imported',
        message: `${result.upsertedCount + result.modifiedCount} rows processed successfully.`,
      });
      clearBulkUpload();
      setShowBulkModal(false);
    } catch (uploadError) {
      addToast({
        type: 'error',
        title: 'Bulk upload failed',
        message: uploadError instanceof Error ? uploadError.message : 'Please try again.',
      });
    } finally {
      setIsBulkUploading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="page-header">
        <div>
          <h2>Contacts</h2>
          <p>Manage your contact list for broadcasts</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => setShowBulkModal(true)}>
            <Upload size={16} /> Bulk Upload
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Contact
          </button>
        </div>
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

      <div className="card" style={{ marginBottom: '20px' }}>
        <div
          style={{
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div className="search-wrapper" style={{ flex: 1, minWidth: '200px' }}>
            <Search size={18} />
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search contacts..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="form-input form-select"
            style={{ width: 'auto', minWidth: '160px' }}
            value={filterTag}
            onChange={(event) => {
              setFilterTag(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </option>
            ))}
          </select>
          {selected.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={() => void handleDeleteSelected()}>
              <Trash2 size={14} /> Delete ({selected.length})
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>Loading contacts</h3>
            <p>Fetching your latest contacts from the API.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>No contacts found</h3>
            <p>
              {search || filterTag !== 'all'
                ? 'Try changing your search or filter.'
                : 'Add your first contact to get started.'}
            </p>
            {!search && filterTag === 'all' && (
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                <Plus size={16} /> Add Contact
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <div
                        className={`checkbox ${
                          selected.length === paginated.length && paginated.length > 0 ? 'checked' : ''
                        }`}
                        onClick={toggleAll}
                        style={{ cursor: 'pointer' }}
                      >
                        {selected.length === paginated.length && paginated.length > 0 && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Tags</th>
                    <th>Added</th>
                    <th style={{ width: '60px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((contact) => (
                    <tr key={contact.id}>
                      <td>
                        <div
                          className={`checkbox ${selected.includes(contact.id) ? 'checked' : ''}`}
                          onClick={() => toggleSelect(contact.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          {selected.includes(contact.id) && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #25D366, #128C7E)',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.78rem',
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
                          <span style={{ fontWeight: 600 }}>{contact.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{contact.phone}</td>
                      <td>
                        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                          {contact.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`tag ${
                                tag === 'premium'
                                  ? 'tag-premium'
                                  : tag === 'new'
                                    ? 'tag-new'
                                    : tag === 'vip'
                                      ? 'tag-vip'
                                      : ''
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => void handleDeleteContact(contact.id, contact.name)}
                          style={{ color: 'var(--color-danger)' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination" style={{ padding: '16px 24px' }}>
              <div className="pagination-info">
                Showing {(page - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
              </div>
              <div className="pagination-buttons">
                <button
                  className="pagination-btn"
                  disabled={page === 1}
                  onClick={() => setPage((previous) => previous - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .filter((item) => item === 1 || item === totalPages || Math.abs(item - page) <= 1)
                  .map((item, index, pages) => (
                    <React.Fragment key={item}>
                      {index > 0 && pages[index - 1] !== item - 1 && (
                        <span style={{ padding: '0 4px', color: 'var(--text-muted)' }}>...</span>
                      )}
                      <button
                        className={`pagination-btn ${item === page ? 'active' : ''}`}
                        onClick={() => setPage(item)}
                      >
                        {item}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  className="pagination-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage((previous) => previous + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormErrors({});
        }}
        title="Add New Contact"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowAddModal(false);
                setFormErrors({});
              }}
            >
              Cancel
            </button>
            <button className="btn btn-primary" onClick={() => void handleAddContact()} disabled={isSubmitting}>
              <UserPlus size={16} /> {isSubmitting ? 'Adding...' : 'Add Contact'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input
            type="text"
            className={`form-input ${formErrors.name ? 'error' : ''}`}
            placeholder="e.g., John Doe"
            value={formName}
            onChange={(event) => setFormName(event.target.value)}
          />
          {formErrors.name && <div className="form-error">{formErrors.name}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Phone Number *</label>
          <input
            type="text"
            className={`form-input ${formErrors.phone ? 'error' : ''}`}
            placeholder="e.g., 919876543210"
            value={formPhone}
            onChange={(event) => setFormPhone(event.target.value)}
          />
          {formErrors.phone && <div className="form-error">{formErrors.phone}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Tags (comma-separated)</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g., premium, active"
            value={formTags}
            onChange={(event) => setFormTags(event.target.value)}
          />
        </div>
      </Modal>

      <Modal
        isOpen={showBulkModal}
        onClose={() => {
          setShowBulkModal(false);
          clearBulkUpload();
        }}
        title="Bulk Upload Contacts"
        size="lg"
        footer={
          csvPreview.length > 0 ? (
            <>
              <button className="btn btn-secondary" onClick={clearBulkUpload}>
                Clear
              </button>
              <button className="btn btn-primary" onClick={() => void handleBulkImport()} disabled={isBulkUploading}>
                <Upload size={16} /> {isBulkUploading ? 'Importing...' : `Import ${csvPreview.length} Contacts`}
              </button>
            </>
          ) : undefined
        }
      >
        <div
          className={`file-upload-zone ${csvPreview.length > 0 ? 'active' : ''}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <FileSpreadsheet size={40} />
          <p>Click to upload or drag your CSV file here</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Format: Name, Phone, Tags (semicolon-separated)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleCSVUpload}
          />
        </div>

        {csvPreview.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>
              Preview ({csvPreview.length} contacts)
            </h4>
            <div className="table-wrapper" style={{ maxHeight: '240px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.slice(0, 10).map((contact, index) => (
                    <tr key={`${contact.phone}-${index}`}>
                      <td>{contact.name}</td>
                      <td>{contact.phone}</td>
                      <td>
                        {contact.tags.map((tag) => (
                          <span key={tag} className="tag" style={{ marginRight: '4px' }}>
                            {tag}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                  {csvPreview.length > 10 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        ...and {csvPreview.length - 10} more
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default ContactsPage;
