import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import userService from '../../services/userService';
import { formatBalance } from '../../utils';
import ReferralUsersModal from '../modals/ReferralUsersModal';
import './ProfileTab.css';

const ProfileTab: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const { state, dispatch } = useApp();
  const [formData, setFormData] = useState({
    phone: user?.phone || '',
    fullName: user?.fullname || '',
    walletAddress: user?.address_wallet || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [loadingReferralCount, setLoadingReferralCount] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const fetchReferralCount = async () => {
    setLoadingReferralCount(true);
    try {
      const response = await userService.getReferralUsers();
      if (response.success) {
        setReferralCount(response.data.length);
      }
    } catch (error) {
      console.error('Error fetching referral count:', error);
    } finally {
      setLoadingReferralCount(false);
    }
  };

  useEffect(() => {
    fetchReferralCount();
  }, []);

  const handleSave = async () => {
    if (!formData.phone.trim()) {
      setMessage({ type: 'error', text: 'Số điện thoại là bắt buộc' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await userService.updateUserProfile({
        phone: formData.phone.trim(),
        fullname: formData.fullName.trim() || undefined,
        address_wallet: formData.walletAddress.trim() || undefined
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
        // Update the user context with new data
        updateUser(response.data.user);
      } else {
        setMessage({ type: 'error', text: response.message || 'Có lỗi xảy ra' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Có lỗi xảy ra' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-tab">
      {/* Personal Information Section */}
      <div className="profile-section">
        <div className="section-header">
          <span className="section-icon">👤</span>
          <h3 className="section-title">Thông tin cá nhân</h3>
        </div>
        <div className="section-content">
          <div className="form-group">
            
            <div className="form-value">{user?.username}</div>
          </div>
          <div className="form-group">
            <label className="form-label" style={{color: '#fff', textAlign: 'left'}}>Số điện thoại:</label>
            <input
              type="text"
              className="form-input"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Nhập số điện thoại"
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{color: '#fff', textAlign: 'left'}}>Họ tên đầy đủ:</label>
            <input
              type="text"
              className="form-input"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Nhập họ tên đầy đủ"
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{color: '#fff', textAlign: 'left'}}>Ví BEP20:</label>
            <input
              type="text"
              className="form-input"
              value={formData.walletAddress}
              onChange={(e) => handleInputChange('walletAddress', e.target.value)}
              placeholder="Nhập địa chỉ ví BEP20"
            />
          </div>
          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}
          <button className="save-button" onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>

      {/* Logout Section */}
      

      {/* Referral Section */}
      <div className="profile-section">
        <div className="section-header">
          <span className="section-icon">🔗</span>
          <h3 className="section-title">Referral</h3>
        </div>
        <div className="section-content">
          <div className="info-item">
            <span className="info-label">Trực tiếp:</span>
            <span className="info-value">
              {loadingReferralCount ? (
                <span className="loading-dots">...</span>
              ) : (
                referralCount
              )}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Đội nhóm:</span>
            <span className="info-value">0</span>
          </div>
          <div className="info-item">
            <span className="info-label">Doanh số nhóm:</span>
            <span className="info-value">{formatBalance('0')}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Mã giới thiệu:</span>
            <span className="info-value referral-code">{user?.referral_code}</span>
          </div>
          <button 
            className="show-referral-button" 
            onClick={() => setShowReferralModal(true)}
          >
            <span className="referral-button-icon">👥</span>
            Xem danh sách người giới thiệu ({referralCount})
          </button>
        </div>
      </div>

      {/* Rank/Level Section */}
      <div className="profile-section">
        <div className="section-header">
          <span className="section-icon">❗</span>
          <h3 className="section-title">Cấp bậc</h3>
        </div>
        <div className="section-content">
          <div className="info-item">
            <span className="info-label">VIP:</span>
            <span className="info-value">VIP0 (1 ngày)</span>
          </div>
          <div className="info-item">
            <span className="info-label">Lợi nhuận:</span>
            <span className="info-value">1.5%</span>
          </div>
          <div className="info-item">
            <span className="info-label">S-Level:</span>
            <span className="info-value">S0</span>
          </div>
          <div className="info-item">
            <span className="info-label">Hoa hồng đội:</span>
            <span className="info-value">0%</span>
          </div>
          <div className="info-row">
            <span className="info-label">Số dư:</span>
            <span className="info-value">{formatBalance('0')}</span>
          </div>
        </div>
      </div>
      <button className="logout-button" onClick={logout}>
        <span className="logout-icon">🚪</span>
        Đăng xuất
      </button>
      <ReferralUsersModal 
        isOpen={showReferralModal} 
        onClose={() => {
          setShowReferralModal(false);
          fetchReferralCount(); // Refresh count when modal closes
        }} 
      />
    </div>
  );
};

export default ProfileTab; 