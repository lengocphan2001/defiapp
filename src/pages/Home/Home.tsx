import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  HomeTab, 
  SessionTab, 
  NFTTab, 
  WalletTab, 
  ProfileTab 
} from '../../components/tabs';
import BottomNavigation, { BottomTab } from '../../components/common/BottomNavigation';
import './Home.css';

// Navigation Icons
const HomeIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </svg>
);

const SessionIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

const NFTIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21,15 16,10 5,21"/>
  </svg>
);

const WalletIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
    <path d="M18 12a2 2 0 0 0-2 2v4h4v-4a2 2 0 0 0-2-2z"/>
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const SpeakerIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5"/>
    <path d="M19.07,4.93a10,10,0,0,1,0,14.14M15.54,8.46a6,6,0,0,1,0,7.08"/>
  </svg>
);

const CartIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1,1h4l2.68,13.39a2,2,0,0,0,2,1.61h9.72a2,2,0,0,0,2-1.61L23,6H6"/>
  </svg>
);

const PigIcon = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

const Home: React.FC = () => {
  const { state } = useApp();
  const { user } = useAuth();
  
  // Get saved tab from localStorage or default to 'home'
  const getSavedTab = (): BottomTab => {
    const saved = localStorage.getItem('activeTab');
    return (saved as BottomTab) || 'home';
  };

  const [activeTab, setActiveTab] = useState<BottomTab>(getSavedTab);

  // Save tab to localStorage whenever it changes
  const handleTabChange = (tab: BottomTab) => {
    setActiveTab(tab);
    localStorage.setItem('activeTab', tab);
  };

  // Load saved tab on component mount
  useEffect(() => {
    const savedTab = getSavedTab();
    setActiveTab(savedTab);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab />;
      case 'session':
        return <SessionTab />;
      case 'nft':
        return <NFTTab />;
      case 'wallet':
        return <WalletTab />;
      case 'profile':
        return <ProfileTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <div className={`smart-mall-app modern-bg ${state.theme}`}>
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            {/* ... existing code ... */}
          </div>
          <div className="header-center">
            <h1 className="app-title">Smart Mall</h1>
            <div className="app-subtitle">
              {/* ... existing code ... */}
            </div>
            <p className="welcome-text">Chào mừng bạn đến với Smart Mall – Giao dịch thông minh!</p>
          </div>
          <div className="header-right">
            {user?.role === 'admin' && (
              <Link to="/admin" className="admin-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Admin Panel
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {renderContent()}
      </main>

      {/* Modern Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default Home; 