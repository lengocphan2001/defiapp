const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get all users (admin only)
router.get('/admin/all', userController.getAllUsers);

// Get user statistics (admin only)
router.get('/admin/stats', userController.getUserStats);

// Get user by ID (user can get their own data, admin can get any user)
router.get('/:id', userController.getUserById);

// Update user balance (admin only)
router.patch('/:id/balance', userController.updateUserBalance);

// Update user status (admin only)
router.patch('/:id/status', userController.updateUserStatus);

module.exports = router; 