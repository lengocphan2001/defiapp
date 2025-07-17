import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Users, 
  Phone, 
  Wallet, 
  Calendar,
  Eye,
  MoreVertical,
  Download,
  UserPlus
} from 'lucide-react';
import userService from '../../services/userService';
import './UsersPage.css';

interface User {
  id: number;
  username: string;
  phone: string;
  balance: string;
  address_wallet: string;
  created_at: string;
  status: 'active' | 'inactive';
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'id' | 'username' | 'balance' | 'created_at'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchTerm, statusFilter, sortBy, sortOrder]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortUsers = () => {
    let filtered = users.filter(user => {
      const matchesSearch = 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm) ||
        user.address_wallet.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sort users
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === 'balance') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      } else if (sortBy === 'created_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
  };

  const handleSort = (field: 'id' | 'username' | 'balance' | 'created_at') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatWalletAddress = (address: string) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? '#10b981' : '#ef4444';
  };

  const exportUsers = () => {
    const csvContent = [
      ['ID', 'Username', 'Phone', 'Balance', 'Wallet Address', 'Status', 'Created At'],
      ...filteredUsers.map(user => [
        user.id,
        user.username,
        user.phone,
        user.balance,
        user.address_wallet,
        user.status,
        formatDate(user.created_at)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="users-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>User Management</h1>
          <p>Manage user accounts and view user information</p>
        </div>
        <div className="header-actions">
          <button className="export-button" onClick={exportUsers}>
            <Download size={16} />
            Export CSV
          </button>
          <button className="refresh-button" onClick={loadUsers} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search users by username, phone, or wallet address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <div className="filter-group">
            <Filter size={16} />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div className="results-count">
            {filteredUsers.length} of {users.length} users
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        <div className="table-header">
          <div 
            className={`table-cell sortable ${sortBy === 'id' ? 'sorted' : ''}`}
            onClick={() => handleSort('id')}
          >
            ID
            {sortBy === 'id' && (
              <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className={`table-cell sortable ${sortBy === 'username' ? 'sorted' : ''}`}
            onClick={() => handleSort('username')}
          >
            Username
            {sortBy === 'username' && (
              <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div className="table-cell">Phone</div>
          <div 
            className={`table-cell sortable ${sortBy === 'balance' ? 'sorted' : ''}`}
            onClick={() => handleSort('balance')}
          >
            Balance
            {sortBy === 'balance' && (
              <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div className="table-cell">Wallet Address</div>
          <div 
            className={`table-cell sortable ${sortBy === 'created_at' ? 'sorted' : ''}`}
            onClick={() => handleSort('created_at')}
          >
            Joined Date
            {sortBy === 'created_at' && (
              <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div className="table-cell">Status</div>
          <div className="table-cell">Actions</div>
        </div>
        
        <div className="table-body">
          {filteredUsers.map((user) => (
            <div key={user.id} className="table-row">
              <div className="table-cell user-id">#{user.id}</div>
              <div className="table-cell username">
                <div className="user-info">
                  <div className="user-avatar">
                    <Users size={16} />
                  </div>
                  <span>{user.username}</span>
                </div>
              </div>
              <div className="table-cell phone">
                <div className="phone-info">
                  <Phone size={14} />
                  <span>{user.phone}</span>
                </div>
              </div>
              <div className="table-cell balance">
                {parseFloat(user.balance).toLocaleString('vi-VN')} SMP
              </div>
              <div className="table-cell wallet">
                <div className="wallet-info">
                  <Wallet size={14} />
                  <span>{formatWalletAddress(user.address_wallet)}</span>
                </div>
              </div>
              <div className="table-cell joined">
                <div className="date-info">
                  <Calendar size={14} />
                  <span>{formatDate(user.created_at)}</span>
                </div>
              </div>
              <div className="table-cell status">
                <span 
                  className="status-badge"
                  style={{ 
                    backgroundColor: getStatusColor(user.status) + '20',
                    color: getStatusColor(user.status)
                  }}
                >
                  {user.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="table-cell actions">
                <button 
                  className="action-btn view"
                  onClick={() => handleUserClick(user)}
                >
                  <Eye size={14} />
                </button>
                <button className="action-btn more">
                  <MoreVertical size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="empty-state">
            <Users size={48} />
            <h3>No users found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Details</h2>
              <button 
                className="close-modal"
                onClick={() => setShowUserModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="user-detail-section">
                <h3>Basic Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>User ID</label>
                    <span>#{selectedUser.id}</span>
                  </div>
                  <div className="detail-item">
                    <label>Username</label>
                    <span>{selectedUser.username}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone</label>
                    <span>{selectedUser.phone}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status</label>
                    <span 
                      className="status-badge"
                      style={{ 
                        backgroundColor: getStatusColor(selectedUser.status) + '20',
                        color: getStatusColor(selectedUser.status)
                      }}
                    >
                      {selectedUser.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="user-detail-section">
                <h3>Financial Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Current Balance</label>
                    <span className="balance-amount">
                      {parseFloat(selectedUser.balance).toLocaleString('vi-VN')} SMP
                    </span>
                  </div>
                  <div className="detail-item full-width">
                    <label>Wallet Address</label>
                    <span className="wallet-address">
                      {selectedUser.address_wallet || 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="user-detail-section">
                <h3>Account Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Joined Date</label>
                    <span>{formatDate(selectedUser.created_at)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Account Age</label>
                    <span>
                      {Math.floor((Date.now() - new Date(selectedUser.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage; 