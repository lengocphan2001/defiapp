import React, { forwardRef } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import './FormInput.css';

interface FormInputProps {
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  required?: boolean;
  error?: string;
  icon?: React.ReactNode;
  register?: UseFormRegisterReturn;
  className?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, placeholder, type = 'text', required = false, error, icon, register, className = '' }, ref) => {
    const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={`form-input-container ${className}`}>
        {label && (
          <label htmlFor={inputId} className="form-input-label">
            {label}
            {required && <span className="form-input-required">*</span>}
          </label>
        )}
        <div className="form-input-wrapper">
          {icon && <div className="form-input-icon">{icon}</div>}
          <input
            id={inputId}
            ref={ref}
            type={type}
            placeholder={placeholder}
            className={`form-input ${error ? 'form-input--error' : ''} ${icon ? 'form-input--with-icon' : ''}`}
            {...register}
          />
        </div>
        {error && <div className="form-input-error">{error}</div>}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export default FormInput; 