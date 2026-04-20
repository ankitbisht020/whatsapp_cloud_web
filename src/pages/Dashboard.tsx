import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Send,
  AlertTriangle,
  FileText,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  useBroadcastsStore,
  useContactsStore,
  useLogsStore,
  useTemplatesStore,
} from '../store/useStore';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const contacts = useContactsStore((state) => state.contacts);
  const fetchContacts = useContactsStore((state) => state.fetchContacts);
  const contactsLoading = useContactsStore((state) => state.isLoading);
  const contactsError = useContactsStore((state) => state.error);

  const templates = useTemplatesStore((state) => state.templates);
  const fetchTemplates = useTemplatesStore((state) => state.fetchTemplates);
  const templatesLoading = useTemplatesStore((state) => state.isLoading);
  const templatesError = useTemplatesStore((state) => state.error);

  const logs = useLogsStore((state) => state.logs);
  const fetchLogs = useLogsStore((state) => state.fetchLogs);
  const logsLoading = useLogsStore((state) => state.isLoading);
  const logsError = useLogsStore((state) => state.error);

  const broadcasts = useBroadcastsStore((state) => state.broadcasts);
  const fetchBroadcasts = useBroadcastsStore((state) => state.fetchBroadcasts);

  useEffect(() => {
    void Promise.allSettled([fetchContacts(), fetchTemplates(), fetchLogs(), fetchBroadcasts()]);
  }, [fetchBroadcasts, fetchContacts, fetchLogs, fetchTemplates]);

  const isLoading = contactsLoading || templatesLoading || logsLoading;
  const pageError = contactsError || templatesError || logsError;
  const today = new Date().toDateString();

  const sentToday = useMemo(
    () =>
      logs.filter((log) => log.status === 'sent' && new Date(log.timestamp).toDateString() === today)
        .length,
    [logs, today],
  );

  const failedMessages = logs.filter((log) => log.status === 'failed').length;
  const activeTemplates = templates.length;
  const recentLogs = logs.slice(0, 8);
  const deliveryRate = logs.length
    ? Math.round((logs.filter((log) => log.status === 'sent').length / logs.length) * 100)
    : 0;

  const stats = [
    {
      label: 'Total Contacts',
      value: contacts.length,
      change: contacts.length ? '+live' : '0',
      positive: true,
      icon: Users,
      color: 'green',
    },
    {
      label: 'Messages Sent Today',
      value: sentToday,
      change: sentToday ? '+today' : '0',
      positive: true,
      icon: Send,
      color: 'blue',
    },
    {
      label: 'Failed Messages',
      value: failedMessages,
      change: failedMessages ? `${failedMessages}` : '0',
      positive: false,
      icon: AlertTriangle,
      color: 'red',
    },
    {
      label: 'Active Templates',
      value: activeTemplates,
      change: activeTemplates ? '+ready' : '0',
      positive: true,
      icon: FileText,
      color: 'purple',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Welcome back! Here's what's happening with your broadcasts.</p>
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

      <div className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <motion.div key={stat.label} className="stat-card" variants={itemVariants}>
              <div className="stat-card-info">
                <h3>{stat.label}</h3>
                <div className="stat-value">
                  {isLoading ? '...' : stat.value.toLocaleString()}
                </div>
                <span className={`stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                  {stat.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {stat.change}
                </span>
              </div>
              <div className={`stat-card-icon ${stat.color}`}>
                <Icon size={22} />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid-2">
        <motion.div className="card" variants={itemVariants}>
          <div className="card-header">
            <h3>Recent Activity</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/logs')}>
              View All <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="card-body" style={{ padding: '8px 24px' }}>
            {recentLogs.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <Send size={40} />
                <h3>No delivery activity yet</h3>
                <p>Queued broadcasts and message logs will appear here.</p>
              </div>
            ) : (
              <div className="activity-list">
                {recentLogs.map((log) => (
                  <div key={log.id} className="activity-item">
                    <div
                      className={`activity-dot ${
                        log.status === 'sent'
                          ? 'green'
                          : log.status === 'failed'
                            ? 'red'
                            : 'yellow'
                      }`}
                    />
                    <div>
                      <div className="activity-text">
                        <strong>{log.contactName}</strong> -{' '}
                        <span style={{ color: 'var(--text-secondary)' }}>{log.templateName}</span>
                        <span
                          className={`badge ${
                            log.status === 'sent'
                              ? 'badge-success'
                              : log.status === 'failed'
                                ? 'badge-danger'
                                : 'badge-warning'
                          }`}
                          style={{ marginLeft: '8px' }}
                        >
                          {log.status}
                        </span>
                      </div>
                      <div className="activity-time">{new Date(log.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div className="card" variants={itemVariants}>
          <div className="card-header">
            <h3>Broadcast Overview</h3>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: '28px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '0.85rem',
                }}
              >
                <span style={{ fontWeight: 600 }}>Delivery Rate</span>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  {deliveryRate}%
                </span>
              </div>
              <div
                style={{
                  height: '8px',
                  borderRadius: '999px',
                  background: '#f1f5f9',
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  style={{
                    height: '100%',
                    borderRadius: '999px',
                    background: 'linear-gradient(90deg, #25D366, #128C7E)',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${deliveryRate}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#f0fdf4',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle size={18} color="#16a34a" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>Delivered</span>
                </div>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  {logs.filter((log) => log.status === 'sent').length}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#fef2f2',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <XCircle size={18} color="#dc2626" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>Failed</span>
                </div>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  {logs.filter((log) => log.status === 'failed').length}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#fffbeb',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={18} color="#d97706" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>Pending</span>
                </div>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  {logs.filter((log) => log.status === 'pending').length}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '28px' }}>
              <h4
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-secondary)',
                  marginBottom: '12px',
                }}
              >
                Recent Broadcasts
              </h4>
              {broadcasts.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                  No broadcasts queued yet.
                </p>
              ) : (
                broadcasts.slice(0, 3).map((broadcast) => (
                  <div
                    key={broadcast.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{broadcast.name}</span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                      {broadcast.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
