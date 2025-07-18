import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import requestService, { Request } from '../../services/requestService';
import DepositModal from '../modals/DepositModal';
import './WalletTab.css';

const WalletTab: React.FC = () => {
  const { user } = useAuth();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);

  const formatBalance = (balance: string) => {
    const numBalance = parseFloat(balance);
    return numBalance.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Fetch user's requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await requestService.getUserRequests();
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load requests on component mount
  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDepositClick = () => {
    setIsDepositModalOpen(true);
  };

  const handleCloseDepositModal = () => {
    setIsDepositModalOpen(false);
  };

  const handleRequestCreated = () => {
    // Refresh the requests list
    fetchRequests();
  };

  return (
    <div className="wallet-tab">
      {/* Main Balance Section */}
      <div className="main-balance-section">
        <h2>Ví chính</h2>
        <div className="balance-card">
          <h3>SMP chính</h3>
          <div className="balance-amount">
            {formatBalance(user?.balance || '100000000000')} SMP
          </div>
          <div className="balance-actions">
            <button className="balance-btn primary" onClick={handleDepositClick}>
              Nạp
            </button>
            <button className="balance-btn secondary">Chuyển</button>
            <button className="balance-btn tertiary">Rút</button>
          </div>
        </div>
      </div>

      {/* Commission Sections */}
      <div className="commission-sections">
        {/* Direct Commission */}
        <div className="commission-card">
          <h3>Hoa hồng trực tiếp</h3>
          <div className="commission-amount">{formatBalance('0')} SMP</div>
          <button className="commission-btn">Rút trực tiếp</button>
        </div>

        {/* Tier Commission */}
        <div className="commission-card">
          <h3>Hoa hồng cấp bậc</h3>
          <div className="commission-amount">{formatBalance('0')} SMP</div>
          <button className="commission-btn">Rút cấp bậc</button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="transaction-history">
        <h3>Lịch sử giao dịch</h3>
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>Chưa có giao dịch.</p>
        </div>
      </div>

      {/* Request History */}
      <div className="request-history">
        <h3>Lịch sử yêu cầu</h3>
        <div className="request-table">
          <div className="table-header">
            <span>Loại</span>
            <span>SMP</span>
            <span>USDT</span>
            <span>Địa chỉ</span>
            <span>Thời gian</span>
            <span>TT</span>
          </div>
          
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Đang tải...</p>
            </div>
          ) : requests.length > 0 ? (
            <div className="request-list">
              {requests.map((request) => {
                const statusInfo = requestService.formatStatus(request.status);
                const typeInfo = requestService.formatType(request.type);
                
                // Ensure amounts are numbers
                const smpAmount = typeof request.smp_amount === 'string' 
                  ? parseFloat(request.smp_amount) 
                  : request.smp_amount;
                const usdtAmount = typeof request.usdt_amount === 'string' 
                  ? parseFloat(request.usdt_amount) 
                  : request.usdt_amount;
                
                return (
                  <div key={request.id} className="request-row">
                    <span className="request-type">
                      <span 
                        className="type-badge"
                        style={{ 
                          backgroundColor: typeInfo.bgColor, 
                          color: typeInfo.color 
                        }}
                      >
                        {typeInfo.text}
                      </span>
                    </span>
                    <span className="request-smp">
                      {smpAmount.toLocaleString('vi-VN')} SMP
                    </span>
                    <span className="request-usdt">
                      {usdtAmount.toFixed(2)} USDT
                    </span>
                    <span className="request-address">
                      {request.address_wallet.substring(0, 2)}...{request.address_wallet.substring(-6)}
                    </span>
                    <span className="request-time">
                      {requestService.formatDate(request.created_at)}
                    </span>
                    <span className="request-status">
                      <span 
                        className="status-badge"
                        style={{ 
                          backgroundColor: statusInfo.bgColor, 
                          color: statusInfo.color 
                        }}
                      >
                        {statusInfo.text}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>Chưa có yêu cầu nào.</p>
            </div>
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      <DepositModal 
        isOpen={isDepositModalOpen} 
        onClose={handleCloseDepositModal}
        onRequestCreated={handleRequestCreated}
      />
    </div>
  );
};

export default WalletTab; 