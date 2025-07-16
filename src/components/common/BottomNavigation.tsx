import React from 'react';
import { Home, Layers, Image, Wallet, User } from 'lucide-react';
import './BottomNavigation.css';

export type BottomTab = 'home' | 'session' | 'nft' | 'wallet' | 'profile';

interface BottomNavigationProps {
  activeTab: BottomTab;
  onTabChange: (tab: BottomTab) => void;
}

const tabs = [
  { key: 'home', label: 'Trang chủ', icon: Home },
  { key: 'session', label: 'Phiên', icon: Layers },
  { key: 'nft', label: 'NFT', icon: Image },
  { key: 'wallet', label: 'Ví', icon: Wallet },
  { key: 'profile', label: 'Thông tin', icon: User },
] as const;

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="bottom-nav-modern">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            className={`nav-modern-item${isActive ? ' active' : ''}`}
            onClick={() => onTabChange(tab.key as BottomTab)}
            aria-label={tab.label}
          >
            <Icon className="nav-modern-icon" strokeWidth={isActive ? 2.5 : 2} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavigation; 