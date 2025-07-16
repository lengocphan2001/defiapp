const { body, validationResult } = require('express-validator');

// Validation rules for login
const loginValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

// Validation rules for register
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('referral')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Referral code must be at least 3 characters long'),
  
  body('phone')
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number'),
  
  body('password')
    .isLength({ min: 6, max: 50 })
    .withMessage('Password must be between 6 and 50 characters long'),
  
  body('repassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

// Validation for request creation
const validateRequest = (data) => {
  const errors = [];

  // Validate type
  if (!data.type || !['deposit', 'withdraw'].includes(data.type)) {
    errors.push({
      field: 'type',
      message: 'Type must be either deposit or withdraw'
    });
  }

  // Validate smp_amount
  if (!data.smp_amount || isNaN(data.smp_amount) || parseFloat(data.smp_amount) <= 0) {
    errors.push({
      field: 'smp_amount',
      message: 'SMP amount must be a positive number'
    });
  }

  // Validate usdt_amount
  if (!data.usdt_amount || isNaN(data.usdt_amount) || parseFloat(data.usdt_amount) <= 0) {
    errors.push({
      field: 'usdt_amount',
      message: 'USDT amount must be a positive number'
    });
  }

  // Validate address_wallet
  if (!data.address_wallet || data.address_wallet.trim().length === 0) {
    errors.push({
      field: 'address_wallet',
      message: 'Wallet address is required'
    });
  } else if (data.address_wallet.trim().length < 10) {
    errors.push({
      field: 'address_wallet',
      message: 'Wallet address must be at least 10 characters long'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }))
    });
  }
  next();
};

// Generate unique referral code
const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

module.exports = {
  loginValidation,
  registerValidation,
  validateRequest,
  handleValidationErrors,
  generateReferralCode
}; 