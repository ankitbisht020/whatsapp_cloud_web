import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import BroadcastPage from './pages/BroadcastPage';
import ContactsPage from './pages/ContactsPage';
import Dashboard from './pages/Dashboard';
import LogsPage from './pages/LogsPage';
import TemplatesPage from './pages/TemplatesPage';
import AuthPage from './pages/AuthPage';
import ToastContainer from './components/ToastContainer';
import { useAuthStore } from './store/useStore';

const App: React.FC = () => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    void initializeAuth().catch(() => undefined);
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      <>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
          </Route>

          <Route >
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/broadcast" element={<BroadcastPage />} />
              <Route path="/logs" element={<LogsPage />} />
            </Route>
          </Route>
        </Routes>
        <ToastContainer />
      </>
    </BrowserRouter>
  );
};

export default App;
