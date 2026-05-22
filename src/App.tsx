import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import PublicPortal from './pages/PublicPortal';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserDashboard from './pages/user/UserDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function RouterConfig() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      const currentPath = window.location.pathname;
      if (currentPath === '/login') {
        navigate(isAdmin ? '/admin' : '/dashboard');
      }
    }
  }, [user, loading, isAdmin, navigate]);

  return (
    <Routes>
      <Route path="/" element={<PublicPortal />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <Layout>
            <AdminDashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute requireAdmin>
          <Layout>
            <ManageUsers />
          </Layout>
        </ProtectedRoute>
      } />

      {/* User Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <UserDashboard />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RouterConfig />
      </AuthProvider>
    </BrowserRouter>
  );
}
