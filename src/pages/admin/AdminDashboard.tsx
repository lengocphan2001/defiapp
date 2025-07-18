import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import DashboardPage from './DashboardPage';
import UsersPage from './UsersPage';
import RequestsPage from './RequestsPage';
import NFTsPage from './NFTsPage';

const AdminDashboard: React.FC = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="nfts" element={<NFTsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard; 