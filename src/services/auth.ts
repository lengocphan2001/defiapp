import { apiService } from './api';
import { LoginFormData, RegisterFormData, LoginResponse, RegisterResponse, AuthResponse } from '../types';

class AuthService {
  // Login user
  async login(credentials: LoginFormData): Promise<LoginResponse> {
    return apiService.post<LoginResponse>('/auth/login', credentials);
  }

  // Register user
  async register(userData: RegisterFormData): Promise<RegisterResponse> {
    return apiService.post<RegisterResponse>('/auth/register', userData);
  }

  // Logout user
  async logout(): Promise<{ success: boolean; message: string }> {
    return apiService.post<{ success: boolean; message: string }>('/auth/logout', {});
  }

  // Get current user
  async getCurrentUser(): Promise<AuthResponse> {
    return apiService.get<AuthResponse>('/auth/me');
  }

  // Update wallet address
  async updateWalletAddress(address_wallet: string): Promise<AuthResponse> {
    return apiService.put<AuthResponse>('/auth/wallet', { address_wallet });
  }

  // Store token in localStorage
  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  // Get token from localStorage
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Remove token from localStorage
  removeToken(): void {
    localStorage.removeItem('token');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
export default authService; 