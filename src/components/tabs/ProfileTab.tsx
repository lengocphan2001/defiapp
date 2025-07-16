import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import './ProfileTab.css';

const ProfileTab: React.FC = () => {
  const { user, logout } = useAuth();
  const { state, dispatch } = useApp();
  const [activeSection, setActiveSection] = useState('profile');

  const formatBalance = (balance: string) => {
    const numBalance = parseFloat(balance);
    return numBalance.toFixed(2);
  };

  const profileStats = [
    { label: 'Tổng giao dịch', value: '156', icon: '📊' },
    { label: 'NFT sở hữu', value: '23', icon: '🎨' },
    { label: 'Ngày tham gia', value: '45', icon: '📅' },
    { label: 'Điểm uy tín', value: '850', icon: '⭐' }
  ];

  const menuItems = [
    { id: 'profile', label: 'Thông tin cá nhân', icon: '👤' },
    { id: 'security', label: 'Bảo mật', icon: '🔒' },
    { id: 'notifications', label: 'Thông báo', icon: '🔔' },
    { id: 'preferences', label: 'Tùy chọn', icon: '⚙️' },
    { id: 'help', label: 'Trợ giúp', icon: '❓' },
    { id: 'about', label: 'Về ứng dụng', icon: 'ℹ️' }
  ];

  const handleThemeToggle = () => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    dispatch({ type: 'SET_THEME', payload: newTheme });
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="profile-tab">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-circle">
            <span>{user?.username?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="online-status"></div>
        </div>
        <div className="profile-info">
          <h2>{user?.username}</h2>
          <p className="user-email">{user?.phone}</p>
          <div className="user-level">
            <span className="level-badge">VIP Member</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab; 