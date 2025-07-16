// Validation utilities for forms

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Username validation
export const validateUsername = (username: string): string | null => {
  if (!username.trim()) {
    return 'Username is required';
  }
  if (username.length < 3) {
    return 'Username must be at least 3 characters';
  }
  if (username.length > 20) {
    return 'Username must be less than 20 characters';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Username can only contain letters, numbers, and underscores';
  }
  return null;
};

// Password validation
export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  if (password.length > 50) {
    return 'Password must be less than 50 characters';
  }
  return null;
};

// Phone validation
export const validatePhone = (phone: string): string | null => {
  if (!phone.trim()) {
    return 'Phone number is required';
  }
  // Basic phone validation - can be customized based on your requirements
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return 'Please enter a valid phone number';
  }
  return null;
};

// Referral validation
export const validateReferral = (referral: string): string | null => {
  if (!referral.trim()) {
    return 'Referral code is required';
  }
  if (referral.length < 3) {
    return 'Referral code must be at least 3 characters';
  }
  return null;
};

// Login form validation
export const validateLoginForm = (data: { username: string; password: string }): ValidationResult => {
  const errors: Record<string, string> = {};

  const usernameError = validateUsername(data.username);
  if (usernameError) errors.username = usernameError;

  const passwordError = validatePassword(data.password);
  if (passwordError) errors.password = passwordError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Register form validation
export const validateRegisterForm = (data: {
  username: string;
  referral: string;
  phone: string;
  password: string;
  repassword: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  const usernameError = validateUsername(data.username);
  if (usernameError) errors.username = usernameError;

  const referralError = validateReferral(data.referral);
  if (referralError) errors.referral = referralError;

  const phoneError = validatePhone(data.phone);
  if (phoneError) errors.phone = phoneError;

  const passwordError = validatePassword(data.password);
  if (passwordError) errors.password = passwordError;

  if (data.password !== data.repassword) {
    errors.repassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}; 