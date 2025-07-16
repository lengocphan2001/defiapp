import React, { useState } from 'react';
import { Button } from '../common';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { authService } from '../../services/auth';
import './WalletSettings.css';

const WalletIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0-2 2v4h4v-4a2 2 0 0 0-2-2z" />
  </svg>
);

const WalletSettings: React.FC = () => {
  const { user, updateWalletAddress } = useAuth();
  const [walletAddress, setWalletAddress] = useState(user?.address_wallet || '');
  const [isEditing, setIsEditing] = useState(false);

  const { execute: updateWallet, loading, error: apiError } = useApi(authService.updateWalletAddress);

  const handleSave = async () => {
    if (!walletAddress.trim()) {
      alert('Please enter a wallet address');
      return;
    }

    try {
      await updateWallet(walletAddress.trim());
      await updateWalletAddress(walletAddress.trim());
      setIsEditing(false);
      alert('Wallet address updated successfully!');
    } catch (error) {
      console.error('Failed to update wallet address:', error);
    }
  };

  const handleCancel = () => {
    setWalletAddress(user?.address_wallet || '');
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <div className="wallet-settings">
      <div className="wallet-header">
        <h3>Wallet Settings</h3>
        <WalletIcon />
      </div>

      <div className="wallet-content">
        <div className="wallet-info">
          <div className="info-row">
            <span className="label">Current Balance:</span>
            <span className="value">{parseFloat(user?.balance || '0').toFixed(2)}</span>
          </div>
          
          <div className="info-row">
            <span className="label">Wallet Address:</span>
            <span className="value">
              {user?.address_wallet ? (
                <span className="address">{user.address_wallet}</span>
              ) : (
                <span className="no-address">Not set</span>
              )}
            </span>
          </div>
        </div>

        {isEditing ? (
          <div className="wallet-form">
            <div className="input-group">
              <label htmlFor="wallet-address" className="input-label">
                Wallet Address
              </label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <WalletIcon />
                </div>
                <input
                  id="wallet-address"
                  type="text"
                  placeholder="Enter your wallet address"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="wallet-input"
                />
              </div>
            </div>
            
            {apiError && (
              <div className="error-message">
                {apiError}
              </div>
            )}

            <div className="form-actions">
              <Button
                onClick={handleSave}
                variant="primary"
                disabled={loading}
                className="save-btn"
              >
                {loading ? 'Saving...' : 'Save Address'}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="cancel-btn"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="wallet-actions">
            <Button
              onClick={handleEdit}
              variant="primary"
              className="edit-btn"
            >
              {user?.address_wallet ? 'Update Wallet Address' : 'Set Wallet Address'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletSettings; 