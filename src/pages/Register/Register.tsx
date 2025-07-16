import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button, FormInput, PasswordInput } from '../../components/common';
import { typedRegisterSchema, RegisterFormData } from '../../utils/schemas';
import { useApi } from '../../hooks/useApi';
import { authService } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import './Register.css';

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

const PhoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const GiftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20,12 20,22 4,22 4,12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12,7H7.5a2.5,2.5,0,0,1,0-5C11,2,12,7,12,7Z" />
    <path d="M12,7h4.5a2.5,2.5,0,0,0,0-5C13,2,12,7,12,7Z" />
  </svg>
);

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(typedRegisterSchema),
    mode: 'onChange',
  });

  const { execute: registerUser, loading, error: apiError } = useApi(authService.register);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const response = await registerUser(data);
      
      if (response.success) {
        // Use auth context to login
        login(response.data.token, response.data.user);
        
        // Show success message
        console.log('Registration successful:', response.message);
        
        // Redirect to home page
        navigate('/');
      }
    } catch (error) {
      // Error is handled by useApi hook
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container register-container">
        <div className="auth-header">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join us and start your journey today</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <FormInput
            label="Username"
            placeholder="Choose a username"
            type="text"
            required
            icon={<UserIcon />}
            error={errors.username?.message}
            register={register('username')}
          />

          <FormInput
            label="Referral Code (Optional)"
            placeholder="Enter referral code (optional)"
            type="text"
            icon={<GiftIcon />}
            error={errors.referral?.message}
            register={register('referral')}
          />

          <FormInput
            label="Phone Number"
            placeholder="Enter your phone number"
            type="tel"
            required
            icon={<PhoneIcon />}
            error={errors.phone?.message}
            register={register('phone')}
          />

          <PasswordInput
            label="Password"
            placeholder="Create a strong password"
            required
            icon={<LockIcon />}
            error={errors.password?.message}
            register={register('password')}
          />

          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm your password"
            required
            icon={<LockIcon />}
            error={errors.repassword?.message}
            register={register('repassword')}
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="auth-footer">
          <p className="auth-footer-text">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register; 