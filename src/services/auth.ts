import { apiService } from './api';
import { LoginFormData, RegisterFormData, AuthResponse } from '../types';

class AuthService {
  // Login user
  async login(credentials: LoginFormData): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/auth/login', credentials);
  }

  // Register user
  async register(userData: RegisterFormData): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/auth/register', userData);
  }

  // Logout user
  async logout(): Promise<{ message: string }> {
    return apiService.post<{ message: string }>('/auth/logout', {});
  }

  // Get current user
  async getCurrentUser(): Promise<AuthResponse> {
    return apiService.get<AuthResponse>('/auth/me');
  }

  // Refresh token
  async refreshToken(): Promise<{ token: string }> {
    return apiService.post<{ token: string }>('/auth/refresh', {});
  }
}

export const authService = new AuthService();
export default authService; 