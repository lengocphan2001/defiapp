import React, { useState } from 'react';
import './NFTTab.css';

const NFTTab: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const nfts = [
    {
      id: 1,
      name: 'CryptoPunk #1234',
      image: 'https://via.placeholder.com/200x200/6366f1/ffffff?text=CP#1234',
      price: '2.5 ETH',
      collection: 'CryptoPunks',
      rarity: 'Legendary',
      likes: 234,
      category: 'art'
    },
    {
      id: 2,
      name: 'Bored Ape #5678',
      image: 'https://via.placeholder.com/200x200/10b981/ffffff?text=BA#5678',
      price: '15 ETH',
      collection: 'Bored Ape Yacht Club',
      rarity: 'Epic',
      likes: 456,
      category: 'collectibles'
    },
    {
      id: 3,
      name: 'Doodle #9012',
      image: 'https://via.placeholder.com/200x200/f59e0b/ffffff?text=DD#9012',
      price: '1.2 ETH',
      collection: 'Doodles',
      rarity: 'Rare',
      likes: 123,
      category: 'art'
    },
    {
      id: 4,
      name: 'Azuki #3456',
      image: 'https://via.placeholder.com/200x200/ef4444/ffffff?text=AZ#3456',
      price: '8.5 ETH',
      collection: 'Azuki',
      rarity: 'Epic',
      likes: 789,
      category: 'collectibles'
    }
  ];

  const categories = [
    { id: 'all', label: 'Tất cả', icon: '🎨' },
    { id: 'art', label: 'Nghệ thuật', icon: '🖼️' },
    { id: 'collectibles', label: 'Sưu tầm', icon: '📦' },
    { id: 'gaming', label: 'Game', icon: '🎮' },
    { id: 'music', label: 'Âm nhạc', icon: '🎵' }
  ];

  const collections = [
    { name: 'CryptoPunks', floor: '25 ETH', volume: '1,234 ETH', items: '10,000' },
    { name: 'Bored Ape Yacht Club', floor: '15 ETH', volume: '2,345 ETH', items: '10,000' },
    { name: 'Doodles', floor: '2.5 ETH', volume: '567 ETH', items: '10,000' },
    { name: 'Azuki', floor: '8 ETH', volume: '890 ETH', items: '10,000' }
  ];

  const filteredNFTs = nfts.filter(nft => 
    activeCategory === 'all' || nft.category === activeCategory
  );

  return (
    <div className="nft-tab">
      {/* Header */}
      
      <h1>NFT tab</h1>
    </div>
  );
};

export default NFTTab; 