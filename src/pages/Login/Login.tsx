import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button, FormInput, PasswordInput } from '../../components/common';
import { typedLoginSchema, LoginFormData } from '../../utils/schemas';
import { useApi } from '../../hooks/useApi';
import { authService } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

// Icon components
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <circle cx="12" cy="16" r="1" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(typedLoginSchema),
    mode: 'onChange',
  });

  const { execute: loginApi, loading, error: apiError } = useApi(authService.login);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await loginApi(data);
      
      if (response.success) {
        // Use auth context to login
        login(response.data.token, response.data.user);
        
        // Show success message
        console.log('Login successful:', response.message);
        
        // Redirect based on user role
        if (response.data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      // Error is handled by useApi hook
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your account to continue</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <FormInput
            label="Username"
            placeholder="Enter your username"
            type="text"
            required
            icon={<UserIcon />}
            error={errors.username?.message}
            register={register('username')}
          />

          <PasswordInput
            label="Password"
            placeholder="Enter your password"
            required
            icon={<LockIcon />}
            error={errors.password?.message}
            register={register('password')}
          />

          {apiError && (
            <div className="auth-error">
              {apiError}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="large"
            disabled={loading}
            className="auth-submit-btn"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <div className="auth-footer">
          <p className="auth-footer-text">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 