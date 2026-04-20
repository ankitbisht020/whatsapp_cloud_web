import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Settings } from 'lucide-react';
import { useAuthStore, useToastStore } from '../store/useStore';

const pageTitles: Record<string, { title: string; breadcrumb: string }> = {
  '/': { title: 'Dashboard', breadcrumb: 'Overview' },
  '/contacts': { title: 'Contacts', breadcrumb: 'Contact Management' },
  '/templates': { title: 'Templates', breadcrumb: 'Template Management' },
  '/broadcast': { title: 'Broadcast', breadcrumb: 'Send Messages' },
  '/logs': { title: 'Logs & History', breadcrumb: 'Message History' },
};

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const client = useAuthStore((state) => state.client);
  const logout = useAuthStore((state) => state.logout);
  const addToast = useToastStore((state) => state.addToast);
  const current = pageTitles[location.pathname] || { title: 'Page', breadcrumb: '' };

  const initials = client?.name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CL';

  const handleLogout = () => {
    logout();
    addToast({
      type: 'info',
      title: 'Signed Out',
      message: 'Your client workspace has been securely closed.',
    });
    navigate('/login', { replace: true });
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <div>
          <div className="navbar-title">{current.title}</div>
          <div className="navbar-breadcrumb">Client Workspace / {current.breadcrumb}</div>
        </div>
      </div>
      <div className="navbar-right">
        <button className="navbar-icon-btn" id="nav-settings-btn" title="Client settings">
          <Settings size={18} />
        </button>
        <button className="navbar-icon-btn" id="nav-notifications-btn" title="Notifications">
          <Bell size={18} />
          <span className="notification-dot" />
        </button>
        <div className="navbar-client-chip">
          <div className="navbar-avatar" id="nav-avatar">
            {initials}
          </div>
          <div className="navbar-client-copy">
            <strong>{client?.businessName || 'Client Workspace'}</strong>
            <span>{client?.email || 'secured session'}</span>
          </div>
        </div>
        <button className="navbar-icon-btn" title="Logout" onClick={handleLogout}>
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
