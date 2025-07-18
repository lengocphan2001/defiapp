import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Activity,
  BarChart3,
  Image,
  ShoppingCart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import requestService, { Request } from '../../services/requestService';
import userService from '../../services/userService';
import nftService from '../../services/nftService';
import { formatBalance } from '../../utils';
import './DashboardPage.css';

interface User {
  id: number;
  username: string;
  phone: string;
  balance: string;
  address_wallet: string;
  created_at: string;
  status: 'active' | 'inactive';
}

interface DashboardStats {
  totalUsers: number;
  totalRequests: number;
  pendingRequests: number;
  totalSMP: number;
  todayRequests: number;
  todaySMP: number;
  successRate: number;
  averageRequestValue: number;
  totalNFTs: number;
  availableNFTs: number;
  soldNFTs: number;
  totalNFTValue: number;
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalRequests: 0,
    pendingRequests: 0,
    totalSMP: 0,
    todayRequests: 0,
    todaySMP: 0,
    successRate: 0,
    averageRequestValue: 0,
    totalNFTs: 0,
    availableNFTs: 0,
    soldNFTs: 0,
    totalNFTValue: 0
  });
  const [recentRequests, setRecentRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [usersResponse, requestsResponse, nftStatsResponse] = await Promise.all([
        userService.getAllUsers(),
        requestService.getAllRequests(),
        nftService.getNFTStats()
      ]);

      const requests = requestsResponse.data;
      const users = usersResponse.data;
      const nftStats = nftStatsResponse.data;

      // Calculate stats
      const pendingRequests = requests.filter(req => req.status === 'pending');
      const successRequests = requests.filter(req => req.status === 'success');
      const totalSMP = successRequests.reduce((sum, req) => sum + parseFloat(req.smp_amount.toString()), 0);
      
      // Today's stats
      const today = new Date().toDateString();
      const todayRequests = requests.filter(req => 
        new Date(req.created_at).toDateString() === today
      );
      const todaySMP = todayRequests
        .filter(req => req.status === 'success')
        .reduce((sum, req) => sum + parseFloat(req.smp_amount.toString()), 0);

      // Success rate
      const successRate = requests.length > 0 ? (successRequests.length / requests.length) * 100 : 0;
      
      // Average request value
      const averageRequestValue = requests.length > 0 ? totalSMP / requests.length : 0;

      setStats({
        totalUsers: users.length,
        totalRequests: requests.length,
        pendingRequests: pendingRequests.length,
        totalSMP,
        todayRequests: todayRequests.length,
        todaySMP,
        successRate,
        averageRequestValue,
        totalNFTs: nftStats.totalNFTs,
        availableNFTs: nftStats.availableNFTs,
        soldNFTs: nftStats.soldNFTs,
        totalNFTValue: nftStats.totalValue
      });

      // Set recent requests (last 10)
      setRecentRequests(requests.slice(0, 10));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
        return <Activity size={16} className="status-icon" />;
    }
  };

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Dashboard Overview</h1>
          <p>Monitor your platform performance and user activity</p>
        </div>
        <button 
          className="refresh-button"
          onClick={loadDashboardData}
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? 'spinning' : ''} />
          Refresh Data
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalUsers.toLocaleString()}</h3>
            <p>Total Users</p>
            <div className="stat-trend positive">
              <TrendingUp size={14} />
              <span>+12% this month</span>
            </div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalRequests.toLocaleString()}</h3>
            <p>Total Requests</p>
            <div className="stat-trend positive">
              <TrendingUp size={14} />
              <span>+8% this week</span>
            </div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.pendingRequests}</h3>
            <p>Pending Requests</p>
            <div className="stat-trend neutral">
              <span>Requires attention</span>
            </div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>{formatBalance(stats.totalSMP)}</h3>
            <p>Total SMP</p>
            <div className="stat-trend positive">
              <TrendingUp size={14} />
              <span>+15% this month</span>
            </div>
          </div>
        </div>

        <div className="stat-card nft">
          <div className="stat-icon">
            <Image size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalNFTs.toLocaleString()}</h3>
            <p>Total NFTs</p>
            <div className="stat-trend positive">
              <TrendingUp size={14} />
              <span>{stats.availableNFTs} available</span>
            </div>
          </div>
          <button 
            className="quick-action-btn"
            onClick={() => window.location.href = '/admin/nfts'}
            title="Manage NFTs"
          >
            <Image size={16} />
          </button>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="additional-stats">
        <div className="stat-card secondary">
          <div className="stat-icon">
            <BarChart3 size={20} />
          </div>
          <div className="stat-content">
            <h3>{stats.successRate.toFixed(1)}%</h3>
            <p>Success Rate</p>
          </div>
        </div>

        <div className="stat-card secondary">
          <div className="stat-icon">
            <DollarSign size={20} />
          </div>
          <div className="stat-content">
            <h3>{formatBalance(stats.averageRequestValue)}</h3>
            <p>Avg. Request Value</p>
          </div>
        </div>

        <div className="stat-card secondary">
          <div className="stat-icon">
            <FileText size={20} />
          </div>
          <div className="stat-content">
            <h3>{stats.todayRequests}</h3>
            <p>Today's Requests</p>
          </div>
        </div>

        <div className="stat-card secondary">
          <div className="stat-icon">
            <DollarSign size={20} />
          </div>
          <div className="stat-content">
            <h3>{formatBalance(stats.todaySMP)}</h3>
            <p>Today's SMP</p>
          </div>
        </div>

        <div className="stat-card secondary">
          <div className="stat-icon">
            <ShoppingCart size={20} />
          </div>
          <div className="stat-content">
            <h3>{stats.soldNFTs}</h3>
            <p>Sold NFTs</p>
          </div>
        </div>

        <div className="stat-card secondary">
          <div className="stat-icon">
            <DollarSign size={20} />
          </div>
          <div className="stat-content">
            <h3>{formatBalance(stats.totalNFTValue)}</h3>
            <p>Total NFT Value</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity-section">
        <div className="section-header">
          <h2>Recent Activity</h2>
          <span className="activity-count">{recentRequests.length} recent requests</span>
        </div>

        <div className="activity-list">
          {recentRequests.map((request) => {
            const typeInfo = requestService.formatType(request.type);
            const statusInfo = requestService.formatStatus(request.status);
            
            return (
              <div key={request.id} className="activity-item">
                <div className="activity-icon">
                  {getStatusIcon(request.status)}
                </div>
                <div className="activity-content">
                  <div className="activity-main">
                    <span className="activity-title">
                      Request #{request.id} - {typeInfo.text}
                    </span>
                    <span className="activity-amount">
                      {formatBalance(parseFloat(request.smp_amount.toString()))} SMP
                    </span>
                  </div>
                  <div className="activity-details">
                                         <span className="activity-wallet">
                       {request.address_wallet.substring(0, 2)}...{request.address_wallet.substring(request.address_wallet.length - 6)}
                     </span>
                    <span className="activity-time">
                      {requestService.formatDate(request.created_at)}
                    </span>
                  </div>
                </div>
                <div className="activity-status">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}
                  >
                    {statusInfo.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {recentRequests.length === 0 && (
          <div className="empty-state">
            <FileText size={48} />
            <h3>No recent activity</h3>
            <p>Requests will appear here as they come in</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage; 