import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './HomeTab.css';

const HomeTab: React.FC = () => {
  const { user } = useAuth();

  const formatBalance = (balance: string) => {
    const numBalance = parseFloat(balance);
    return numBalance.toFixed(2);
  };

  const stats = [
    {
      title: 'Tổng giao dịch',
      value: '1,234',
      change: '+12.5%',
      positive: true,
      icon: '📈'
    },
    {
      title: 'NFT sở hữu',
      value: '45',
      change: '+3',
      positive: true,
      icon: '🎨'
    },
    {
      title: 'Lợi nhuận',
      value: '$2,450',
      change: '+8.2%',
      positive: true,
      icon: '💰'
    }
  ];

  const quickActions = [
    { title: 'Mua Token', icon: '🛒', color: '#6366f1' },
    { title: 'Bán Token', icon: '💸', color: '#ef4444' },
    { title: 'Chuyển khoản', icon: '↗️', color: '#10b981' },
    { title: 'Lịch sử', icon: '📋', color: '#f59e0b' }
  ];

  return (
    <div className="home-tab">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-header">
          <div className="user-avatar">
            <span>{user?.username?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="welcome-text">
            <h2>Xin chào, {user?.username}!</h2>
            <p>Chúc bạn một ngày giao dịch thành công</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default HomeTab; 