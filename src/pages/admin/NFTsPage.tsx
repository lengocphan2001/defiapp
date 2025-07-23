import React, { useState, useEffect } from 'react';
import { 
  Image, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  RefreshCw,
  DollarSign,
  User as UserIcon,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import nftService from '../../services/nftService';
import userService, { User } from '../../services/userService';
import { NFT, CreateNFTData } from '../../types';
import { formatBalance, formatPrice } from '../../utils';
import './NFTsPage.css';

const NFTsPage: React.FC = () => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'delete' | 'create'>('view');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    owner_id: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);

  useEffect(() => {
    loadNFTs();
    loadUsers();
  }, []);

  const loadNFTs = async () => {
    setLoading(true);
    try {
      const response = await nftService.getAllNFTs();
      setNfts(response.data);
    } catch (error) {
      console.error('Failed to load NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userService.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const filteredNFTs = nfts.filter(nft => {
    const matchesSearch = nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         nft.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         nft.owner_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || nft.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewNFT = (nft: NFT) => {
    setSelectedNFT(nft);
    setModalType('view');
    setShowModal(true);
  };

  const handleEditNFT = (nft: NFT) => {
    setSelectedNFT(nft);
    setFormData({
      name: nft.name,
      price: nft.price,
      owner_id: nft.owner_id.toString()
    });
    setModalType('edit');
    setShowModal(true);
  };

  const handleDeleteNFT = (nft: NFT) => {
    setSelectedNFT(nft);
    setModalType('delete');
    setShowModal(true);
  };

  const handleChangeOwner = (nft: NFT) => {
    setSelectedNFT(nft);
    setFormData({
      name: nft.name,
      price: nft.price,
      owner_id: nft.owner_id.toString()
    });
    setModalType('edit');
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedNFT) return;
    
    try {
      await nftService.deleteNFT(selectedNFT.id);
      setShowModal(false);
      setSelectedNFT(null);
      loadNFTs(); // Reload the list
    } catch (error) {
      console.error('Failed to delete NFT:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.price.trim()) {
      setFormMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setFormLoading(true);
    setFormMessage(null);

    try {
      if (modalType === 'create') {
        await nftService.createNFT({
          name: formData.name,
          price: parseFloat(formData.price)
        });
        setFormMessage({ type: 'success', text: 'NFT created successfully!' });
      } else if (modalType === 'edit' && selectedNFT) {
        // Update price
        await nftService.updateNFTPrice(selectedNFT.id, parseFloat(formData.price));
        
        // Update owner if changed
        if (formData.owner_id && parseInt(formData.owner_id) !== selectedNFT.owner_id) {
          await nftService.updateNFTOwner(selectedNFT.id, parseInt(formData.owner_id));
        }
        
        setFormMessage({ type: 'success', text: 'NFT updated successfully!' });
      }
      
      setTimeout(() => {
        setShowModal(false);
        resetForm();
        loadNFTs(); // Reload the list
      }, 1500);
    } catch (error) {
      setFormMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'An error occurred' 
      });
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      owner_id: ''
    });
    setFormMessage(null);
  };

  const handleStatusChange = async (nftId: string, newStatus: string) => {
    try {
      await nftService.updateNFTStatus(nftId, newStatus as 'available' | 'sold' | 'cancelled');
      loadNFTs(); // Reload the list to reflect changes
    } catch (error) {
      console.error('Failed to update NFT status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const color = nftService.getStatusColor(status);
    const text = nftService.getStatusText(status);
    return (
      <span className="status-badge" style={{ backgroundColor: color }}>
        {text}
      </span>
    );
  };

  return (
    <div className="nfts-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>NFT Management</h1>
          <p>Manage all NFTs on the platform</p>
        </div>
        <div className="header-actions">
          <button 
            className="create-button"
            onClick={() => {
              setModalType('create');
              setSelectedNFT(null);
              setShowModal(true);
            }}
          >
            <Plus size={18} />
            Create NFT
          </button>
          <button 
            className="refresh-button"
            onClick={loadNFTs}
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by name, ID, or seller..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <div className="filter-box">
          <Filter size={20} />
          <select value={statusFilter} onChange={handleStatusFilter}>
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* NFTs Table */}
      <div className="nfts-table-container">
        <table className="nfts-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Owner</th>
              <th>Price</th>
              <th>Type</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredNFTs.map((nft) => (
              <tr key={nft.id}>
                <td className="nft-id">{nft.id}</td>
                <td className="nft-name">{nft.name}</td>
                <td className="nft-seller">{nft.owner_name}</td>
                <td className="nft-price">
                  {formatPrice(nft.price)} 
                </td>
                <td className="nft-type">{nftService.getTypeText(nft.type)}</td>
                <td className="nft-status">
                  {getStatusBadge(nft.status)}
                </td>
                <td className="nft-date">
                  {new Date(nft.created_at).toLocaleDateString('vi-VN')}
                </td>
                <td className="nft-actions">
                  <button
                    className="action-btn view"
                    onClick={() => handleViewNFT(nft)}
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="action-btn edit"
                    onClick={() => handleEditNFT(nft)}
                    title="Edit NFT"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="action-btn owner"
                    onClick={() => handleChangeOwner(nft)}
                    title="Change Owner"
                  >
                    <UserIcon size={16} />
                  </button>
                  <select
                    className="status-select"
                    value={nft.status}
                    onChange={(e) => handleStatusChange(nft.id, e.target.value)}
                    title="Change Status"
                  >
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDeleteNFT(nft)}
                    title="Delete NFT"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredNFTs.length === 0 && !loading && (
          <div className="empty-state">
            <Image size={48} />
            <h3>No NFTs found</h3>
            <p>No NFTs match your current filters</p>
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <RefreshCw size={24} className="spinning" />
            <p>Loading NFTs...</p>
          </div>
        )}
      </div>

      {/* NFT Details Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalType === 'view' && 'NFT Details'}
                {modalType === 'create' && 'Create New NFT'}
                {modalType === 'edit' && 'Edit NFT'}
                {modalType === 'delete' && 'Delete NFT'}
              </h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {modalType === 'view' && selectedNFT && (
                <div className="nft-details">
                  <div className="detail-row">
                    <span className="label">ID:</span>
                    <span className="value">{selectedNFT.id}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Name:</span>
                    <span className="value">{selectedNFT.name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Seller:</span>
                    <span className="value">{selectedNFT.owner_name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Price:</span>
                    <span className="value">{formatPrice(selectedNFT.price)} SMP</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Status:</span>
                    <span className="value">{getStatusBadge(selectedNFT.status)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Type:</span>
                    <span className="value">{selectedNFT.type}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Created:</span>
                    <span className="value">
                      {new Date(selectedNFT.created_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Updated:</span>
                    <span className="value">
                      {new Date(selectedNFT.updated_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
              )}

              {(modalType === 'create' || modalType === 'edit') && (
                <div className="nft-form">
                  <div className="form-group">
                    <label className="form-label">NFT Name:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter NFT name"
                      disabled={modalType === 'edit'} // Name cannot be edited
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price (SMP):</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="Enter price in SMP"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  {modalType === 'edit' && (
                    <div className="form-group">
                      <label className="form-label">Owner:</label>
                      <select
                        className="form-input"
                        value={formData.owner_id}
                        onChange={(e) => handleInputChange('owner_id', e.target.value)}
                      >
                        <option value="">Select owner...</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.username} (ID: {user.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {formMessage && (
                    <div className={`form-message ${formMessage.type}`}>
                      {formMessage.text}
                    </div>
                  )}
                </div>
              )}

              {modalType === 'delete' && selectedNFT && (
                <div className="delete-confirmation">
                  <p>Are you sure you want to delete this NFT?</p>
                  <div className="nft-summary">
                    <strong>{selectedNFT.name}</strong>
                    <span>ID: {selectedNFT.id}</span>
                    <span>Price: {formatPrice(selectedNFT.price)} SMP</span>
                  </div>
                  <p className="warning">This action cannot be undone.</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {modalType === 'delete' && selectedNFT && (
                <>
                  <button 
                    className="btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={confirmDelete}
                  >
                    Delete NFT
                  </button>
                </>
              )}
              {(modalType === 'create' || modalType === 'edit') && (
                <>
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    disabled={formLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={handleSubmit}
                    disabled={formLoading}
                  >
                    {formLoading ? 'Saving...' : (modalType === 'create' ? 'Create NFT' : 'Update NFT')}
                  </button>
                </>
              )}
              {modalType === 'view' && (
                <button 
                  className="btn-primary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTsPage; 