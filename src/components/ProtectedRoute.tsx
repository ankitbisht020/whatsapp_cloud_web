import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useStore';

const ProtectedRoute: React.FC = () => {
  const isReady = useAuthStore((state) => state.isReady);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isReady) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-card">
          <div className="auth-loading-spinner" />
          <h2>Checking your workspace</h2>
          <p>Verifying your client session and loading your SaaS dashboard.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
