import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  FileText, 
  DollarSign, 
  Wallet, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MoreVertical,
  Download,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import requestService, { Request } from '../../services/requestService';
import userService from '../../services/userService';
import './RequestsPage.css';

const RequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'success' | 'failed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [sortBy, setSortBy] = useState<'id' | 'created_at' | 'smp_amount'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    filterAndSortRequests();
  }, [requests, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await requestService.getAllRequests();
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortRequests = () => {
    let filtered = requests.filter(request => {
      const matchesSearch = 
        request.address_wallet.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.id.toString().includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesType = typeFilter === 'all' || request.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });

    // Sort requests
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === 'smp_amount') {
        aValue = parseFloat(aValue.toString());
        bValue = parseFloat(bValue.toString());
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

    setFilteredRequests(filtered);
  };

  const handleSort = (field: 'id' | 'created_at' | 'smp_amount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleStatusUpdate = async (requestId: number, newStatus: 'pending' | 'success' | 'failed') => {
    setUpdatingStatus(requestId);
    try {
      await requestService.updateRequestStatus(requestId, newStatus);
      
      // If status is changed to success, update user balance
      if (newStatus === 'success') {
        const request = requests.find(req => req.id === requestId);
        if (request) {
          await userService.updateUserBalance(request.user_id, parseFloat(request.smp_amount.toString()));
        }
      }
      
      await loadRequests();
      alert('Trạng thái yêu cầu đã được cập nhật thành công!');
    } catch (error) {
      console.error('Failed to update request status:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái!');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleRequestClick = (request: Request) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
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
    return `${address.substring(0, 2)}...${address.substring(address.length - 6)}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} className="status-icon success" />;
      case 'pending':
        return <Clock size={16} className="status-icon pending" />;
      case 'failed':
        return <XCircle size={16} className="status-icon failed" />;
      default:
        return <AlertTriangle size={16} className="status-icon" />;
    }
  };

  const exportRequests = () => {
    const csvContent = [
      ['ID', 'Type', 'SMP Amount', 'USDT Amount', 'Wallet Address', 'Status', 'Created At'],
      ...filteredRequests.map(request => [
        request.id,
        requestService.formatType(request.type).text,
        request.smp_amount,
        request.usdt_amount,
        request.address_wallet,
        requestService.formatStatus(request.status).text,
        formatDate(request.created_at)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requests_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStats = () => {
    const total = requests.length;
    const pending = requests.filter(req => req.status === 'pending').length;
    const success = requests.filter(req => req.status === 'success').length;
    const failed = requests.filter(req => req.status === 'failed').length;
    const totalSMP = requests
      .filter(req => req.status === 'success')
      .reduce((sum, req) => sum + parseFloat(req.smp_amount.toString()), 0);

    return { total, pending, success, failed, totalSMP };
  };

  const stats = getStats();

  return (
    <div className="requests-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Request Management</h1>
          <p>Handle deposit and withdrawal requests</p>
        </div>
        <div className="header-actions">
          <button className="export-button" onClick={exportRequests}>
            <Download size={16} />
            Export CSV
          </button>
          <button className="refresh-button" onClick={loadRequests} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon total">
            <FileText size={20} />
          </div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Requests</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <CheckCircle size={20} />
          </div>
          <div className="stat-content">
            <h3>{stats.success}</h3>
            <p>Success</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon failed">
            <XCircle size={20} />
          </div>
          <div className="stat-content">
            <h3>{stats.failed}</h3>
            <p>Failed</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon smp">
            <DollarSign size={20} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalSMP.toLocaleString('vi-VN')}</h3>
            <p>Total SMP</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search requests by ID or wallet address..."
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
              <option value="pending">Pending</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          
          <div className="filter-group">
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value as any)}
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
            </select>
          </div>
          
          <div className="results-count">
            {filteredRequests.length} of {requests.length} requests
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="requests-table-container">
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
          <div className="table-cell">Type</div>
          <div 
            className={`table-cell sortable ${sortBy === 'smp_amount' ? 'sorted' : ''}`}
            onClick={() => handleSort('smp_amount')}
          >
            SMP Amount
            {sortBy === 'smp_amount' && (
              <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div className="table-cell">USDT Amount</div>
          <div className="table-cell">Wallet Address</div>
          <div 
            className={`table-cell sortable ${sortBy === 'created_at' ? 'sorted' : ''}`}
            onClick={() => handleSort('created_at')}
          >
            Created Date
            {sortBy === 'created_at' && (
              <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div className="table-cell">Status</div>
          <div className="table-cell">Actions</div>
        </div>
        
        <div className="table-body">
          {filteredRequests.map((request) => {
            const typeInfo = requestService.formatType(request.type);
            const statusInfo = requestService.formatStatus(request.status);
            
            return (
              <div key={request.id} className="table-row">
                <div className="table-cell request-id">#{request.id}</div>
                <div className="table-cell type">
                  <span 
                    className="type-badge"
                    style={{ backgroundColor: typeInfo.bgColor, color: typeInfo.color }}
                  >
                    {typeInfo.text}
                  </span>
                </div>
                <div className="table-cell smp-amount">
                  {parseFloat(request.smp_amount.toString()).toLocaleString('vi-VN')} SMP
                </div>
                <div className="table-cell usdt-amount">
                  {parseFloat(request.usdt_amount.toString()).toFixed(2)} USDT
                </div>
                <div className="table-cell wallet">
                  <div className="wallet-info">
                    <Wallet size={14} />
                    <span>{formatWalletAddress(request.address_wallet)}</span>
                  </div>
                </div>
                <div className="table-cell created-date">
                  <div className="date-info">
                    <Calendar size={14} />
                    <span>{formatDate(request.created_at)}</span>
                  </div>
                </div>
                <div className="table-cell status">
                  <div className="status-info">
                    {getStatusIcon(request.status)}
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}
                    >
                      {statusInfo.text}
                    </span>
                  </div>
                </div>
                <div className="table-cell actions">
                  <button 
                    className="action-btn view"
                    onClick={() => handleRequestClick(request)}
                  >
                    <Eye size={14} />
                  </button>
                  {request.status === 'pending' && (
                    <>
                      <button 
                        className="action-btn approve"
                        onClick={() => handleStatusUpdate(request.id, 'success')}
                        disabled={updatingStatus === request.id}
                      >
                        <CheckCircle size={14} />
                      </button>
                      <button 
                        className="action-btn reject"
                        onClick={() => handleStatusUpdate(request.id, 'failed')}
                        disabled={updatingStatus === request.id}
                      >
                        <XCircle size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredRequests.length === 0 && (
          <div className="empty-state">
            <FileText size={48} />
            <h3>No requests found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Request Detail Modal */}
      {showRequestModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="request-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request Details</h2>
              <button 
                className="close-modal"
                onClick={() => setShowRequestModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="request-detail-section">
                <h3>Basic Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Request ID</label>
                    <span>#{selectedRequest.id}</span>
                  </div>
                  <div className="detail-item">
                    <label>Type</label>
                    <span 
                      className="type-badge"
                      style={{ 
                        backgroundColor: requestService.formatType(selectedRequest.type).bgColor, 
                        color: requestService.formatType(selectedRequest.type).color 
                      }}
                    >
                      {requestService.formatType(selectedRequest.type).text}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Status</label>
                    <span 
                      className="status-badge"
                      style={{ 
                        backgroundColor: requestService.formatStatus(selectedRequest.status).bgColor, 
                        color: requestService.formatStatus(selectedRequest.status).color 
                      }}
                    >
                      {requestService.formatStatus(selectedRequest.status).text}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>User ID</label>
                    <span>#{selectedRequest.user_id}</span>
                  </div>
                </div>
              </div>

              <div className="request-detail-section">
                <h3>Transaction Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>SMP Amount</label>
                    <span className="amount-smp">
                      {parseFloat(selectedRequest.smp_amount.toString()).toLocaleString('vi-VN')} SMP
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>USDT Amount</label>
                    <span className="amount-usdt">
                      {parseFloat(selectedRequest.usdt_amount.toString()).toFixed(2)} USDT
                    </span>
                  </div>
                  <div className="detail-item full-width">
                    <label>Wallet Address</label>
                    <span className="wallet-address">
                      {selectedRequest.address_wallet}
                    </span>
                  </div>
                </div>
              </div>

              <div className="request-detail-section">
                <h3>Timeline</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Created At</label>
                    <span>{formatDate(selectedRequest.created_at)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Updated At</label>
                    <span>{formatDate(selectedRequest.updated_at)}</span>
                  </div>
                </div>
              </div>

              {selectedRequest.status === 'pending' && (
                <div className="request-actions">
                  <h3>Actions</h3>
                  <div className="action-buttons">
                    <button 
                      className="action-btn-large approve"
                      onClick={() => {
                        handleStatusUpdate(selectedRequest.id, 'success');
                        setShowRequestModal(false);
                      }}
                      disabled={updatingStatus === selectedRequest.id}
                    >
                      <CheckCircle size={18} />
                      Approve Request
                    </button>
                    <button 
                      className="action-btn-large reject"
                      onClick={() => {
                        handleStatusUpdate(selectedRequest.id, 'failed');
                        setShowRequestModal(false);
                      }}
                      disabled={updatingStatus === selectedRequest.id}
                    >
                      <XCircle size={18} />
                      Reject Request
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsPage; 