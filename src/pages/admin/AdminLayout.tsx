import React, { useState } from 'react';
import { 
  Users, 
  FileText, 
  BarChart3, 
  LogOut, 
  Menu, 
  X, 
  Settings,
  Home,
  TrendingUp,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/admin',
      icon: BarChart3,
      description: 'Overview and analytics'
    },
    {
      name: 'Users',
      path: '/admin/users',
      icon: Users,
      description: 'User management'
    },
    {
      name: 'Requests',
      path: '/admin/requests',
      icon: FileText,
      description: 'Transaction requests'
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActivePath = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="admin-layout">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="mobile-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-section">
            <div className="logo-icon">
              <Shield size={28} />
            </div>
            <div className="logo-text">
              <h2>Admin Panel</h2>
              <span>Smart Mall DApp</span>
            </div>
          </div>
          <button 
            className="close-sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                className={`nav-item ${isActivePath(item.path) ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={20} />
                <div className="nav-content">
                  <span className="nav-title">{item.name}</span>
                  <span className="nav-description">{item.description}</span>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <Users size={20} />
            </div>
            <div className="user-details">
              <span className="user-name">{user?.username}</span>
              <span className="user-role">Administrator</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Top Header */}
        <header className="admin-header">
          <div className="header-left">
            <button 
              className="menu-toggle"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="breadcrumb">
              <Home size={16} />
              <span>Admin</span>
              {(location.pathname !== '/admin' && location.pathname !== '/admin/') && (
                <>
                  <span className="separator">/</span>
                  <span>
                    {navigationItems.find(item => isActivePath(item.path))?.name}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="header-right">
            <div className="header-actions">
              <div className="notification-bell">
                <div className="notification-dot"></div>
              </div>
              <div className="admin-profile">
                <div className="profile-avatar">
                  <Users size={18} />
                </div>
                <span className="profile-name">{user?.username}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout; 