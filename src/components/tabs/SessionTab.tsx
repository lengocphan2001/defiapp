import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sessionService, Session, SessionRegistration } from '../../services/sessionService';
import nftService from '../../services/nftService';
import { NFT } from '../../types';
import { formatBalance, formatPrice, formatRegistrationFee } from '../../utils';
import Toast from '../common/Toast';
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
  const [registrationInfo, setRegistrationInfo] = useState<any>(null);
  const [registeringSession, setRegisteringSession] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showNFTs, setShowNFTs] = useState(false);
  const [buyingNFT, setBuyingNFT] = useState<string | null>(null);
  const [cart, setCart] = useState<NFT[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [sellingNFTs, setSellingNFTs] = useState<NFT[]>([]);
  const [sellingNFTsLoading, setSellingNFTsLoading] = useState(false);
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [nextSession, setNextSession] = useState<Session | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [hasJoinedCurrentSession, setHasJoinedCurrentSession] = useState(false);
  const [sessionDataValid, setSessionDataValid] = useState(false);
  
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
    fetchSessionData();
  }, []);

  // Set next session when availableSessions changes
  useEffect(() => {
    const next = getNextSession();
    console.log('Next session data:', next);
    setNextSession(next);
    
    // Validate session data
    if (next && next.session_date && next.time_start) {
      // Handle session_date - it might be a full ISO string
      let sessionDateStr = next.session_date;
      if (sessionDateStr && sessionDateStr.includes('T')) {
        sessionDateStr = sessionDateStr.split('T')[0];
      }
      
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      
      const isDateValid = dateRegex.test(sessionDateStr);
      const isTimeValid = timeRegex.test(next.time_start);
      
      console.log('Session data validation:', {
        sessionDate: next.session_date,
        sessionDateStr,
        timeStart: next.time_start,
        isDateValid,
        isTimeValid
      });
      
      setSessionDataValid(isDateValid && isTimeValid);
    } else {
      setSessionDataValid(false);
    }
    
    // Check if user has already joined the current session
    if (next && sessionStarted) {
      const isJoined = isRegisteredForSession(next.id);
      setHasJoinedCurrentSession(isJoined);
    }
  }, [availableSessions, sessionStarted]);

  // Countdown timer effect
  useEffect(() => {
    if (!nextSession || !nextSession.session_date || !nextSession.time_start) {
      console.log('No valid session data for countdown');
      return;
    }

    // Calculate initial countdown
    calculateTimeUntilNextSession();

    // Update countdown every second
    const interval = setInterval(calculateTimeUntilNextSession, 1000);

    return () => clearInterval(interval);
  }, [nextSession]);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch available sessions and user registrations in parallel
      const [sessionsResponse, registrationsResponse] = await Promise.all([
        sessionService.getAvailableSessions(),
        sessionService.getUserSessionRegistrations()
      ]);
      
      console.log('Sessions response:', sessionsResponse);
      
      if (sessionsResponse.success) {
        setAvailableSessions(sessionsResponse.data);
        console.log('Available sessions data:', sessionsResponse.data);
      } else {
        showToast('Không thể tải danh sách phiên giao dịch', 'error');
        return;
      }
      
      if (registrationsResponse.success) {
        setMyRegistrations(registrationsResponse.data);
      }
      
      // Get today's session info
      const sessionResponse = await sessionService.getTodaySession();
      console.log('Today session response:', sessionResponse);
      if (sessionResponse.success && sessionResponse.data) {
        setSessionInfo(sessionResponse.data);
      } else {
        // Handle case where no session exists for today
        setSessionInfo(null);
        showToast('Không có phiên giao dịch nào cho hôm nay. Vui lòng liên hệ admin để tạo phiên.', 'warning');
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
          await fetchSellingNFTs();
        }
      }
    } catch (error) {
      console.error('Error fetching session data:', error);
      setError('Có lỗi xảy ra khi tải dữ liệu phiên');
      showToast('Có lỗi xảy ra khi tải dữ liệu phiên', 'error');
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
        showToast('Không thể tải danh sách NFT', 'error');
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
      
      showToast(errorMessage, 'error');
    }
  };

  const fetchSellingNFTs = async () => {
    try {
      setSellingNFTsLoading(true);
      const response = await nftService.getUserSellingNFTs();
      
      if (response.success) {
        setSellingNFTs(response.data);
      } else {
        showToast('Không thể tải danh sách NFT đang bán', 'error');
      }
    } catch (err) {
      showToast('Có lỗi xảy ra khi tải danh sách NFT đang bán', 'error');
    } finally {
      setSellingNFTsLoading(false);
    }
  };

  const handleRegisterForSession = async (sessionId: number) => {
    try {
      setRegisteringSession(sessionId);
      
      const response = await sessionService.registerForSpecificSession(sessionId);
      
      if (response.success) {
        showToast(response.message, 'success');
        // Refresh data to update registrations and user balance
        await fetchSessionData();
        // Refresh user data to update balance
        window.location.reload();
      } else {
        showToast(response.message, 'error');
      }
    } catch (err) {
      let errorMessage = 'Có lỗi xảy ra khi đăng ký phiên';
      let showDepositModal = false;
      
      if (err instanceof Error) {
        const errorText = err.message.toLowerCase();
        
        if (errorText.includes('insufficient balance') || errorText.includes('không đủ số dư')) {
          errorMessage = 'Số dư không đủ để đăng ký phiên. Vui lòng nạp thêm tiền.';
          showDepositModal = true;
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
      
      showToast(errorMessage, 'error');
      
      // Show deposit modal if insufficient balance
      if (showDepositModal) {
        // You can trigger a deposit modal here if you have one
        setTimeout(() => {
          showToast('Bạn có muốn nạp tiền ngay bây giờ không?', 'info');
          // You can add navigation to deposit page or show deposit modal
        }, 2000);
      }
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
        showToast(`Đã mua ${nft.name}! NFT sẽ xuất hiện trong tab NFT. Thanh toán sẽ được thực hiện khi bạn click 'Thanh toán' trong tab NFT.`, 'success');
        // Refresh the available NFTs list
        await fetchAvailableNFTs();
      } else {
        showToast(response.message || 'Có lỗi xảy ra khi mua NFT', 'error');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra khi mua NFT', 'error');
    } finally {
      setBuyingNFT(null);
    }
  };

  const handleAddToCart = (nft: NFT) => {
    // Check if NFT is already in cart
    const isInCart = cart.some(cartItem => cartItem.id === nft.id);
    if (isInCart) {
      showToast('NFT này đã có trong giỏ hàng!', 'warning');
      return;
    }
    
    setCart(prevCart => [...prevCart, nft]);
    showToast(`Đã thêm ${nft.name} vào giỏ hàng!`, 'success');
  };

  const handleRemoveFromCart = (nftId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== nftId));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast('Giỏ hàng trống!', 'warning');
      return;
    }

    try {
      setBuyingNFT('checkout');
      
      // Calculate total price
      const totalPrice = cart.reduce((sum, nft) => sum + parseFloat(nft.price || '0'), 0);
      
      // Check if user has enough balance
      if (user && parseFloat(user.balance || '0') < totalPrice) {
        showToast('Số dư không đủ để thanh toán. Vui lòng nạp thêm tiền.', 'warning');
        return;
      }

      // Process each NFT purchase
      const purchasePromises = cart.map(nft => sessionService.buyNFT(nft.id));
      const results = await Promise.all(purchasePromises);
      
      const successCount = results.filter(result => result.success).length;
      const failedCount = results.length - successCount;
      
      if (successCount > 0) {
        showToast(`Thanh toán thành công ${successCount} NFT${successCount > 1 ? 's' : ''}!`, 'success');
        if (failedCount > 0) {
          showToast(`${failedCount} NFT${failedCount > 1 ? 's' : ''} thanh toán thất bại.`, 'error');
        }
        
        // Clear cart and refresh data
        setCart([]);
        setShowCart(false);
        await fetchAvailableNFTs();
        window.location.reload(); // Refresh user balance
      } else {
        showToast('Thanh toán thất bại. Vui lòng thử lại.', 'error');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra khi thanh toán', 'error');
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

  // Countdown timer functions
  const calculateTimeUntilNextSession = () => {
    if (!nextSession) return;

    const now = new Date();
    
    // Handle session_date - it might be a full ISO string, so extract just the date part
    let sessionDateStr = nextSession.session_date;
    if (sessionDateStr && sessionDateStr.includes('T')) {
      // If it's an ISO string, extract just the date part (YYYY-MM-DD)
      sessionDateStr = sessionDateStr.split('T')[0];
    }
    
    // Handle MySQL TIME format (HH:MM:SS)
    let formattedTime = nextSession.time_start;
    if (nextSession.time_start && nextSession.time_start.includes(':')) {
      const timeParts = nextSession.time_start.split(':');
      if (timeParts.length >= 2) {
        formattedTime = `${timeParts[0]}:${timeParts[1]}`;
      }
    }
    
    const sessionTime = new Date(`${sessionDateStr}T${formattedTime}:00`);
    
    // Validate dates before calling toISOString()
    const isValidNow = !isNaN(now.getTime());
    const isValidSessionTime = !isNaN(sessionTime.getTime());
    
    console.log('calculateTimeUntilNextSession:', {
      now: isValidNow ? now.toISOString() : 'Invalid date',
      timeStart: nextSession.time_start,
      formattedTime,
      sessionTime: isValidSessionTime ? sessionTime.toISOString() : 'Invalid date',
      sessionDateRaw: nextSession.session_date,
      sessionDateStr,
      timeStartRaw: nextSession.time_start
    });
    
    // If any date is invalid, don't proceed
    if (!isValidNow || !isValidSessionTime) {
      console.error('Invalid date detected:', {
        now: isValidNow,
        sessionTime: isValidSessionTime,
        sessionDateRaw: nextSession.session_date,
        sessionDateStr,
        timeStartRaw: nextSession.time_start
      });
      return;
    }
    
    const timeDifference = sessionTime.getTime() - now.getTime();

    if (timeDifference > 0) {
      const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
      setSessionStarted(false);
    } else {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setSessionStarted(true);
    }
  };

  const formatSessionTime = (dateString: string, timeString: string): string => {
    try {
      console.log('formatSessionTime inputs:', { dateString, timeString });
      
      // Validate inputs
      if (!dateString || !timeString) {
        console.error('Missing date or time input:', { dateString, timeString });
        return 'Thời gian không hợp lệ';
      }
      
      // Handle dateString - it might be a full ISO string, so extract just the date part
      let sessionDateStr = dateString;
      if (dateString && dateString.includes('T')) {
        // If it's an ISO string, extract just the date part (YYYY-MM-DD)
        sessionDateStr = dateString.split('T')[0];
      }
      
      // Handle MySQL TIME format (HH:MM:SS)
      let formattedTime = timeString;
      if (timeString && timeString.includes(':')) {
        // If time is in HH:MM:SS format, take only HH:MM
        const timeParts = timeString.split(':');
        if (timeParts.length >= 2) {
          formattedTime = `${timeParts[0]}:${timeParts[1]}`;
        }
      }
      
      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(formattedTime)) {
        console.error('Invalid time format:', formattedTime);
        return 'Thời gian không hợp lệ';
      }
      
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(sessionDateStr)) {
        console.error('Invalid date format:', sessionDateStr);
        return 'Ngày không hợp lệ';
      }
      
      // Create date object for formatting
      const date = new Date(`${sessionDateStr}T${formattedTime}:00`);
      
      console.log('Parsed date:', date);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date parsed:', { dateString, sessionDateStr, timeString, formattedTime });
        return 'Thời gian không hợp lệ';
      }
      
      // Format the date and time separately to avoid "lúc" prefix
      const dateFormatted = date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const timeFormatted = date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      return `${dateFormatted} ${timeFormatted}`;
    } catch (error) {
      console.error('Error formatting session time:', error, { dateString, timeString });
      return 'Thời gian không hợp lệ';
    }
  };

  const getNextSession = () => {
    if (availableSessions.length === 0) return null;
    
    const now = new Date();
    
    // Find the closest next session (by date and time)
    let closestSession = null;
    let closestTime = Infinity;
    
    availableSessions.forEach(session => {
      // Handle session_date - extract date part if it's an ISO string
      let sessionDateStr = session.session_date;
      if (sessionDateStr && sessionDateStr.includes('T')) {
        sessionDateStr = sessionDateStr.split('T')[0];
      }
      
      // Handle time format
      let formattedTime = session.time_start;
      if (session.time_start && session.time_start.includes(':')) {
        const timeParts = session.time_start.split(':');
        if (timeParts.length >= 2) {
          formattedTime = `${timeParts[0]}:${timeParts[1]}`;
        }
      }
      
      const sessionDateTime = new Date(`${sessionDateStr}T${formattedTime}:00`);
      
      // If session time is in the future and closer than current closest
      if (sessionDateTime > now && sessionDateTime.getTime() < closestTime) {
        closestTime = sessionDateTime.getTime();
        closestSession = session;
      }
    });
    
    console.log('Closest next session:', closestSession);
    return closestSession || availableSessions[0];
  };

  const handleJoinCurrentSession = async () => {
    if (!nextSession || !sessionStarted) return;
    
    try {
      setRegistrationLoading(true);
      
      const response = await sessionService.registerForSpecificSession(nextSession.id);
      
      if (response.success) {
        setHasJoinedCurrentSession(true);
        showToast('Đã tham gia phiên giao dịch!', 'success');
        // Refresh data to update registrations and user balance
        await fetchSessionData();
        // Refresh user data to update balance
        window.location.reload();
      } else {
        showToast(response.message, 'error');
      }
    } catch (err) {
      let errorMessage = 'Có lỗi xảy ra khi tham gia phiên';
      
      if (err instanceof Error) {
        const errorText = err.message.toLowerCase();
        
        if (errorText.includes('insufficient balance') || errorText.includes('không đủ số dư')) {
          errorMessage = 'Số dư không đủ để tham gia phiên. Vui lòng nạp thêm tiền.';
        } else if (errorText.includes('already registered') || errorText.includes('đã đăng ký')) {
          errorMessage = 'Bạn đã tham gia phiên này rồi.';
          setHasJoinedCurrentSession(true);
        } else {
          errorMessage = err.message || 'Có lỗi xảy ra khi tham gia phiên';
        }
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setRegistrationLoading(false);
    }
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
          <p>Đang tải dữ liệu phiên...</p>
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

      {/* Countdown Timer */}
      {nextSession && sessionDataValid ? (
        <div className="countdown-section">
          <div className="countdown-header">
            <h3>Phiên tiếp theo</h3>
            <p className="session-time">
              {formatSessionTime(nextSession.session_date, nextSession.time_start)}
            </p>
          </div>
          {!sessionStarted ? (
            <div className="countdown-timer">
              <div className="countdown-item">
                <span className="countdown-value">{countdown.days.toString().padStart(2, '0')}</span>
                <span className="countdown-label">Ngày</span>
              </div>
              <div className="countdown-separator">:</div>
              <div className="countdown-item">
                <span className="countdown-value">{countdown.hours.toString().padStart(2, '0')}</span>
                <span className="countdown-label">Giờ</span>
              </div>
              <div className="countdown-separator">:</div>
              <div className="countdown-item">
                <span className="countdown-value">{countdown.minutes.toString().padStart(2, '0')}</span>
                <span className="countdown-label">Phút</span>
              </div>
              <div className="countdown-separator">:</div>
              <div className="countdown-item">
                <span className="countdown-value">{countdown.seconds.toString().padStart(2, '0')}</span>
                <span className="countdown-label">Giây</span>
              </div>
            </div>
          ) : (
            <div className="session-started">
              <div className="session-started-message">
                <h4>🎉 Phiên giao dịch đã bắt đầu!</h4>
                <p>Nhấn "Tham gia" để xem sản phẩm và giao dịch</p>
              </div>
              <button 
                className="join-session-btn"
                onClick={handleJoinCurrentSession}
                disabled={registrationLoading || hasJoinedCurrentSession}
              >
                {registrationLoading ? 'Đang tham gia...' : 
                 hasJoinedCurrentSession ? 'Đã tham gia' : 'Tham gia'}
              </button>
            </div>
          )}
        </div>
      ) : nextSession && !sessionDataValid ? (
        <div className="countdown-section">
          <div className="countdown-header">
            <h3>Phiên tiếp theo</h3>
            <p className="session-time">Dữ liệu phiên không hợp lệ</p>
          </div>
          <div className="session-error">
            <p>Không thể hiển thị thời gian phiên. Vui lòng liên hệ admin.</p>
          </div>
        </div>
      ) : (
        <div className="countdown-section">
          <div className="countdown-header">
            <h3>Phiên tiếp theo</h3>
            <p className="session-time">Đang tải thông tin phiên...</p>
          </div>
        </div>
      )}

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

      {/* Show NFTs only if session has started, user has joined, and session is active */}
      {sessionStarted && hasJoinedCurrentSession && sessionInfo?.status === 'active' ? (
        <>
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : sessionStarted && !hasJoinedCurrentSession ? (
        <div className="join-prompt">
          <div className="join-prompt-card">
            <h3>Phiên giao dịch đã bắt đầu!</h3>
            <p>Vui lòng nhấn "Tham gia" ở trên để xem sản phẩm và giao dịch.</p>
          </div>
        </div>
      ) : !sessionStarted ? (
        <div className="waiting-prompt">
          <div className="waiting-prompt-card">
            <h3>Đang chờ phiên giao dịch</h3>
            <p>Phiên giao dịch sẽ bắt đầu khi đồng hồ đếm ngược kết thúc.</p>
          </div>
        </div>
      ) : null}

      {/* Listed Products Section */}
      <div className="products-section">
        <h2 className="products-title">Sản phẩm đăng bán</h2>
        
        {sellingNFTsLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Đang tải...</p>
          </div>
        ) : sellingNFTs.length === 0 ? (
          <div className="no-products">
            <p>Bạn chưa có sản phẩm nào đang bán</p>
          </div>
        ) : (
          <div className="products-grid">
            {sellingNFTs.map((nft, index) => (
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
                  <span className="listed-badge">Đang bán</span>
                </div>
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
    </div>
  );
};

export default SessionTab; 