import React, { forwardRef, useState } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import './PasswordInput.css';

interface PasswordInputProps {
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  icon?: React.ReactNode;
  register?: UseFormRegisterReturn;
  className?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, placeholder, required = false, error, icon, register, className = '' }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = `password-input-${Math.random().toString(36).substr(2, 9)}`;

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    return (
      <div className={`password-input-container ${className}`}>
        {label && (
          <label htmlFor={inputId} className="password-input-label">
            {label}
            {required && <span className="password-input-required">*</span>}
          </label>
        )}
        <div className="password-input-wrapper">
          {icon && <div className="password-input-icon">{icon}</div>}
          <input
            id={inputId}
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            placeholder={placeholder}
            className={`password-input ${error ? 'password-input--error' : ''} ${icon ? 'password-input--with-icon' : ''}`}
            {...register}
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {error && <div className="password-input-error">{error}</div>}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput; 