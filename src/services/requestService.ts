import apiService from './api';

export interface RequestData {
  type: 'deposit' | 'withdraw';
  smp_amount: number;
  usdt_amount: number;
  address_wallet: string;
}

export interface Request {
  id: number;
  user_id: number;
  type: 'deposit' | 'withdraw';
  smp_amount: number;
  usdt_amount: number;
  address_wallet: string;
  status: 'pending' | 'success' | 'failed';
  created_at: string;
  updated_at: string;
}

class RequestService {
  // Create a new request (deposit or withdraw)
  async createRequest(requestData: RequestData): Promise<{ success: boolean; data: Request; message: string }> {
    try {
      const response = await apiService.post<{ success: boolean; data: Request; message: string }>('/requests', requestData);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get user's requests
  async getUserRequests(): Promise<{ success: boolean; data: Request[] }> {
    try {
      const response = await apiService.get<{ success: boolean; data: Request[] }>('/requests/my-requests');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get specific request by ID
  async getRequestById(requestId: number): Promise<{ success: boolean; data: Request }> {
    try {
      const response = await apiService.get<{ success: boolean; data: Request }>(`/requests/${requestId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update request status (admin only)
  async updateRequestStatus(requestId: number, status: 'pending' | 'success' | 'failed'): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.patch<{ success: boolean; message: string }>(`/requests/${requestId}/status`, { status });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get all requests (admin only)
  async getAllRequests(): Promise<{ success: boolean; data: Request[] }> {
    try {
      const response = await apiService.get<{ success: boolean; data: Request[] }>('/requests/admin/all');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get pending requests (admin only)
  async getPendingRequests(): Promise<{ success: boolean; data: Request[] }> {
    try {
      const response = await apiService.get<{ success: boolean; data: Request[] }>('/requests/admin/pending');
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

  // Format request status for display
  formatStatus(status: string): { text: string; color: string; bgColor: string } {
    switch (status) {
      case 'pending':
        return {
          text: 'Đang chờ',
          color: '#f59e0b',
          bgColor: '#fef3c7'
        };
      case 'success':
        return {
          text: 'Thành công',
          color: '#059669',
          bgColor: '#d1fae5'
        };
      case 'failed':
        return {
          text: 'Thất bại',
          color: '#dc2626',
          bgColor: '#fee2e2'
        };
      default:
        return {
          text: 'Không xác định',
          color: '#6b7280',
          bgColor: '#f3f4f6'
        };
    }
  }

  // Format request type for display
  formatType(type: string): { text: string; color: string; bgColor: string } {
    switch (type) {
      case 'deposit':
        return {
          text: 'Nạp',
          color: '#059669',
          bgColor: '#d1fae5'
        };
      case 'withdraw':
        return {
          text: 'Rút',
          color: '#dc2626',
          bgColor: '#fee2e2'
        };
      default:
        return {
          text: 'Không xác định',
          color: '#6b7280',
          bgColor: '#f3f4f6'
        };
    }
  }

  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

export default new RequestService(); 