import React from 'react';
import { InputProps } from '../../../types';
import './Input.css';

const Input: React.FC<InputProps> = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  label,
  error,
  required = false,
  icon,
}) => {
  const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="input-container">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      <div className="input-wrapper">
        {icon && <div className="input-icon">{icon}</div>}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`input ${error ? 'input--error' : ''} ${icon ? 'input--with-icon' : ''}`}
          required={required}
        />
      </div>
      {error && <div className="input-error">{error}</div>}
    </div>
  );
};

export default Input; 