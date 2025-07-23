import { apiService } from './api';

export interface SMPTransaction {
  id: number;
  from_user_id: number | null;
  to_user_id: number | null;
  amount: number;
  transaction_type: 'deposit' | 'withdrawal' | 'transfer' | 'nft_payment' | 'nft_sale' | 'commission' | 'refund';
  description: string;
  reference_id: string | null;
  reference_type: 'nft_transaction' | 'session_registration' | 'deposit_request' | 'withdrawal_request' | null;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  from_username?: string;
  to_username?: string;
}

class SMPTransactionService {
  // Get user's SMP transaction history
  async getUserTransactions(limit: number = 50, offset: number = 0): Promise<{ success: boolean; data: SMPTransaction[] }> {
    try {
      console.log(`Frontend: Fetching SMP transactions with limit=${limit}, offset=${offset}`);
      
      const response = await apiService.get<{ success: boolean; data: SMPTransaction[] }>(`/smp-transactions/user?limit=${limit}&offset=${offset}`);
      
      console.log(`Frontend: Received ${response.data?.length || 0} SMP transactions`);
      
      return response;
    } catch (error) {
      console.error('Frontend: Error fetching SMP transactions:', error);
      throw this.handleError(error);
    }
  }

  // Get all SMP transactions (admin only)
  async getAllTransactions(limit: number = 100, offset: number = 0): Promise<{ success: boolean; data: SMPTransaction[] }> {
    try {
      const response = await apiService.get<{ success: boolean; data: SMPTransaction[] }>(`/smp-transactions/all?limit=${limit}&offset=${offset}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get SMP transactions by type
  async getTransactionsByType(type: string, limit: number = 50, offset: number = 0): Promise<{ success: boolean; data: SMPTransaction[] }> {
    try {
      const response = await apiService.get<{ success: boolean; data: SMPTransaction[] }>(`/smp-transactions/type/${type}?limit=${limit}&offset=${offset}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get SMP transaction statistics (admin only)
  async getTransactionStats(): Promise<{ success: boolean; data: any }> {
    try {
      const response = await apiService.get<{ success: boolean; data: any }>('/smp-transactions/stats');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get transactions by reference
  async getTransactionsByReference(referenceType: string, referenceId: string): Promise<{ success: boolean; data: SMPTransaction[] }> {
    try {
      const response = await apiService.get<{ success: boolean; data: SMPTransaction[] }>(`/smp-transactions/reference/${referenceType}/${referenceId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create manual SMP transaction (admin only)
  async createManualTransaction(transactionData: {
    from_user_id?: number;
    to_user_id?: number;
    amount: number;
    transaction_type: string;
    description?: string;
    reference_id?: string;
    reference_type?: string;
  }): Promise<{ success: boolean; message: string; data: SMPTransaction }> {
    try {
      const response = await apiService.post<{ success: boolean; message: string; data: SMPTransaction }>('/smp-transactions/create', transactionData);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    console.error('Frontend: SMP Transaction Service Error:', error);
    
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    
    if (error.message) {
      return new Error(error.message);
    }
    
    return new Error('An error occurred while processing SMP transaction');
  }
}

const smpTransactionService = new SMPTransactionService();
export default smpTransactionService; 