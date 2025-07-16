import React, { useState, useEffect } from 'react';
import { Users, FileText, BarChart3, LogOut, Search, Filter, RefreshCw, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import requestService, { Request } from '../../services/requestService';
import userService from '../../services/userService';
import './AdminDashboard.css';

interface User {
  id: number;
  username: string;
  phone: string;
  balance: string;
  address_wallet: string;
  created_at: string;
  status: 'active' | 'inactive';
}

interface AdminStats {
  totalUsers: number;
  totalRequests: number;
  pendingRequests: number;
  totalSMP: number;
  todayRequests: number;
  todaySMP: number;
}

const AdminDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'requests'>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'success' | 'failed'>('all');
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalRequests: 0,
    pendingRequests: 0,
    totalSMP: 0,
    todayRequests: 0,
    todaySMP: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersResponse, requestsResponse] = await Promise.all([
        userService.getAllUsers(),
        requestService.getAllRequests()
      ]);

      setUsers(usersResponse.data);
      setRequests(requestsResponse.data);

      // Calculate stats
      const pendingRequests = requestsResponse.data.filter(req => req.status === 'pending');
      const successRequests = requestsResponse.data.filter(req => req.status === 'success');
      const totalSMP = successRequests.reduce((sum, req) => sum + parseFloat(req.smp_amount.toString()), 0);
      
      // Today's stats
      const today = new Date().toDateString();
      const todayRequests = requestsResponse.data.filter(req => 
        new Date(req.created_at).toDateString() === today
      );
      const todaySMP = todayRequests
        .filter(req => req.status === 'success')
        .reduce((sum, req) => sum + parseFloat(req.smp_amount.toString()), 0);

      setStats({
        totalUsers: usersResponse.data.length,
        totalRequests: requestsResponse.data.length,
        pendingRequests: pendingRequests.length,
        totalSMP,
        todayRequests: todayRequests.length,
        todaySMP
      });
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: number, newStatus: 'pending' | 'success' | 'failed') => {
    try {
      await requestService.updateRequestStatus(requestId, newStatus);
      
      // If status is changed to success, update user balance
      if (newStatus === 'success') {
        const request = requests.find(req => req.id === requestId);
        if (request) {
          await userService.updateUserBalance(request.user_id, parseFloat(request.smp_amount.toString()));
        }
      }
      
      await loadData();
      alert('Trạng thái yêu cầu đã được cập nhật thành công!');
    } catch (error) {
      console.error('Failed to update request status:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái!');
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.address_wallet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm)
  );

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <div className="admin-avatar">
            <Users size={24} />
          </div>
          <div className="admin-info">
            <h3>Admin Panel</h3>
            <p>Smart Mall DApp</p>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart3 size={20} />
            <span>Dashboard</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={20} />
            <span>Users</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <FileText size={20} />
            <span>Requests</span>
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <div className="current-user">
            <span>Welcome, {user?.username}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        <div className="admin-header">
          <div className="header-left">
            <h1>
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'requests' && 'Request Management'}
            </h1>
            <p>
              {activeTab === 'dashboard' && 'Monitor your platform performance and user activity'}
              {activeTab === 'users' && 'Manage user accounts and view user information'}
              {activeTab === 'requests' && 'Handle deposit and withdrawal requests'}
            </p>
          </div>
          
          <div className="header-actions">
            <button className="refresh-btn" onClick={loadData} disabled={loading}>
              <RefreshCw size={18} className={loading ? 'spinning' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-content">
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-icon">
                  <Users size={24} />
                </div>
                <div className="stat-info">
                  <h3>{stats.totalUsers.toLocaleString()}</h3>
                  <p>Total Users</p>
                  <span className="stat-trend positive">+12% this month</span>
                </div>
              </div>
              
              <div className="stat-card success">
                <div className="stat-icon">
                  <FileText size={24} />
                </div>
                <div className="stat-info">
                  <h3>{stats.totalRequests.toLocaleString()}</h3>
                  <p>Total Requests</p>
                  <span className="stat-trend positive">+8% this week</span>
                </div>
              </div>
              
              <div className="stat-card warning">
                <div className="stat-icon">
                  <Clock size={24} />
                </div>
                <div className="stat-info">
                  <h3>{stats.pendingRequests}</h3>
                  <p>Pending Requests</p>
                  <span className="stat-trend neutral">Requires attention</span>
                </div>
              </div>
              
              <div className="stat-card info">
                <div className="stat-icon">
                  <DollarSign size={24} />
                </div>
                <div className="stat-info">
                  <h3>{stats.totalSMP.toLocaleString('vi-VN')}</h3>
                  <p>Total SMP</p>
                  <span className="stat-trend positive">+15% this month</span>
                </div>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="today-stats">
                <h3>Today's Activity</h3>
                <div className="today-cards">
                  <div className="today-card">
                    <div className="today-icon">
                      <FileText size={20} />
                    </div>
                    <div className="today-info">
                      <h4>{stats.todayRequests}</h4>
                      <p>New Requests</p>
                    </div>
                  </div>
                  <div className="today-card">
                    <div className="today-icon">
                      <DollarSign size={20} />
                    </div>
                    <div className="today-info">
                      <h4>{stats.todaySMP.toLocaleString('vi-VN')}</h4>
                      <p>SMP Processed</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="recent-activity">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  {requests.slice(0, 8).map((request) => (
                    <div key={request.id} className="activity-item">
                      <div className="activity-icon">
                        <FileText size={16} />
                      </div>
                      <div className="activity-content">
                        <p>Request #{request.id} - {requestService.formatType(request.type).text}</p>
                        <span className="activity-time">
                          {requestService.formatDate(request.created_at)}
                        </span>
                      </div>
                      <div className="activity-status">
                        <span className={`status-badge ${request.status}`}>
                          {requestService.formatStatus(request.status).text}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="users-content">
            <div className="content-header">
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search users by username or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="header-stats">
                <span>Total Users: {users.length}</span>
              </div>
            </div>

            <div className="users-table">
              <div className="table-header">
                <span>ID</span>
                <span>Username</span>
                <span>Phone</span>
                <span>Balance</span>
                <span>Wallet Address</span>
                <span>Joined Date</span>
                <span>Status</span>
              </div>
              
              <div className="table-body">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="table-row">
                    <span className="user-id">#{user.id}</span>
                    <span className="username">{user.username}</span>
                    <span className="phone">{user.phone}</span>
                    <span className="balance">{parseFloat(user.balance).toLocaleString('vi-VN')} SMP</span>
                    <span className="wallet">
                      {user.address_wallet ? `${user.address_wallet.substring(0, 8)}...${user.address_wallet.substring(-6)}` : 'N/A'}
                    </span>
                    <span className="joined">{requestService.formatDate(user.created_at)}</span>
                    <span>
                      <span className={`status-badge ${user.status}`}>
                        {user.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="requests-content">
            <div className="content-header">
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search requests by ID or wallet address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="filter-box">
                <Filter size={18} />
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            <div className="requests-table">
              <div className="table-header">
                <span>ID</span>
                <span>Type</span>
                <span>SMP Amount</span>
                <span>USDT Amount</span>
                <span>Wallet Address</span>
                <span>Created Date</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              
              <div className="table-body">
                {filteredRequests.map((request) => {
                  const typeInfo = requestService.formatType(request.type);
                  const statusInfo = requestService.formatStatus(request.status);
                  
                  return (
                    <div key={request.id} className="table-row">
                      <span className="request-id">#{request.id}</span>
                      <span>
                        <span 
                          className="type-badge"
                          style={{ backgroundColor: typeInfo.bgColor, color: typeInfo.color }}
                        >
                          {typeInfo.text}
                        </span>
                      </span>
                      <span className="smp-amount">{parseFloat(request.smp_amount.toString()).toLocaleString('vi-VN')} SMP</span>
                      <span className="usdt-amount">{parseFloat(request.usdt_amount.toString()).toFixed(2)} USDT</span>
                      <span className="wallet">{request.address_wallet.substring(0, 8)}...{request.address_wallet.substring(-6)}</span>
                      <span className="created-date">{requestService.formatDate(request.created_at)}</span>
                      <span>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}
                        >
                          {statusInfo.text}
                        </span>
                      </span>
                      <span className="actions">
                        {request.status === 'pending' && (
                          <>
                            <button 
                              className="action-btn success"
                              onClick={() => handleStatusUpdate(request.id, 'success')}
                            >
                              Approve
                            </button>
                            <button 
                              className="action-btn failed"
                              onClick={() => handleStatusUpdate(request.id, 'failed')}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 