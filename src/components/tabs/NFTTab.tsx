import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import nftService from '../../services/nftService';
import { sessionService } from '../../services/sessionService';
import { NFT } from '../../types';
import { formatBalance, formatPrice } from '../../utils';
import Toast from '../common/Toast';
import './NFTTab.css';

interface NFTTransaction {
  id: number;
  nft_id: string;
  nft_name: string;
  price: number;
  transaction_type: 'buy' | 'sell';
  status?: 'pending' | 'completed';
  created_at: string;
}

const NFTTab: React.FC = () => {
  const { user } = useAuth();
  const [myNFTs, setMyNFTs] = useState<NFT[]>([]);
  const [transactions, setTransactions] = useState<NFTTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSpending, setTotalSpending] = useState(0);
  const [payingNFT, setPayingNFT] = useState<string | null>(null);
  const [sellingNFT, setSellingNFT] = useState<string | null>(null);
  const [openingNFT, setOpeningNFT] = useState<string | null>(null);
  const loadingRef = useRef(true);
  const [todaySessionId, setTodaySessionId] = useState<number | null>(null);
  const [showSellConfirm, setShowSellConfirm] = useState(false);
  const [selectedNFTForSale, setSelectedNFTForSale] = useState<NFT | null>(null);
  
  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({
      message,
      type,
      isVisible: true
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        loadingRef.current = true;
        setError(null);
        
        // Test API connection first
        try {

        } catch (err) {
          console.error('API connection test failed:', err);
        }
        
        // Fetch data sequentially to avoid race conditions
        await fetchMyNFTs();
        await fetchTransactionHistory();
        
      } catch (err) {
        console.error('Error in loadData:', err);
        showToast('Có lỗi xảy ra khi tải dữ liệu', 'error');
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loadingRef.current) {
        showToast('Kết nối chậm. Vui lòng kiểm tra máy chủ backend có đang chạy không.', 'warning');
        setLoading(false);
        loadingRef.current = false;
      }
    }, 10000); // 10 seconds timeout

    loadData();

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await sessionService.getTodaySession();
        if (res.success && res.data) setTodaySessionId(res.data.id);
      } catch {}
    };
    fetchSession();
  }, []);

  const fetchMyNFTs = async () => {
    try {
      const response = await nftService.getUserNFTs();
      
      if (response.success) {
        setMyNFTs(response.data);
      } else {
        console.error('NFT fetch failed');
        showToast('Không thể tải danh sách NFT của bạn', 'error');
      }
    } catch (err) {
      console.error('Error fetching my NFTs:', err);
      
      // More specific error messages
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          showToast('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.', 'error');
        } else if (err.message.includes('401')) {
          showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
        } else if (err.message.includes('403')) {
          showToast('Bạn không có quyền truy cập.', 'error');
        } else if (err.message.includes('404')) {
          showToast('API không tìm thấy.', 'error');
        } else if (err.message.includes('500')) {
          showToast('Lỗi máy chủ. Vui lòng thử lại sau.', 'error');
        } else {
          showToast('Có lỗi xảy ra: ' + err.message, 'error');
        }
      } else {
        showToast('Có lỗi xảy ra khi tải dữ liệu NFT', 'error');
      }
      throw err; // Re-throw to be caught by the main loadData function
    }
  };

  const fetchTransactionHistory = async () => {
    try {
      const response = await sessionService.getTransactionHistory();
      
      if (response.success) {
        setTransactions(response.data);
        
        // Calculate total spending (only buy transactions)
        const total = response.data
          .filter((tx: NFTTransaction) => tx.transaction_type === 'buy')
          .reduce((sum: number, tx: NFTTransaction) => sum + parseFloat(tx.price.toString()), 0);
        
        setTotalSpending(total);
      } else {
        console.error('Transaction fetch failed');
        // Don't set error for transaction history as it's not critical
      }
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      // Don't set error for transaction history as it's not critical
    }
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    loadingRef.current = true;
    // Reload all data
    const loadData = async () => {
      try {
        await fetchMyNFTs();
        await fetchTransactionHistory();
      } catch (err) {
        console.error('Retry failed:', err);
        showToast('Thử lại thất bại', 'error');
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };
    loadData();
  };

  const handlePayNFT = async (nftId: string, price: number) => {
    try {
      setPayingNFT(nftId);
      
      // Check user balance first
      const currentUser = user;
      if (!currentUser || !currentUser.balance) {
        showToast('Không thể kiểm tra số dư. Vui lòng đăng nhập lại.', 'error');
        return;
      }
      
      const userBalance = parseFloat(currentUser.balance.toString());
      if (userBalance < price) {
        showToast('Số dư không đủ để thanh toán. Vui lòng nạp thêm tiền.', 'warning');
        return;
      }

      // Pay for specific NFT
      const response = await nftService.payNFT(nftId, price);
      
      if (response.success) {
        showToast('Thanh toán thành công! NFT đã được kích hoạt.', 'success');
        // Refresh data to update NFT status and user balance
        await fetchMyNFTs();
        await fetchTransactionHistory();
        // Refresh user data to update balance
        window.location.reload();
      } else {
        showToast(response.message || 'Thanh toán thất bại', 'error');
      }
    } catch (err) {
      console.error('Error paying NFT:', err);
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra khi thanh toán', 'error');
    } finally {
      setPayingNFT(null);
    }
  };

  const handleSellNFT = async (nftId: string) => {
    // Find the NFT to show confirmation
    const nft = myNFTs.find(n => n.id === nftId);
    if (nft) {
      setSelectedNFTForSale(nft);
      setShowSellConfirm(true);
    }
  };

  const confirmSellNFT = async () => {
    if (!selectedNFTForSale) return;
    
    try {
      setSellingNFT(selectedNFTForSale.id);
      
      const response = await nftService.sellNFT(selectedNFTForSale.id);
      
      if (response.success) {
        showToast(response.message, 'success');
        // Refresh data to update NFT status
        await fetchMyNFTs();
        await fetchTransactionHistory();
        // Close modal
        setShowSellConfirm(false);
        setSelectedNFTForSale(null);
      } else {
        showToast(response.message || 'Bán NFT thất bại', 'error');
      }
    } catch (err) {
      console.error('Error selling NFT:', err);
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra khi bán NFT', 'error');
    } finally {
      setSellingNFT(null);
    }
  };

  const handleOpenNFT = async (nftId: string) => {
    try {
      setOpeningNFT(nftId);
      
      const response = await nftService.openNFT(nftId);
      
      if (response.success) {
        showToast(response.message, 'success');
        // Refresh data to update NFT status and user balance
        await fetchMyNFTs();
        await fetchTransactionHistory();
        // Refresh user data to update balance
        window.location.reload();
      } else {
        showToast(response.message || 'Mở NFT thất bại', 'error');
      }
    } catch (err) {
      console.error('Error opening NFT:', err);
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra khi mở NFT', 'error');
    } finally {
      setOpeningNFT(null);
    }
  };

  // Check if NFT needs payment (has pending transaction)
  const needsPayment = (nft: NFT): boolean => {
    console.log('Checking payment for NFT:', nft.id, 'Payment status:', nft.payment_status, 'Transactions:', transactions);
    
    // First check the NFT's payment_status field (most reliable)
    if (nft.payment_status === 'completed') {
      console.log('NFT does not need payment: payment_status is completed');
      return false;
    }
    
    if (nft.payment_status === 'pending' || nft.payment_status === 'unpaid') {
      console.log('NFT needs payment: payment_status is', nft.payment_status);
      return true;
    }
    
    // Fallback: Check if there's a pending transaction for this NFT
    const hasPendingTransaction = transactions.some(tx => 
      tx.nft_id === nft.id && 
      tx.transaction_type === 'buy' && 
      tx.status === 'pending'
    );
    
    // If there's a pending transaction, definitely needs payment
    if (hasPendingTransaction) {
      console.log('NFT needs payment: has pending transaction');
      return true;
    }
    
    // Check if there's any completed transaction for this NFT
    const hasCompletedTransaction = transactions.some(tx => 
      tx.nft_id === nft.id && 
      tx.transaction_type === 'buy' && 
      tx.status === 'completed'
    );
    
    // If there's a completed transaction, it doesn't need payment
    if (hasCompletedTransaction) {
      console.log('NFT does not need payment: has completed transaction');
      return false;
    }
    
    // TEMPORARY FIX: If no clear indication, assume it needs payment
    // This prevents showing "Bán" and "Mở" buttons when payment status is unclear
    console.log('NFT needs payment: unclear status, assuming needs payment');
    return true;
  };

  const getNFTColor = (index: number): string => {
    const colors = [
      '#228B22', // Green
      '#000080', // Dark Blue
      '#8B4513', // Brown
      '#800080', // Purple
      '#8B0000'  // Dark Red
    ];
    return colors[index % colors.length];
  };

  const formatTransactionTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTransactionTypeText = (type: string): string => {
    switch (type) {
      case 'buy':
        return 'Mua';
      case 'sell':
        return 'Bán';
      default:
        return 'Không xác định';
    }
  };

  if (loading) {
    return (
      <div className="nft-tab">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nft-tab">
      {/* Header */}
      <div className="nft-header">
        <div className="nft-title">
          <span className="nft-icon">📄</span>
          <h2>NFT của tôi</h2>
        </div>
      </div>

      {/* My NFTs Section */}
      <div className="my-nfts-section">
        {myNFTs.length === 0 ? (
          <div className="no-nfts">
            <p>Bạn chưa có NFT nào</p>
          </div>
        ) : (
          <div className="nfts-grid">
            {(todaySessionId ? myNFTs.filter(nft => nft.session_id === todaySessionId) : myNFTs)
              .filter(nft => nft.type === 'buy') // Show only purchased NFTs
              .map((nft, index) => {
              const needsPaymentForThisNFT = needsPayment(nft);
              
              return (
                <div 
                  key={nft.id} 
                  className="nft-card"
                  style={{ backgroundColor: getNFTColor(index) }}
                >
                  <div className="nft-header-card">
                    <span className="nft-name">{nft.name}</span>
                  </div>
                  <div className="nft-details">
                    <div className="nft-id">ID: {nft.id}</div>
                    <div className="nft-seller">Người bán: {nft.owner_name || 'Admin'}</div>
                    <div className="nft-price">Giá: {formatPrice(nft.price)}</div>
                  </div>
                  <div className="nft-actions">
                    {needsPaymentForThisNFT ? (
                      // Show payment button if NFT needs payment
                      <button 
                        className="pay-button"
                        onClick={() => handlePayNFT(nft.id, parseFloat(nft.price.toString()))}
                        disabled={payingNFT === nft.id}
                      >
                        {payingNFT === nft.id ? 'Đang thanh toán...' : `Thanh toán ${formatPrice(nft.price)}`}
                      </button>
                    ) : (
                      // Show sell and open buttons if NFT is paid
                      <div className="nft-action-buttons">
                        <button 
                          className="sell-button"
                          onClick={() => handleSellNFT(nft.id)}
                          disabled={sellingNFT === nft.id}
                        >
                          {sellingNFT === nft.id ? 'Đang bán...' : 'Bán'}
                        </button>
                        <button 
                          className="open-button"
                          onClick={() => handleOpenNFT(nft.id)}
                          disabled={openingNFT === nft.id}
                        >
                          {openingNFT === nft.id ? 'Đang mở...' : 'Mở'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Total Spending */}
      {totalSpending > 0 && (
        <div className="total-spending">
          <span>Tổng chi tiêu: {formatPrice(totalSpending)}</span>
        </div>
      )}

      {/* NFT History Section */}
      <div className="nft-history-section">
        <h3 className="history-title">Lịch sử NFT</h3>
        
        {transactions.length === 0 ? (
          <div className="no-history">
            <p>Chưa có lịch sử giao dịch</p>
          </div>
        ) : (
          <div className="history-list">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="history-item">
                <span className="history-time">
                  {formatTransactionTime(transaction.created_at)}:
                </span>
                <span className="history-action">
                  [{getTransactionTypeText(transaction.transaction_type)}] {transaction.nft_name}
                </span>
                <span className="history-price">
                  — {formatPrice(transaction.price)}
                </span>
                {transaction.status && (
                  <span className={`history-status status-${transaction.status}`}>
                    {transaction.status === 'pending' ? 'Chờ thanh toán' : 'Đã hoàn thành'}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={hideToast} 
      />

      {/* Sell Confirmation Modal */}
      {showSellConfirm && selectedNFTForSale && (
        <div className="modal-overlay" onClick={() => setShowSellConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Xác nhận bán NFT</h3>
              <button 
                className="close-btn"
                onClick={() => setShowSellConfirm(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="sell-confirmation">
                <div className="nft-info">
                  <h4>{selectedNFTForSale.name}</h4>
                  <p>ID: {selectedNFTForSale.id}</p>
                </div>
                
                <div className="fee-details">
                  <div className="fee-row">
                    <span>Giá hiện tại:</span>
                    <span>{formatPrice(selectedNFTForSale.price)} SMP</span>
                  </div>
                  <div className="fee-row">
                    <span>Lợi nhuận 1.5%=</span>
                    <span>+{(parseFloat(selectedNFTForSale.price) * 0.015).toFixed(2)} SMP</span>
                  </div>
                  <div className="fee-row">
                    <span>Phí gửi bán 3.4%=</span>
                    <span>+{(parseFloat(selectedNFTForSale.price) * 0.034).toFixed(2)} SMP</span>
                  </div>
                  <div className="fee-row total">
                    <span>Tổng cộng 4.9%=</span>
                    <span>+{(parseFloat(selectedNFTForSale.price) * 0.049).toFixed(2)} SMP</span>
                  </div>
                  <div className="fee-row final-price">
                    <span>Giá mới:</span>
                    <span>{(parseFloat(selectedNFTForSale.price) * 1.049).toFixed(2)} SMP</span>
                  </div>
                </div>
                
                <div className="warning-message">
                  <p>⚠️ Bạn sẽ bị trừ {formatPrice((parseFloat(selectedNFTForSale.price) * 0.034).toString())} SMP từ số dư</p>
                  <p>💰 Khi bán được, bạn sẽ nhận thêm {(parseFloat(selectedNFTForSale.price) * 0.015).toFixed(2)} SMP lợi nhuận</p>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowSellConfirm(false)}
                disabled={sellingNFT === selectedNFTForSale.id}
              >
                Hủy
              </button>
              <button 
                className="btn-primary"
                onClick={confirmSellNFT}
                disabled={sellingNFT === selectedNFTForSale.id}
              >
                {sellingNFT === selectedNFTForSale.id ? 'Đang bán...' : 'Xác nhận bán'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTTab; 