import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Copy, X, RefreshCw } from 'lucide-react';
import cryptoService from '../../services/cryptoService';
import requestService, { RequestData } from '../../services/requestService';
import './DepositModal.css';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestCreated?: () => void;
}

interface CryptoPrice {
  usdt: number;
  vnd: number;
}

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onRequestCreated }) => {
  const [smpAmount, setSmpAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [cryptoPrice, setCryptoPrice] = useState<CryptoPrice>({ usdt: 1, vnd: 24000 });
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const walletAddress = '0xYourBEP20';
  
  // Calculate USDT amount based on SMP input
  const usdtAmount = smpAmount && parseFloat(smpAmount) > 0 
    ? cryptoService.convertSMPToUSDT(parseFloat(smpAmount), cryptoPrice.usdt)
    : 0;
  
  // Fetch USDT price
  const fetchUSDTPrice = async (forceRefresh = false) => {
    setPriceLoading(true);
    try {
      const price = await cryptoService.getUSDTPrice();
      setCryptoPrice(price);
    } catch (error) {
      console.error('Failed to fetch USDT price:', error);
    } finally {
      setPriceLoading(false);
    }
  };

  // Initialize price when modal opens
  useEffect(() => {
    if (isOpen) {
      // First try to get cached price immediately
      const cachedPrice = cryptoService.getCachedPrice();
      if (cachedPrice) {
        console.log('Using cached price immediately:', cachedPrice);
        setCryptoPrice(cachedPrice);
      } else {
        console.log('No cached price, fetching...');
        // If no cache, fetch new price
        fetchUSDTPrice();
      }
    }
  }, [isOpen]);
  
  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };
  
  const handleSubmit = async () => {
    if (!smpAmount || parseFloat(smpAmount) <= 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const requestData: RequestData = {
        type: 'deposit',
        smp_amount: parseFloat(smpAmount),
        usdt_amount: usdtAmount,
        address_wallet: walletAddress
      };

      const response = await requestService.createRequest(requestData);
      
      console.log('Deposit request created:', response);
      
      // Show success message
      alert('Yêu cầu nạp tiền đã được gửi thành công!');
      
      // Close modal and reset form
      onClose();
      setSmpAmount('');
      
      // Notify parent component
      if (onRequestCreated) {
        onRequestCreated();
      }
      
    } catch (error) {
      console.error('Failed to submit deposit request:', error);
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi gửi yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPrice = () => {
    fetchUSDTPrice(true);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="deposit-modal-overlay" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="deposit-modal-backdrop" />
        </Transition.Child>

        <div className="deposit-modal-container">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="deposit-modal-panel">
              <div className="deposit-modal-header">
                <Dialog.Title className="deposit-modal-title">
                  Chuyển USDT BEP20
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="deposit-modal-close"
                  aria-label="Close modal"
                  disabled={loading}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="deposit-modal-content">
                {/* Error Message */}
                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}

                {/* Address Section */}
                <div className="address-section">
                  <div className="address-display">
                    <span className="address-text">{walletAddress}</span>
                    <button
                      onClick={handleCopyAddress}
                      className={`copy-button ${copied ? 'copied' : ''}`}
                      aria-label="Copy address"
                      disabled={loading}
                    >
                      <Copy size={16} />
                      {copied && <span className="copy-tooltip">Đã copy!</span>}
                    </button>
                  </div>
                </div>

                {/* Exchange Rate */}
                <div className="exchange-rate">
                  <div className="rate-display">
                    <span>Giá USDT: {cryptoPrice.vnd.toLocaleString('vi-VN')} VND</span>
                    {/* <button
                      onClick={handleRefreshPrice}
                      className={`refresh-button ${priceLoading ? 'loading' : ''}`}
                      disabled={priceLoading}
                      aria-label="Refresh price"
                    >
                      <RefreshCw size={14} />
                    </button> */}
                  </div>
                  {priceLoading && <div className="price-loading">Đang cập nhật giá...</div>}
                </div>

                {/* Input Section */}
                <div className="input-section">
                  <input
                    type="number"
                    value={smpAmount}
                    onChange={(e) => setSmpAmount(e.target.value)}
                    placeholder="SMP muốn nạp"
                    className="smp-input"
                    min="0"
                    step="1"
                    disabled={loading}
                  />
                </div>

                {/* Calculated Amount */}
                <div className="calculated-amount">
                  <div className="amount-display">
                    <span>Cần: {usdtAmount.toFixed(2)} USDT</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                  <button
                    onClick={handleSubmit}
                    className="submit-button"
                    disabled={!smpAmount || parseFloat(smpAmount) <= 0 || loading}
                  >
                    {loading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
                  </button>
                  <button
                    onClick={onClose}
                    className="cancel-button"
                    disabled={loading}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default DepositModal; 