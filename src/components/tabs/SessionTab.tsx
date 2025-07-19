import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sessionService, Session, SessionRegistration } from '../../services/sessionService';
import { NFT } from '../../types';
import { formatBalance, formatPrice, formatRegistrationFee } from '../../utils';
import './SessionTab.css';

const SessionTab: React.FC = () => {
  const { user } = useAuth();
  const [availableSessions, setAvailableSessions] = useState<Session[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<SessionRegistration[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [registrationInfo, setRegistrationInfo] = useState<any>(null);
  const [registeringSession, setRegisteringSession] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showNFTs, setShowNFTs] = useState(false);
  const [buyingNFT, setBuyingNFT] = useState<string | null>(null);
  const [cart, setCart] = useState<NFT[]>([]);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    fetchSessionData();
  }, []);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch available sessions and user registrations in parallel
      const [sessionsResponse, registrationsResponse] = await Promise.all([
        sessionService.getAvailableSessions(),
        sessionService.getUserSessionRegistrations()
      ]);
      
      if (sessionsResponse.success) {
        setAvailableSessions(sessionsResponse.data);
      } else {
        setError('Không thể tải danh sách phiên giao dịch');
        return;
      }
      
      if (registrationsResponse.success) {
        setMyRegistrations(registrationsResponse.data);
      }
      
      // Get today's session info
      const sessionResponse = await sessionService.getTodaySession();
      if (sessionResponse.success) {
        setSessionInfo(sessionResponse.data);
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
      }
      
    } catch (err) {
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

  const handleRegisterForSession = async (sessionId: number) => {
    try {
      setRegisteringSession(sessionId);
      setRegistrationMessage(null);
      
      const response = await sessionService.registerForSpecificSession(sessionId);
      
      if (response.success) {
        setRegistrationMessage({ type: 'success', text: response.message });
        // Refresh data to update registrations and user balance
        await fetchSessionData();
        // Refresh user data to update balance
        window.location.reload();
      } else {
        setRegistrationMessage({ type: 'error', text: response.message });
      }
    } catch (err) {
      let errorMessage = 'Có lỗi xảy ra khi đăng ký phiên';
      
      if (err instanceof Error) {
        const errorText = err.message.toLowerCase();
        
        if (errorText.includes('insufficient balance') || errorText.includes('không đủ số dư')) {
          errorMessage = 'Số dư không đủ để đăng ký phiên. Vui lòng nạp thêm tiền.';
        } else if (errorText.includes('already registered') || errorText.includes('đã đăng ký')) {
          errorMessage = 'Bạn đã đăng ký phiên này rồi.';
        } else if (errorText.includes('session not found') || errorText.includes('không tìm thấy phiên')) {
          errorMessage = 'Phiên giao dịch không tồn tại hoặc đã đóng.';
        } else if (errorText.includes('401') || errorText.includes('unauthorized')) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (errorText.includes('403') || errorText.includes('forbidden')) {
          errorMessage = 'Bạn không có quyền đăng ký phiên.';
        } else if (errorText.includes('404') || errorText.includes('not found')) {
          errorMessage = 'Phiên giao dịch không tồn tại.';
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
      setRegisteringSession(null);
    }
  };

  const handleBuyNFT = async (nft: NFT) => {
    try {
      setBuyingNFT(nft.id);
      
      // Purchase NFT without deducting balance immediately
      const response = await sessionService.buyNFTWithoutDeduction(nft.id);
      
      if (response.success) {
        alert(`Đã mua ${nft.name}! NFT sẽ xuất hiện trong tab NFT. Thanh toán sẽ được thực hiện khi bạn click 'Thanh toán' trong tab NFT.`);
        // Refresh the available NFTs list
        await fetchAvailableNFTs();
      } else {
        alert(response.message || 'Có lỗi xảy ra khi mua NFT');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Có lỗi xảy ra khi mua NFT');
    } finally {
      setBuyingNFT(null);
    }
  };

  const handleAddToCart = (nft: NFT) => {
    // Check if NFT is already in cart
    const isInCart = cart.some(cartItem => cartItem.id === nft.id);
    if (isInCart) {
      alert('NFT này đã có trong giỏ hàng!');
      return;
    }
    
    setCart(prevCart => [...prevCart, nft]);
    alert(`Đã thêm ${nft.name} vào giỏ hàng!`);
  };

  const handleRemoveFromCart = (nftId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== nftId));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Giỏ hàng trống!');
      return;
    }

    try {
      setBuyingNFT('checkout');
      
      // Calculate total price
      const totalPrice = cart.reduce((sum, nft) => sum + parseFloat(nft.price || '0'), 0);
      
      // Check if user has enough balance
      if (user && parseFloat(user.balance || '0') < totalPrice) {
        alert('Số dư không đủ để thanh toán. Vui lòng nạp thêm tiền.');
        return;
      }

      // Process each NFT purchase
      const purchasePromises = cart.map(nft => sessionService.buyNFT(nft.id));
      const results = await Promise.all(purchasePromises);
      
      const successCount = results.filter(result => result.success).length;
      const failedCount = results.length - successCount;
      
      if (successCount > 0) {
        alert(`Thanh toán thành công ${successCount} NFT${successCount > 1 ? 's' : ''}!`);
        if (failedCount > 0) {
          alert(`${failedCount} NFT${failedCount > 1 ? 's' : ''} thanh toán thất bại.`);
        }
        
        // Clear cart and refresh data
        setCart([]);
        setShowCart(false);
        await fetchAvailableNFTs();
        window.location.reload(); // Refresh user balance
      } else {
        alert('Thanh toán thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Có lỗi xảy ra khi thanh toán');
    } finally {
      setBuyingNFT(null);
    }
  };

  const getCartTotal = () => {
    return cart.reduce((sum, nft) => sum + parseFloat(nft.price || '0'), 0);
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

  const isRegisteredForSession = (sessionId: number): boolean => {
    return myRegistrations.some(reg => reg.session_id === sessionId);
  };

  const getRegistrationForSession = (sessionId: number): SessionRegistration | null => {
    return myRegistrations.find(reg => reg.session_id === sessionId) || null;
  };

  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const loadNFTsForSession = async (session: Session) => {
    try {
      setSelectedSession(session);
      setShowNFTs(true);
      
      const response = await sessionService.getAvailableNFTs();
      if (response.success) {
        setNfts(response.data);
      } else {
        setError('Không thể tải danh sách NFT');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải NFT');
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

      </div>

      {/* Cart Button */}
      {cart.length > 0 && (
        <div className="cart-button-container">
          <button 
            className="cart-button"
            onClick={() => setShowCart(true)}
          >
            🛒 Giỏ hàng ({cart.length}) - {formatPrice(getCartTotal())}
          </button>
        </div>
      )}

      {/* Available Sessions Section */}
      <div className="sessions-section">
        {availableSessions.length === 0 ? (
          <div className="no-sessions">
            <p>Không có phiên giao dịch nào khả dụng</p>
          </div>
        ) : (
          <div className="sessions-scroll">
            <div className="sessions-row">
              {availableSessions.map((session) => {
                const isRegistered = isRegisteredForSession(session.id);
                const registration = getRegistrationForSession(session.id);
                
                return (
                  <div key={session.id} className={`session-card ${isRegistered ? 'registered' : ''}`}>
                    <div className="session-content">
                      <div className="session-date">
                        <span className="date-badge">
                          {formatDate(session.session_date)}
                        </span>
                      </div>
                    
                      
                      <div className="session-action">
                        {isRegistered ? (
                          <div className="action-buttons">
                            <span className="registered-badge">Đã đăng ký</span>
                          </div>
                        ) : (
                          <button 
                            className="register-btn"
                            onClick={() => handleRegisterForSession(session.id)}
                            disabled={registeringSession === session.id}
                          >
                            {registeringSession === session.id ? 'Đang đăng ký...' : 'Đăng ký'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* NFT Modal */}
      {showNFTs && selectedSession && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>NFT khả dụng - {formatDate(selectedSession.session_date)}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowNFTs(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {nfts.length === 0 ? (
                <div className="no-nfts">
                  <p>Không có NFT nào khả dụng</p>
                </div>
              ) : (
                <div className="nfts-scroll">
                  <div className="nfts-row">
                    {nfts.map((nft, index) => (
                      <div 
                        key={nft.id} 
                        className="nft-card"
                        style={{ backgroundColor: getNFTColor(index) }}
                      >
                        <div className="nft-header">
                          <span className="nft-id">ID: {nft.id}</span>
                        </div>
                        <div className="nft-details">
                          <div className="nft-name">{nft.name}</div>
                          <div className="nft-owner">Chủ sở hữu: {nft.owner_name}</div>
                          <div className="nft-price">Giá: {formatPrice(nft.price)}</div>
                        </div>
                        <div className="nft-actions">
                          <button 
                            className="buy-nft-btn"
                            onClick={() => handleBuyNFT(nft)}
                            disabled={buyingNFT === nft.id}
                          >
                            {buyingNFT === nft.id ? 'Đang mua...' : 'Mua'}
                          </button>
                          <button 
                            className="add-to-cart-btn"
                            onClick={() => handleAddToCart(nft)}
                          >
                            Thêm vào giỏ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowNFTs(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>Giỏ hàng ({cart.length} sản phẩm)</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCart(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <p>Giỏ hàng trống</p>
                </div>
              ) : (
                <div className="cart-items">
                  {cart.map((nft, index) => (
                    <div 
                      key={nft.id} 
                      className="cart-item"
                      style={{ backgroundColor: getNFTColor(index) }}
                    >
                      <div className="cart-item-details">
                        <div className="cart-item-name">{nft.name}</div>
                        <div className="cart-item-owner">Chủ sở hữu: {nft.owner_name}</div>
                        <div className="cart-item-price">{formatPrice(nft.price)}</div>
                      </div>
                      <div className="cart-item-actions">
                        <button 
                          className="remove-btn"
                          onClick={() => handleRemoveFromCart(nft.id)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <div className="cart-total">
                <span>Tổng cộng: {formatPrice(getCartTotal())}</span>
              </div>
              <div className="cart-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowCart(false)}
                >
                  Đóng
                </button>
                <button 
                  className="checkout-btn"
                  onClick={handleCheckout}
                  disabled={buyingNFT === 'checkout' || cart.length === 0}
                >
                  {buyingNFT === 'checkout' ? 'Đang thanh toán...' : 'Thanh toán'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                        onClick={() => handleBuyNFT(nft)}
                        disabled={buyingNFT === nft.id}
                      >
                        {buyingNFT === nft.id ? 'Đang mua...' : 'Mua'}
                      </button>
                      <button 
                        className="add-to-cart-button"
                        onClick={() => handleAddToCart(nft)}
                      >
                        Thêm vào giỏ
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