import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';
import './ReferralUsersModal.css';

interface ReferralUser {
  id: number;
  username: string;
  phone: string;
  fullname: string;
  balance: string;
  address_wallet: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface ReferralUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReferralUsersModal: React.FC<ReferralUsersModalProps> = ({ isOpen, onClose }) => {
  const [referralUsers, setReferralUsers] = useState<ReferralUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchReferralUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    const content = contentRef.current;
    if (content) {
      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = content;
        setShowScrollIndicator(scrollTop < scrollHeight - clientHeight - 10);
      };

      content.addEventListener('scroll', handleScroll);
      handleScroll(); // Check initial state

      return () => content.removeEventListener('scroll', handleScroll);
    }
  }, [referralUsers]);

  const fetchReferralUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await userService.getReferralUsers();
      
      if (response.success) {
        setReferralUsers(response.data);
      } else {
        setError(response.message || 'Có lỗi xảy ra khi tải danh sách người giới thiệu');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải danh sách người giới thiệu');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatBalance = (balance: string): string => {
    return parseFloat(balance).toLocaleString('vi-VN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
  };

  if (!isOpen) return null;

  return (
    <div className="referral-modal-overlay" onClick={onClose}>
      <div className="referral-modal" onClick={(e) => e.stopPropagation()}>
        <div className="referral-modal-header">
          <h2 className="referral-modal-title">
            <span className="referral-icon">👥</span>
            Danh sách người giới thiệu
          </h2>
          <button className="referral-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="referral-modal-content" ref={contentRef}>
          {loading ? (
            <div className="referral-loading">
              <div className="loading-spinner"></div>
              <p>Đang tải danh sách...</p>
            </div>
          ) : error ? (
            <div className="referral-error">
              <p>{error}</p>
              <button className="retry-button" onClick={fetchReferralUsers}>
                Thử lại
              </button>
            </div>
          ) : referralUsers.length === 0 ? (
            <div className="referral-empty">
              <p>Bạn chưa có người giới thiệu nào</p>
            </div>
          ) : (
            <div className="referral-list">
              {referralUsers.map((user) => (
                <div key={user.id} className="referral-user-card">
                  <div className="referral-user-header">
                    <div className="referral-user-info">
                      <div className="referral-user-name">
                        {user.fullname || user.username}
                      </div>
                    </div>
                    <div className={`referral-user-status ${user.status}`}>
                      {user.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                    </div>
                  </div>
                  
                  <div className="referral-user-details">
                    <div className="referral-user-detail">
                      <span className="detail-label">Số điện thoại:</span>
                      <span className="detail-value">{user.phone}</span>
                    </div>
                    <div className="referral-user-detail">
                      <span className="detail-label">Ngày tham gia:</span>
                      <span className="detail-value">{formatDate(user.created_at)}</span>
                    </div>
                    {user.address_wallet && (
                      <div className="referral-user-detail">
                        <span className="detail-label">Ví:</span>
                        <span className="detail-value wallet">
                          {user.address_wallet.substring(0, 8)}...{user.address_wallet.substring(user.address_wallet.length - 6)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {showScrollIndicator && (
            <div className="scroll-indicator">
              <span>↓</span>
            </div>
          )}
        </div>

        <div className="referral-modal-footer">
          <div className="referral-summary">
            <span>Tổng cộng: {referralUsers.length} người</span>
          </div>
          <button className="referral-modal-close-button" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralUsersModal; 