import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import requestService, { Request } from '../../services/requestService';
import smpTransactionService, { SMPTransaction } from '../../services/smpTransactionService';
import { formatBalance } from '../../utils';
import DepositModal from '../modals/DepositModal';
import './WalletTab.css';

const WalletTab: React.FC = () => {
  const { user } = useAuth();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [smpTransactions, setSmpTransactions] = useState<SMPTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [smpLoading, setSmpLoading] = useState(false);

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

  // Fetch user's SMP transactions
  const fetchSMPTransactions = async () => {
    setSmpLoading(true);
    try {
      console.log('WalletTab: Starting to fetch SMP transactions...');
      const response = await smpTransactionService.getUserTransactions(50, 0);
      console.log('WalletTab: SMP transactions response:', response);
      setSmpTransactions(response.data || []);
    } catch (error) {
      console.error('WalletTab: Failed to fetch SMP transactions:', error);
      // Set empty array to avoid undefined errors
      setSmpTransactions([]);
    } finally {
      setSmpLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchRequests();
    fetchSMPTransactions();
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

  // Format SMP transaction type
  const formatSMPTransactionType = (type: string): { text: string; bgColor: string; color: string } => {
    switch (type) {
      case 'nft_payment':
        return { text: 'Mua NFT', bgColor: '#3b82f6', color: 'white' };
      case 'nft_sale':
        return { text: 'Bán NFT', bgColor: '#10b981', color: 'white' };
      case 'deposit':
        return { text: 'Nạp tiền', bgColor: '#059669', color: 'white' };
      case 'withdrawal':
        return { text: 'Rút tiền', bgColor: '#dc2626', color: 'white' };
      case 'transfer':
        return { text: 'Chuyển', bgColor: '#7c3aed', color: 'white' };
      case 'commission':
        return { text: 'Hoa hồng', bgColor: '#f59e0b', color: 'white' };
      case 'refund':
        return { text: 'Hoàn tiền', bgColor: '#ef4444', color: 'white' };
      default:
        return { text: 'Khác', bgColor: '#6b7280', color: 'white' };
    }
  };

  // Format transaction date
  const formatTransactionDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Get transaction direction (incoming/outgoing)
  const getTransactionDirection = (transaction: SMPTransaction): 'incoming' | 'outgoing' => {
    if (transaction.from_user_id === user?.id) {
      return 'outgoing';
    }
    return 'incoming';
  };

  return (
    <div className="wallet-tab">
      {/* Main Balance Section */}
      <div className="main-balance-section">
        <h2>Ví chính</h2>
        <div className="balance-card">
          <h3>SMP chính</h3>
          <div className="balance-amount">
            {formatBalance(user?.balance || '100000000000')}
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
          <div className="commission-amount">{formatBalance('0')}</div>
          <button className="commission-btn">Rút trực tiếp</button>
        </div>

        {/* Tier Commission */}
        <div className="commission-card">
          <h3>Hoa hồng cấp bậc</h3>
          <div className="commission-amount">{formatBalance('0')}</div>
          <button className="commission-btn">Rút cấp bậc</button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="transaction-history">
        <h3>Lịch sử giao dịch</h3>
        <div className="transaction-table">
          {smpLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Đang tải...</p>
            </div>
          ) : smpTransactions.length > 0 ? (
            <div className="table-scroll">
              <table className="transaction-table-content">
                <thead>
                  <tr>
                    <th>Loại</th>
                    <th>SMP</th>
                    <th>Mô tả</th>
                    <th>Thời gian</th>
                    <th>TT</th>
                  </tr>
                </thead>
                <tbody>
                  {smpTransactions.map((transaction) => {
                    const typeInfo = formatSMPTransactionType(transaction.transaction_type);
                    const direction = getTransactionDirection(transaction);
                    const isOutgoing = direction === 'outgoing';
                    return (
                      <tr key={transaction.id} className="transaction-row">
                        <td className="transaction-type">
                          <span 
                            className="type-badge"
                            style={{ 
                              backgroundColor: typeInfo.bgColor, 
                              color: typeInfo.color 
                            }}
                          >
                            {typeInfo.text}
                          </span>
                        </td>
                        <td className={`transaction-amount ${isOutgoing ? 'outgoing' : 'incoming'}`}>
                          {isOutgoing ? '-' : '+'}{formatBalance(transaction.amount)}
                        </td>
                        <td className="transaction-description">
                          {transaction.description}
                        </td>
                        <td className="transaction-time">
                          {formatTransactionDate(transaction.created_at)}
                        </td>
                        <td className="transaction-status">
                          <span 
                            className="status-badge"
                            style={{ 
                              backgroundColor: transaction.status === 'completed' ? '#10b981' : '#f59e0b', 
                              color: 'white' 
                            }}
                          >
                            {transaction.status === 'completed' ? 'Hoàn thành' : 'Chờ xử lý'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>Chưa có giao dịch nào</p>
            </div>
          )}
        </div>

        {/* Mobile Card View */}
        <div className="transaction-cards">
          {smpLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Đang tải...</p>
            </div>
          ) : smpTransactions.length > 0 ? (
            smpTransactions.map((transaction) => {
              const typeInfo = formatSMPTransactionType(transaction.transaction_type);
              const direction = getTransactionDirection(transaction);
              const isOutgoing = direction === 'outgoing';
              
              return (
                <div key={transaction.id} className="transaction-card">
                  <div className="transaction-card-header">
                    <div className="transaction-card-type">
                     
                    </div>
                    <span className={`transaction-card-amount ${isOutgoing ? 'outgoing' : 'incoming'}`}>
                      {isOutgoing ? '-' : '+'}{formatBalance(transaction.amount)}
                    </span>
                  </div>
                  
                  <div className="transaction-card-description">
                    {transaction.description}
                  </div>
                  
                  <div className="transaction-card-footer">
                    <span className="transaction-card-time">
                      {formatTransactionDate(transaction.created_at)}
                    </span>
                    <span 
                      className="status-badge"
                      style={{ 
                        backgroundColor: transaction.status === 'completed' ? '#10b981' : '#f59e0b', 
                        color: 'white' 
                      }}
                    >
                      {transaction.status === 'completed' ? 'Hoàn thành' : 'Chờ xử lý'}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>Chưa có giao dịch nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Request History - Styled exactly like transaction table */}
      <div className="request-history">
        <h3>Lịch sử yêu cầu</h3>
        <div className="table-scroll">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Đang tải...</p>
            </div>
          ) : requests.length > 0 ? (
            <table className="transaction-table-content request-table-content">
              <thead>
                <tr>
                  <th>Loại</th>
                  <th>SMP</th>
                  <th>USDT</th>
                  <th>Địa chỉ</th>
                  <th>Thời gian</th>
                  <th>TT</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => {
                  const statusInfo = requestService.formatStatus(request.status);
                  const typeInfo = requestService.formatType(request.type);
                  const smpAmount = typeof request.smp_amount === 'string' ? parseFloat(request.smp_amount) : request.smp_amount;
                  const usdtAmount = typeof request.usdt_amount === 'string' ? parseFloat(request.usdt_amount) : request.usdt_amount;
                  return (
                    <tr key={request.id} className="transaction-row">
                      <td className="transaction-type">
                        <span className="type-badge" style={{ backgroundColor: typeInfo.bgColor, color: typeInfo.color }}>{typeInfo.text}</span>
                      </td>
                      <td className="transaction-smp">{formatBalance(smpAmount)}</td>
                      <td className="transaction-usdt">{usdtAmount.toFixed(2)} USDT</td>
                      <td className="transaction-address" title={request.address_wallet}>
                        {request.address_wallet.substring(0, 2)}...{request.address_wallet.slice(-6)}
                      </td>
                      <td className="transaction-time">{requestService.formatDate(request.created_at)}</td>
                      <td className="transaction-status">
                        <span className="status-badge" style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}>{statusInfo.text}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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