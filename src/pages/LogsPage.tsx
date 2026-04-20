import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  History,
} from 'lucide-react';
import { useLogsStore, useToastStore } from '../store/useStore';

const ITEMS_PER_PAGE = 12;

const LogsPage: React.FC = () => {
  const logs = useLogsStore((state) => state.logs);
  const isLoading = useLogsStore((state) => state.isLoading);
  const error = useLogsStore((state) => state.error);
  const fetchLogs = useLogsStore((state) => state.fetchLogs);
  const addToast = useToastStore((state) => state.addToast);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    void fetchLogs().catch(() => undefined);
  }, [fetchLogs]);

  const filtered = useMemo(() => {
    let result = logs;

    if (search) {
      const query = search.toLowerCase();
      result = result.filter(
        (log) =>
          log.contactName.toLowerCase().includes(query) ||
          log.templateName.toLowerCase().includes(query) ||
          log.contactPhone.toLowerCase().includes(query) ||
          log.broadcastName.toLowerCase().includes(query),
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((log) => log.status === statusFilter);
    }

    return result;
  }, [logs, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const statusCounts = useMemo(
    () => ({
      all: logs.length,
      sent: logs.filter((log) => log.status === 'sent').length,
      failed: logs.filter((log) => log.status === 'failed').length,
      pending: logs.filter((log) => log.status === 'pending').length,
    }),
    [logs],
  );

  const handleExport = () => {
    if (filtered.length === 0) {
      addToast({
        type: 'warning',
        title: 'Nothing to export',
        message: 'There are no logs matching the current filters.',
      });
      return;
    }

    const header = ['Contact', 'Phone', 'Template', 'Broadcast', 'Status', 'Timestamp', 'Error'];
    const rows = filtered.map((log) => [
      log.contactName,
      log.contactPhone,
      log.templateName,
      log.broadcastName || log.broadcastId,
      log.status,
      new Date(log.timestamp).toISOString(),
      log.error,
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'message-logs.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle size={15} color="#16a34a" />;
      case 'failed':
        return <XCircle size={15} color="#dc2626" />;
      case 'pending':
        return <Clock size={15} color="#d97706" />;
      default:
        return null;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return 'badge-success';
      case 'failed':
        return 'badge-danger';
      case 'pending':
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="page-header">
        <div>
          <h2>Logs & History</h2>
          <p>Track all your broadcast message deliveries</p>
        </div>
        <button className="btn btn-secondary" onClick={handleExport}>
          <Download size={16} /> Export CSV
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

      <div className="tabs">
        {(['all', 'sent', 'failed', 'pending'] as const).map((status) => (
          <button
            key={status}
            className={`tab ${statusFilter === status ? 'active' : ''}`}
            onClick={() => {
              setStatusFilter(status);
              setPage(1);
            }}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            <span
              style={{
                marginLeft: '6px',
                padding: '1px 8px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                background: statusFilter === status ? 'rgba(37, 211, 102, 0.1)' : '#f1f5f9',
                color: statusFilter === status ? 'var(--color-primary)' : 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              {statusCounts[status]}
            </span>
          </button>
        ))}
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div
          style={{
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div className="search-wrapper" style={{ flex: 1 }}>
            <Search size={18} />
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search by name, phone, template, or broadcast..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="empty-state">
            <History size={48} />
            <h3>Loading logs</h3>
            <p>Fetching delivery history from the backend.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <History size={48} />
            <h3>No logs found</h3>
            <p>
              {search || statusFilter !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'Send your first broadcast to see logs here.'}
            </p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Contact</th>
                    <th>Phone</th>
                    <th>Template</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                    <th>Broadcast</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background:
                                log.status === 'sent'
                                  ? 'linear-gradient(135deg, #25D366, #128C7E)'
                                  : log.status === 'failed'
                                    ? 'linear-gradient(135deg, #fca5a5, #ef4444)'
                                    : 'linear-gradient(135deg, #fde68a, #f59e0b)',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {log.contactName
                              .split(' ')
                              .map((name) => name[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                            {log.contactName}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {log.contactPhone}
                      </td>
                      <td>
                        <span className="badge badge-neutral">{log.templateName}</span>
                      </td>
                      <td>
                        <span className={`badge ${statusBadge(log.status)}`}>
                          {statusIcon(log.status)} {log.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td>
                        <code
                          style={{
                            fontSize: '0.75rem',
                            background: '#f1f5f9',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {log.broadcastName || log.broadcastId}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination" style={{ padding: '16px 24px' }}>
              <div className="pagination-info">
                Showing {(page - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} logs
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
    </motion.div>
  );
};

export default LogsPage;
