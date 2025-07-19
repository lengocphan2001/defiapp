import apiService from './api';

export interface User {
  id: number;
  username: string;
  phone: string;
  balance: string;
  address_wallet: string;
  created_at: string;
  status: 'active' | 'inactive';
}

class UserService {
  // Get all users (admin only)
  async getAllUsers(): Promise<{ success: boolean; data: User[] }> {
    try {
      const response = await apiService.get<{ success: boolean; data: User[] }>('/users/admin/all');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get user by ID
  async getUserById(userId: number): Promise<{ success: boolean; data: User }> {
    try {
      const response = await apiService.get<{ success: boolean; data: User }>(`/users/${userId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update user balance (admin only)
  async updateUserBalance(userId: number, amount: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.patch<{ success: boolean; message: string }>(`/users/${userId}/balance`, { amount });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update user status (admin only)
  async updateUserStatus(userId: number, status: 'active' | 'inactive'): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.patch<{ success: boolean; message: string }>(`/users/${userId}/status`, { status });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get user statistics (admin only)
  async getUserStats(): Promise<{ success: boolean; data: any }> {
    try {
      const response = await apiService.get<{ success: boolean; data: any }>('/users/admin/stats');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update user profile
  async updateUserProfile(profileData: {
    phone: string;
    fullname?: string;
    address_wallet?: string;
  }): Promise<{ success: boolean; message: string; data: { user: any } }> {
    try {
      const response = await apiService.put<{ success: boolean; message: string; data: { user: any } }>('/users/profile', profileData);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get referral users
  async getReferralUsers(): Promise<{ success: boolean; data: any[]; message?: string }> {
    try {
      const response = await apiService.get<{ success: boolean; data: any[]; message?: string }>('/users/referrals');
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

  // Format user data for display
  formatUserData(user: User) {
    return {
      ...user,
      balance: parseFloat(user.balance).toLocaleString('vi-VN'),
      created_at: new Date(user.created_at).toLocaleString('vi-VN')
    };
  }
}

export default new UserService(); 