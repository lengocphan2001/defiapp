import * as yup from 'yup';

// Login form validation schema
export const loginSchema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(50, 'Password must be less than 50 characters'),
});

// Register form validation schema
export const registerSchema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  referral: yup
    .string()
    .transform((value) => (value === '' ? undefined : value))
    .test('referral-validation', 'Referral code must be at least 3 characters', function(value) {
      if (value === undefined || value === null || value === '') {
        return true; // Optional field, no validation needed
      }
      return value.length >= 3;
    }),
  phone: yup
    .string()
    .required('Phone number is required')
    .matches(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(50, 'Password must be less than 50 characters'),
  repassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
});

// Explicit interfaces that match react-hook-form expectations
export interface LoginFormData {
  username: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  referral?: string;
  phone: string;
  password: string;
  repassword: string;
}

// Type assertion to ensure schema matches our interface
export const typedLoginSchema = loginSchema as yup.ObjectSchema<LoginFormData>;
export const typedRegisterSchema = registerSchema as yup.ObjectSchema<RegisterFormData>; 