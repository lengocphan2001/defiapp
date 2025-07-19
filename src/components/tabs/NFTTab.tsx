import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import nftService from '../../services/nftService';
import { sessionService } from '../../services/sessionService';
import { NFT } from '../../types';
import { formatBalance, formatPrice } from '../../utils';
import './NFTTab.css';

interface NFTTransaction {
  id: number;
  nft_id: string;
  nft_name: string;
  price: number;
  transaction_type: 'buy' | 'sell';
  created_at: string;
}

const NFTTab: React.FC = () => {
  const { user } = useAuth();
  const [myNFTs, setMyNFTs] = useState<NFT[]>([]);
  const [transactions, setTransactions] = useState<NFTTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSpending, setTotalSpending] = useState(0);
  const loadingRef = useRef(true);

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
        setError('Có lỗi xảy ra khi tải dữ liệu');
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loadingRef.current) {
        setError('Kết nối chậm. Vui lòng kiểm tra máy chủ backend có đang chạy không.');
        setLoading(false);
        loadingRef.current = false;
      }
    }, 10000); // 10 seconds timeout

    loadData();

    return () => clearTimeout(timeout);
  }, []);

  const fetchMyNFTs = async () => {
    try {

      
      const response = await nftService.getUserNFTs();
      
      if (response.success) {
        setMyNFTs(response.data);
      } else {
        console.error('NFT fetch failed');
        setError('Không thể tải danh sách NFT của bạn');
      }
    } catch (err) {
      console.error('Error fetching my NFTs:', err);
      
      // More specific error messages
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
        } else if (err.message.includes('401')) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else if (err.message.includes('403')) {
          setError('Bạn không có quyền truy cập.');
        } else if (err.message.includes('404')) {
          setError('API không tìm thấy.');
        } else if (err.message.includes('500')) {
          setError('Lỗi máy chủ. Vui lòng thử lại sau.');
        } else {
          setError('Có lỗi xảy ra: ' + err.message);
        }
      } else {
        setError('Có lỗi xảy ra khi tải dữ liệu NFT');
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
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };
    loadData();
  };

  const handlePayNFT = async (nftId: string, price: number) => {
    try {
      // This would be for selling the NFT, but for now just show an alert
      alert(`Thanh toán NFT ${nftId} - Chức năng đang được phát triển`);
    } catch (err) {
      console.error('Error paying NFT:', err);
    }
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

  if (error) {
    return (
      <div className="nft-tab">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button className="retry-button" onClick={handleRetry}>
            Thử lại
          </button>
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
            {myNFTs.map((nft, index) => (
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
                </div>
                <div className="nft-actions">
                  <button 
                    className="pay-button"
                    onClick={() => handlePayNFT(nft.id, parseFloat(nft.price.toString()))}
                  >
                    Thanh toán {formatPrice(nft.price)}
                  </button>
                </div>
              </div>
            ))}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NFTTab; 