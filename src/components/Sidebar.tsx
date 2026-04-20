import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Send,
  Clock,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../store/useStore';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/contacts', label: 'Contacts', icon: Users },
  { to: '/templates', label: 'Templates', icon: FileText },
  { to: '/broadcast', label: 'Broadcast', icon: Send },
  { to: '/logs', label: 'Logs & History', icon: Clock },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const client = useAuthStore((state) => state.client);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <MessageSquare size={20} />
        </div>
        <div>
          <h1>BroadcastHub</h1>
          <span>{client?.businessName || 'WhatsApp Manager'}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main Menu</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              {item.label}
            </NavLink>
          );
        })}

        <div className="sidebar-section-label" style={{ marginTop: '16px' }}>
          Workspace Security
        </div>
        <div className="sidebar-link" style={{ opacity: 0.92, cursor: 'default' }}>
          <ShieldCheck size={20} />
          Authenticated Client
        </div>
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div
          style={{
            background: 'rgba(37, 211, 102, 0.1)',
            borderRadius: '10px',
            padding: '14px 16px',
          }}
        >
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#25D366',
              marginBottom: '4px',
            }}
          >
            Secure Client Session
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#25D366',
                animation: 'pulse 2s infinite',
              }}
            />
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              {client?.email || 'Authenticated'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
