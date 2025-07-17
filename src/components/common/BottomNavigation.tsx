import React from 'react';
import './BottomNavigation.css';

export type BottomTab = 'home' | 'session' | 'nft' | 'wallet' | 'profile';

interface BottomNavigationProps {
  activeTab: BottomTab;
  onTabChange: (tab: BottomTab) => void;
}

const tabs = [
  { key: 'home', label: 'Home' },
  { key: 'session', label: 'Session' },
  { key: 'nft', label: 'NFT' },
  { key: 'wallet', label: 'Wallet' },
  { key: 'profile', label: 'Profile' },
] as const;

// Game Controller Icon for Home (matches the image exactly)
const GameControllerIcon = ({ isActive }: { isActive: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="6" width="20" height="12" rx="2" fill={isActive ? "#8B5CF6" : "#9CA3AF"} />
    <circle cx="7" cy="10" r="1" fill="white" />
    <circle cx="7" cy="14" r="1" fill="white" />
    <circle cx="11" cy="10" r="1" fill="white" />
    <circle cx="11" cy="14" r="1" fill="white" />
    <circle cx="17" cy="12" r="1.5" fill={isActive ? "#FCD34D" : "#9CA3AF"} />
    <rect x="15" y="10.5" width="1" height="3" fill={isActive ? "#FCD34D" : "#9CA3AF"} />
    <rect x="19" y="10.5" width="1" height="3" fill={isActive ? "#FCD34D" : "#9CA3AF"} />
  </svg>
);

// Trophy/Bell Icon for Session (matches the image)
const TrophyIcon = ({ isActive }: { isActive: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C8 2 9 7 9 7H6V9Z" fill={isActive ? "#8B5CF6" : "#9CA3AF"} />
    <path d="M18 9H15V7C15 2 16 2 19.5 4a2.5 2.5 0 0 1 0 5H18V9Z" fill={isActive ? "#8B5CF6" : "#9CA3AF"} />
    <path d="M4 11h16v2a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-2Z" fill={isActive ? "#8B5CF6" : "#9CA3AF"} />
    <circle cx="12" cy="13" r="1" fill="white" />
  </svg>
);

// Magnifying Glass Icon for NFT (matches the image)
const SearchIcon = ({ isActive }: { isActive: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="8" stroke={isActive ? "#8B5CF6" : "#9CA3AF"} strokeWidth="2" fill="none" />
    <path d="m21 21-4.35-4.35" stroke={isActive ? "#8B5CF6" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Wallet Icon for Wallet
const WalletIcon = ({ isActive }: { isActive: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="6" width="20" height="12" rx="2" fill={isActive ? "#8B5CF6" : "#9CA3AF"} />
    <rect x="16" y="10" width="6" height="4" rx="1" fill={isActive ? "#FCD34D" : "#9CA3AF"} />
    <circle cx="18" cy="12" r="1" fill="white" />
  </svg>
);

// Smiley Face Icon for Profile (matches the image)
const SmileyIcon = ({ isActive }: { isActive: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke={isActive ? "#8B5CF6" : "#9CA3AF"} strokeWidth="2" fill="none" />
    <circle cx="8" cy="10" r="1" fill={isActive ? "#8B5CF6" : "#9CA3AF"} />
    <circle cx="16" cy="10" r="1" fill={isActive ? "#8B5CF6" : "#9CA3AF"} />
    <path d="M8 16s1.5 2 4 2 4-2 4-2" stroke={isActive ? "#8B5CF6" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  const getIcon = (tabKey: string, isActive: boolean) => {
    switch (tabKey) {
      case 'home':
        return <GameControllerIcon isActive={isActive} />;
      case 'session':
        return <TrophyIcon isActive={isActive} />;
      case 'nft':
        return <SearchIcon isActive={isActive} />;
      case 'wallet':
        return <WalletIcon isActive={isActive} />;
      case 'profile':
        return <SmileyIcon isActive={isActive} />;
      default:
        return <GameControllerIcon isActive={isActive} />;
    }
  };

  return (
    <nav className="bottom-nav-modern">
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            className={`nav-modern-item${isActive ? ' active' : ''}`}
            onClick={() => onTabChange(tab.key as BottomTab)}
            aria-label={tab.label}
          >
            {getIcon(tab.key, isActive)}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavigation; 