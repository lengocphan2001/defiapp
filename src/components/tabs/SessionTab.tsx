import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import sessionService from '../../services/sessionService';
import { NFT } from '../../types';
import { formatBalance, formatPrice, formatRegistrationFee } from '../../utils';
import './SessionTab.css';

const SessionTab: React.FC = () => {
  const { user } = useAuth();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [registrationInfo, setRegistrationInfo] = useState<any>(null);

  useEffect(() => {
    fetchSessionData();
  }, []);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get today's session info
      const sessionResponse = await sessionService.getTodaySession();
      if (sessionResponse.success) {
        setSessionInfo(sessionResponse.data);
      } else {
        setError('Không thể tải thông tin phiên giao dịch');
        return;
      }
      
      // Check if user is registered
      const registrationResponse = await sessionService.checkRegistration();
      if (registrationResponse.success) {
        setIsRegistered(registrationResponse.data.is_registered);
        setRegistrationInfo(registrationResponse.data.registration);
        
        // If registered, fetch available NFTs
        if (registrationResponse.data.is_registered) {
          await fetchAvailableNFTs();
        }
      } else {
        setError('Không thể kiểm tra trạng thái đăng ký');
      }
    } catch (err) {
      
      // Handle specific error types
      let errorMessage = 'Có lỗi xảy ra khi tải dữ liệu phiên';
      
      if (err instanceof Error) {
        const errorText = err.message.toLowerCase();
        
        if (errorText.includes('401') || errorText.includes('unauthorized')) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (errorText.includes('403') || errorText.includes('forbidden')) {
          errorMessage = 'Bạn không có quyền truy cập.';
        } else if (errorText.includes('404') || errorText.includes('not found')) {
          errorMessage = 'Không tìm thấy phiên giao dịch.';
        } else if (errorText.includes('500') || errorText.includes('server error')) {
          errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
        } else if (errorText.includes('network') || errorText.includes('fetch')) {
          errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
        } else {
          errorMessage = err.message || 'Có lỗi xảy ra khi tải dữ liệu phiên';
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableNFTs = async () => {
    try {
      const response = await sessionService.getAvailableNFTs();
      
      if (response.success) {
        setNfts(response.data);
      } else {
      }
    } catch (err) {
      
      // Handle specific error types
      let errorMessage = 'Có lỗi xảy ra khi tải dữ liệu NFT';
      
      if (err instanceof Error) {
        const errorText = err.message.toLowerCase();
        
        if (errorText.includes('not registered') || errorText.includes('chưa đăng ký')) {
          errorMessage = 'Bạn cần đăng ký phiên trước khi xem NFT.';
        } else if (errorText.includes('session closed') || errorText.includes('phiên đã đóng')) {
          errorMessage = 'Phiên giao dịch đã đóng.';
        } else if (errorText.includes('401') || errorText.includes('unauthorized')) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (errorText.includes('403') || errorText.includes('forbidden')) {
          errorMessage = 'Bạn không có quyền xem NFT.';
        } else if (errorText.includes('404') || errorText.includes('not found')) {
          errorMessage = 'Không tìm thấy NFT.';
        } else if (errorText.includes('500') || errorText.includes('server error')) {
          errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
        } else if (errorText.includes('network') || errorText.includes('fetch')) {
          errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
        } else {
          errorMessage = err.message || 'Có lỗi xảy ra khi tải dữ liệu NFT';
        }
      }
      
      setError(errorMessage);
    }
  };

  const handleRegisterForSession = async () => {
    try {
      setRegistrationLoading(true);
      setRegistrationMessage(null);
      
      const response = await sessionService.registerForSession();
      
      if (response.success) {
        setRegistrationMessage({ type: 'success', text: response.message });
        setIsRegistered(true);
        setRegistrationInfo(response.data);
        // Refresh user data to update balance
        window.location.reload();
      } else {
        setRegistrationMessage({ type: 'error', text: response.message || 'Có lỗi xảy ra' });
      }
    } catch (err) {
      
      // Handle specific error types
      let errorMessage = 'Có lỗi xảy ra khi đăng ký phiên';
      
      if (err instanceof Error) {
        const errorText = err.message.toLowerCase();
        
        if (errorText.includes('insufficient balance') || errorText.includes('không đủ số dư')) {
          errorMessage = 'Số dư không đủ để đăng ký phiên. Vui lòng nạp thêm tiền.';
        } else if (errorText.includes('already registered') || errorText.includes('đã đăng ký')) {
          errorMessage = 'Bạn đã đăng ký phiên này rồi.';
        } else if (errorText.includes('session closed') || errorText.includes('phiên đã đóng')) {
          errorMessage = 'Phiên giao dịch đã đóng. Vui lòng chờ phiên tiếp theo.';
        } else if (errorText.includes('registration fee') || errorText.includes('phí đăng ký')) {
          errorMessage = 'Phí đăng ký không hợp lệ. Vui lòng thử lại.';
        } else if (errorText.includes('401') || errorText.includes('unauthorized')) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (errorText.includes('403') || errorText.includes('forbidden')) {
          errorMessage = 'Bạn không có quyền đăng ký phiên.';
        } else if (errorText.includes('404') || errorText.includes('not found')) {
          errorMessage = 'Không tìm thấy phiên giao dịch.';
        } else if (errorText.includes('500') || errorText.includes('server error')) {
          errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
        } else if (errorText.includes('network') || errorText.includes('fetch')) {
          errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
        } else {
          errorMessage = err.message || 'Có lỗi xảy ra khi đăng ký phiên';
        }
      }
      
      setRegistrationMessage({ type: 'error', text: errorMessage });
    } finally {
      setRegistrationLoading(false);
    }
  };

  const handleBuyNFT = async (nftId: string) => {
    try {
      const response = await sessionService.buyNFT(nftId);
      
      if (response.success) {
        alert(response.message);
        // Refresh the available NFTs list
        await fetchAvailableNFTs();
        // Refresh user data to update balance
        window.location.reload();
      } else {
        alert(response.message || 'Có lỗi xảy ra khi mua NFT');
      }
    } catch (err) {
      // Handle specific error types
      let errorMessage = 'Có lỗi xảy ra khi mua NFT';
      
      if (err instanceof Error) {
        const errorText = err.message.toLowerCase();
        
        if (errorText.includes('insufficient balance') || errorText.includes('không đủ số dư')) {
          errorMessage = 'Số dư không đủ để mua NFT này. Vui lòng nạp thêm tiền.';
        } else if (errorText.includes('nft not found') || errorText.includes('không tìm thấy nft')) {
          errorMessage = 'NFT không tồn tại hoặc đã được bán.';
        } else if (errorText.includes('already owned') || errorText.includes('đã sở hữu')) {
          errorMessage = 'Bạn đã sở hữu NFT này rồi.';
        } else if (errorText.includes('not registered') || errorText.includes('chưa đăng ký')) {
          errorMessage = 'Bạn cần đăng ký phiên trước khi mua NFT.';
        } else if (errorText.includes('session closed') || errorText.includes('phiên đã đóng')) {
          errorMessage = 'Phiên giao dịch đã đóng. Không thể mua NFT.';
        } else if (errorText.includes('401') || errorText.includes('unauthorized')) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (errorText.includes('403') || errorText.includes('forbidden')) {
          errorMessage = 'Bạn không có quyền mua NFT này.';
        } else if (errorText.includes('404') || errorText.includes('not found')) {
          errorMessage = 'NFT không tìm thấy.';
        } else if (errorText.includes('500') || errorText.includes('server error')) {
          errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
        } else if (errorText.includes('network') || errorText.includes('fetch')) {
          errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
        } else {
          errorMessage = err.message || 'Có lỗi xảy ra khi mua NFT';
        }
      }
      
      alert(errorMessage);
    }
  };

  const getNFTColor = (index: number): string => {
    const colors = [
      '#8B4513', // Brown
      '#228B22', // Green
      '#800080', // Purple
      '#8B0000', // Dark Red
      '#008B8B'  // Teal
    ];
    return colors[index % colors.length];
  };

  const formatSessionDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const formatRegistrationTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSessionStatusText = (status: string): string => {
    switch (status) {
      case 'active':
        return 'Đang hoạt động';
      case 'closed':
        return 'Đã đóng';
      default:
        return 'Không xác định';
    }
  };

  const getSessionStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'closed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const filters = [
    { id: 'all', label: 'Tất cả' },
    { id: 'sell', label: 'Bán' },
    { id: 'buy', label: 'Mua' }
  ];

  const filteredNFTs = nfts.filter(nft => 
    activeFilter === 'all' || nft.type === activeFilter
  );

  if (loading) {
    return (
      <div className="session-tab">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="session-tab">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button className="retry-button" onClick={fetchSessionData}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="session-tab">
      {/* Header */}
      <div className="session-header">
        <div className="session-title">
          <span className="session-icon">🕐</span>
          <h2 style={{color: '#fff'}}>Phiên giao dịch</h2>
        </div>
        
        {/* Session Info */}
        <div className="session-info">
          <div className="session-date">
            <span className="date-badge">
              {sessionInfo ? formatSessionDate(sessionInfo.session_date) : '--/--'}
            </span>
          </div>
          <div className="session-details">
            <span className="session-label">
              Phiên: {sessionInfo ? formatSessionDate(sessionInfo.session_date) : '--/--'}
            </span>
            
            {!isRegistered ? (
              <button 
                className="join-session-btn"
                onClick={handleRegisterForSession}
                disabled={registrationLoading || (sessionInfo?.status === 'closed')}
              >
                {registrationLoading ? 'Đang đăng ký...' : 'Đăng ký phiên'}
              </button>
            ) : (
              <span className="registered-badge">Đã đăng ký</span>
            )}
          </div>
        </div>

        {/* Registration Message */}
        {registrationMessage && (
          <div className={`registration-message ${registrationMessage.type}`}>
            {registrationMessage.text}
          </div>
        )}

        {/* Registration Info */}
        {!isRegistered && sessionInfo && sessionInfo.status === 'active' && (
          <div className="registration-info">
            <p style={{color: '#fff'}}>Phí đăng ký: {formatRegistrationFee(sessionInfo.registration_fee)}</p>
            <p style={{color: '#fff'}}>Số dư hiện tại: {formatBalance(user?.balance)}</p>
          </div>
        )}

        {/* Registration Details */}
        {isRegistered && registrationInfo && (
          <div className="registration-details">
            <p style={{color: '#fff'}}>Đã đăng ký lúc: {formatRegistrationTime(registrationInfo.registered_at)}</p>
            <p style={{color: '#fff'}}>Phí đã trả: {formatRegistrationFee(registrationInfo.registration_fee)}</p>
          </div>
        )}

        {/* Session Closed Message */}
        {sessionInfo?.status === 'closed' && (
          <div className="session-closed-message">
            <p>Phiên này đã đóng. Vui lòng chờ phiên tiếp theo.</p>
          </div>
        )}
      </div>

      {/* Show NFTs only if registered and session is active */}
      {isRegistered && sessionInfo?.status === 'active' ? (
        <>
          {/* Filters */}
          <div className="session-filters">
            {filters.map(filter => (
              <button
                key={filter.id}
                className={`filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Products Section */}
          <div className="products-section">
            <h2 className="products-title">Sản phẩm hôm nay</h2>
            
            {filteredNFTs.length === 0 ? (
              <div className="no-products">
                <p>Không có sản phẩm nào khả dụng</p>
              </div>
            ) : (
              <div className="products-grid">
                {filteredNFTs.map((nft, index) => (
                  <div 
                    key={nft.id} 
                    className="product-card"
                    style={{ backgroundColor: getNFTColor(index) }}
                  >
                    <div className="product-header">
                      <span className="product-id">ID: {nft.id}</span>
                    </div>
                    <div className="product-details">
                      <div className="product-name">{nft.name}</div>
                      <div className="product-owner">Chủ sở hữu: {nft.owner_name}</div>
                      <div className="product-price">Giá: {formatPrice(nft.price)}</div>
                    </div>
                    <div className="product-actions">
                      <button 
                        className="buy-button"
                        onClick={() => handleBuyNFT(nft.id)}
                      >
                        Mua
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : !isRegistered && sessionInfo?.status === 'active' ? (
        <div className="registration-required">
          <div className="registration-card">
            <h3>Đăng ký tham gia phiên</h3>
            <p>Bạn cần đăng ký phiên để xem và mua NFT khả dụng</p>
            <p>Phí đăng ký: {sessionInfo ? formatRegistrationFee(sessionInfo.registration_fee) : '20,000 SMP'}</p>
          </div>
        </div>
      ) : sessionInfo?.status === 'closed' ? (
        <div className="session-closed">
          <div className="session-closed-card">
            <h3>Phiên đã đóng</h3>
            <p>Phiên giao dịch hôm nay đã kết thúc. Vui lòng chờ phiên tiếp theo.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SessionTab; 