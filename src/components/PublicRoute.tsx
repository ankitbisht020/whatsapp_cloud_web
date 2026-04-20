import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useStore';

const PublicRoute: React.FC = () => {
  const isReady = useAuthStore((state) => state.isReady);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isReady) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-card">
          <div className="auth-loading-spinner" />
          <h2>Preparing secure access</h2>
          <p>Loading the client authentication experience.</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
