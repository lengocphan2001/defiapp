import apiService from './api';

export interface Session {
  id: number;
  session_date: string;
  time_start: string;
  status: 'active' | 'closed';
  registration_fee: number;
  registration_count?: number;
  total_fees?: number;
  created_at: string;
  updated_at: string;
}

export interface SessionRegistration {
  id: number;
  session_id: number;
  user_id: number;
  registration_fee: number;
  status: 'registered' | 'cancelled';
  registered_at: string | null;
  username?: string;
  fullname?: string;
  session_date: string | null;
  time_start: string | null;
  session_status: string | null;
}

export interface SessionStats {
  session_id: number;
  session_date: string;
  registration_count: number;
  total_fees: number;
  registration_fee: number;
}

export const sessionService = {
  // Get today's session
  getTodaySession: async (): Promise<{ success: boolean; data: Session }> => {
    const response = await apiService.get<{ success: boolean; data: Session }>('/sessions/today');
    return response;
  },

  // Register for today's session
  registerForSession: async (): Promise<any> => {
    const response = await apiService.post<any>('/sessions/register', {});
    return response;
  },

  // Check registration status
  checkRegistration: async (): Promise<{ success: boolean; data: { is_registered: boolean; registration: SessionRegistration | null } }> => {
    const response = await apiService.get<{ success: boolean; data: { is_registered: boolean; registration: SessionRegistration | null } }>('/sessions/check-registration');
    return response;
  },

  // Get available NFTs for registered users only
  getAvailableNFTs: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await apiService.get<{ success: boolean; data: any[] }>('/sessions/available-nfts');
    return response;
  },

  // Buy NFT
  buyNFT: async (nftId: string): Promise<{ success: boolean; message: string; data: any }> => {
    const response = await apiService.post<{ success: boolean; message: string; data: any }>(`/sessions/buy-nft/${nftId}`, {});
    return response;
  },

  // Buy NFT without deducting balance immediately
  buyNFTWithoutDeduction: async (nftId: string): Promise<{ success: boolean; message: string; data: any }> => {
    const response = await apiService.post<{ success: boolean; message: string; data: any }>(`/sessions/buy-nft-without-deduction/${nftId}`, {});
    return response;
  },

  // Process pending payments (checkout)
  processPendingPayments: async (): Promise<{ success: boolean; message: string; data: any }> => {
    const response = await apiService.post<{ success: boolean; message: string; data: any }>('/sessions/process-pending-payments', {});
    return response;
  },

  // Get session statistics (admin only)
  getSessionStats: async (): Promise<SessionStats> => {
    const response = await apiService.get<{ success: boolean; data: SessionStats }>('/sessions/stats');
    return response.data;
  },

  // Get registered users (admin only)
  getRegisteredUsers: async (): Promise<SessionRegistration[]> => {
    const response = await apiService.get<{ success: boolean; data: SessionRegistration[] }>('/sessions/registered-users');
    return response.data;
  },

  // Close today's session (admin only)
  closeSession: async (): Promise<any> => {
    const response = await apiService.post<any>('/sessions/close', {});
    return response;
  },

  // Get all sessions (admin only)
  getAllSessions: async (): Promise<Session[]> => {
    const response = await apiService.get<{ success: boolean; data: Session[] }>('/sessions/all');
    return response.data;
  },

  // Get session by ID (admin only)
  getSessionById: async (sessionId: number): Promise<Session> => {
    const response = await apiService.get<{ success: boolean; data: Session }>(`/sessions/${sessionId}`);
    return response.data;
  },

  // Update session time (admin only)
  updateSessionTime: async (sessionId: number, timeStart: string): Promise<any> => {
    const response = await apiService.put<any>(`/sessions/${sessionId}/time`, { time_start: timeStart });
    return response;
  },

  // Update session registration fee (admin only)
  updateSessionFee: async (sessionId: number, registrationFee: number): Promise<any> => {
    const response = await apiService.put<any>(`/sessions/${sessionId}/fee`, { registration_fee: registrationFee });
    return response;
  },

  // Get user's transaction history
  getTransactionHistory: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await apiService.get<{ success: boolean; data: any[] }>('/sessions/transaction-history');
    return response;
  },

  // Get available sessions (from today onwards)
  getAvailableSessions: async (): Promise<{ success: boolean; data: Session[] }> => {
    const response = await apiService.get<{ success: boolean; data: Session[] }>('/sessions/available');
    return response;
  },

  // Register for specific session
  registerForSpecificSession: async (sessionId: number): Promise<any> => {
    const response = await apiService.post<any>(`/sessions/register/${sessionId}`, {});
    return response;
  },

  // Get user's session registrations
  getUserSessionRegistrations: async (): Promise<{ success: boolean; data: SessionRegistration[] }> => {
    const response = await apiService.get<{ success: boolean; data: SessionRegistration[] }>('/sessions/my-registrations');
    return response;
  },

  // Check if user is registered for specific session
  checkUserRegistrationForSession: async (sessionId: number): Promise<{ success: boolean; data: { is_registered: boolean } }> => {
    const response = await apiService.get<{ success: boolean; data: { is_registered: boolean } }>(`/sessions/check-registration/${sessionId}`);
    return response;
  },

  // Create new session (admin only)
  createSession: async (sessionData: { session_date: string; time_start?: string; registration_fee?: number }): Promise<any> => {
    const response = await apiService.post<any>('/sessions', sessionData);
    return response;
  },

  // Update session (admin only)
  updateSession: async (sessionId: number, sessionData: { session_date?: string; time_start?: string; status?: string; registration_fee?: number }): Promise<any> => {
    const response = await apiService.put<any>(`/sessions/${sessionId}`, sessionData);
    return response;
  },

  // Delete session (admin only)
  deleteSession: async (sessionId: number): Promise<any> => {
    const response = await apiService.delete<any>(`/sessions/${sessionId}`);
    return response;
  },

  // Get sessions with pagination (admin only)
  getSessionsWithPagination: async (page: number = 1, limit: number = 10): Promise<any> => {
    const response = await apiService.get<any>(`/sessions/paginated?page=${page}&limit=${limit}`);
    return response;
  }
}; 