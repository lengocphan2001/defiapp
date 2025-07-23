import apiService from './api';
import { NFT, CreateNFTData, UpdateNFTData, NFTStats } from '../types';

class NFTService {
  // Create new NFT
  async createNFT(nftData: CreateNFTData): Promise<{ success: boolean; message: string; data: NFT }> {
    try {
      // Always set type to 'sell' if not provided
      const dataToSend = { ...nftData, type: nftData.type || 'sell' };
      const response = await apiService.post<{ success: boolean; message: string; data: NFT }>('/nfts', dataToSend);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get all available NFTs
  async getAvailableNFTs(): Promise<{ success: boolean; data: NFT[] }> {
    try {
      const response = await apiService.get<{ success: boolean; data: NFT[] }>('/nfts/available');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get all NFTs (admin only)
  async getAllNFTs(): Promise<{ success: boolean; data: NFT[] }> {
    try {
      const response = await apiService.get<{ success: boolean; data: NFT[] }>('/nfts/admin/all');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get NFT by ID
  async getNFTById(id: string): Promise<{ success: boolean; data: NFT }> {
    try {
      const response = await apiService.get<{ success: boolean; data: NFT }>(`/nfts/${id}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get user's NFTs
  async getUserNFTs(): Promise<{ success: boolean; data: NFT[] }> {
    try {
      const response = await apiService.get<{ success: boolean; data: NFT[] }>('/nfts/user/my');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get user's selling NFTs (NFTs listed for sale)
  async getUserSellingNFTs(): Promise<{ success: boolean; data: NFT[] }> {
    try {
      const response = await apiService.get<{ success: boolean; data: NFT[] }>('/nfts/user/selling');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update NFT price
  async updateNFTPrice(id: string, price: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.patch<{ success: boolean; message: string }>(`/nfts/${id}/price`, { price });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update NFT status
  async updateNFTStatus(id: string, status: 'available' | 'sold' | 'cancelled'): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.patch<{ success: boolean; message: string }>(`/nfts/${id}/status`, { status });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Pay for specific NFT
  async payNFT(id: string, price: number): Promise<{ success: boolean; message: string; data: any }> {
    try {
      const response = await apiService.post<{ success: boolean; message: string; data: any }>(`/nfts/${id}/pay`, { price });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Sell NFT (set for next day session)
  async sellNFT(id: string): Promise<{ success: boolean; message: string; data: any }> {
    try {
      const response = await apiService.post<{ success: boolean; message: string; data: any }>(`/nfts/${id}/sell`, {});
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Open NFT (refund 90% and cancel)
  async openNFT(id: string): Promise<{ success: boolean; message: string; data: any }> {
    try {
      const response = await apiService.post<{ success: boolean; message: string; data: any }>(`/nfts/${id}/open`, {});
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update NFT owner (admin only)
  async updateNFTOwner(id: string, ownerId: number): Promise<{ success: boolean; message: string; data: any }> {
    try {
      const response = await apiService.patch<{ success: boolean; message: string; data: any }>(`/nfts/${id}/owner`, { owner_id: ownerId });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete NFT
  async deleteNFT(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(`/nfts/${id}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get NFT statistics (admin only)
  async getNFTStats(): Promise<{ success: boolean; data: NFTStats }> {
    try {
      const response = await apiService.get<{ success: boolean; data: NFTStats }>('/nfts/admin/stats');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Helper method to handle errors
  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    if (error.message) {
      return new Error(error.message);
    }
    return new Error('An unexpected error occurred');
  }

  // Format NFT data for display
  formatNFTData(nft: NFT) {
    return {
      ...nft,
      price: parseFloat(nft.price).toLocaleString('vi-VN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8
      }),
      created_at: new Date(nft.created_at).toLocaleString('vi-VN'),
      updated_at: new Date(nft.updated_at).toLocaleString('vi-VN')
    };
  }

  // Format price for display
  formatPrice(price: string | number): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toLocaleString('vi-VN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
  }

  // Get status color
  getStatusColor(status: string): string {
    switch (status) {
      case 'available':
        return '#10b981'; // green
      case 'sold':
        return '#3b82f6'; // blue
      case 'cancelled':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  }

  // Get status text
  getStatusText(status: string): string {
    switch (status) {
      case 'available':
        return 'Có sẵn';
      case 'sold':
        return 'Đã bán';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return 'Không xác định';
    }
  }

  // Get type text
  getTypeText(type: string): string {
    switch (type) {
      case 'buy':
        return 'Đã mua';
      case 'sell':
        return 'Đang bán';
      case 'list':
        return 'Đã đăng';
      case 'open':
        return 'Đã mở';
      default:
        return 'Không xác định';
    }
  }
}

export default new NFTService(); 