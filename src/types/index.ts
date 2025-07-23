// Common types used throughout the application

export interface User {
  id: number;
  username: string;
  phone: string;
  fullname: string | null;
  referral_code: string;
  referred_by: string | null;
  balance: string;
  address_wallet: string | null;
  status: 'active' | 'inactive';
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Authentication types - imported from schemas to ensure consistency
export type { LoginFormData, RegisterFormData } from '../utils/schemas';

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

// Component props types
export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
}

export interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  label?: string;
  error?: string;
  required?: boolean;
  icon?: React.ReactNode;
}

// NFT types
export interface NFT {
  id: string;
  name: string;
  owner_id: number;
  owner_name: string;
  price: string;
  type: 'buy' | 'sell';
  status: 'available' | 'sold' | 'cancelled';
  payment_status?: 'pending' | 'completed' | 'unpaid';
  session_id: number;
  created_at: string;
  updated_at: string;
}

export interface CreateNFTData {
  name: string;
  price: number;
  type?: 'sell' | 'buy';
}

export interface UpdateNFTData {
  price?: number;
  status?: 'available' | 'sold' | 'cancelled';
}

export interface NFTStats {
  totalNFTs: number;
  availableNFTs: number;
  soldNFTs: number;
  totalValue: number;
}

// Session types
export interface Session {
  id: number;
  session_date: string;
  time_start: string;
  status: string;
  registration_fee: number;
  registration_count: number;
  total_fees: number;
  created_at: string;
  updated_at: string;
}

export interface SessionRegistration {
  id: number;
  session_id: number;
  user_id: number;
  registration_fee: number;
  status: string;
  registered_at: string;
  session_date: string;
  time_start: string;
  session_status: string;
} 