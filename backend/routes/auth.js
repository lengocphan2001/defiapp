const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { loginValidation, registerValidation, handleValidationErrors } = require('../utils/validation');
const { register, login, getCurrentUser, logout, updateWalletAddress } = require('../controllers/authController');

// Register route
router.post('/register', registerValidation, handleValidationErrors, register);

// Login route
router.post('/login', loginValidation, handleValidationErrors, login);

// Get current user (protected route)
router.get('/me', authenticateToken, getCurrentUser);

// Update wallet address (protected route)
router.put('/wallet', authenticateToken, updateWalletAddress);

// Logout route
router.post('/logout', authenticateToken, logout);

module.exports = router; 