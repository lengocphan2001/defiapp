import apiService from './api';

interface SessionData {
  session_id: number;
  session_date: string;
  status: 'active' | 'closed';
  registration_fee: number;
}

interface RegistrationData {
  registration_id: number;
  session_id: number;
  registration_fee: number;
  registered_at: string;
}

interface RegistrationStatus {
  is_registered: boolean;
  registration: RegistrationData | null;
}

interface SessionStats {
  session_id: number;
  session_date: string;
  registration_count: number;
  total_fees: number;
  registration_fee: number;
}

class SessionService {
  // Get today's session info
  async getTodaySession(): Promise<{ success: boolean; data: SessionData }> {
    try {
      const response = await apiService.get<{ success: boolean; data: SessionData }>('/sessions/today');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Register for today's session
  async registerForSession(): Promise<{ success: boolean; message: string; data: RegistrationData }> {
    try {
      const response = await apiService.post<{ success: boolean; message: string; data: RegistrationData }>('/sessions/register', {});
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Check if user is registered for today's session
  async checkRegistration(): Promise<{ success: boolean; data: RegistrationStatus }> {
    try {
      const response = await apiService.get<{ success: boolean; data: RegistrationStatus }>('/sessions/check-registration');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get available NFTs for registered users only
  async getAvailableNFTs(): Promise<{ success: boolean; data: any[] }> {
    try {
      const response = await apiService.get<{ success: boolean; data: any[] }>('/sessions/available-nfts');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get session statistics (admin only)
  async getSessionStats(): Promise<{ success: boolean; data: SessionStats }> {
    try {
      const response = await apiService.get<{ success: boolean; data: SessionStats }>('/sessions/stats');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get registered users for today's session (admin only)
  async getRegisteredUsers(): Promise<{ success: boolean; data: any[] }> {
    try {
      const response = await apiService.get<{ success: boolean; data: any[] }>('/sessions/registered-users');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Close today's session (admin only)
  async closeSession(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.post<{ success: boolean; message: string }>('/sessions/close', {});
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get user's transaction history
  async getTransactionHistory(): Promise<{ success: boolean; data: any[] }> {
    try {
      const response = await apiService.get<{ success: boolean; data: any[] }>('/sessions/transaction-history');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Buy NFT
  async buyNFT(nftId: string): Promise<{ success: boolean; message: string; data: any }> {
    try {
      const response = await apiService.post<{ success: boolean; message: string; data: any }>(`/sessions/buy-nft/${nftId}`, {});
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

  // Format session date for display
  formatSessionDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit'
    });
  }

  // Format registration fee for display
  formatRegistrationFee(fee: number): string {
    return fee.toLocaleString('vi-VN') + ' SMP';
  }
}

export default new SessionService(); 