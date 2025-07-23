const express = require('express');
const router = express.Router();
const SMPTransactionController = require('../controllers/smpTransactionController');
const { authenticateToken } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authenticateToken);

// Get user's SMP transaction history
router.get('/user', SMPTransactionController.getUserTransactions);

// Get all SMP transactions (admin only)
router.get('/all', SMPTransactionController.getAllTransactions);

// Get SMP transactions by type
router.get('/type/:type', SMPTransactionController.getTransactionsByType);

// Get SMP transaction statistics (admin only)
router.get('/stats', SMPTransactionController.getTransactionStats);

// Get transactions by reference
router.get('/reference/:referenceType/:referenceId', SMPTransactionController.getTransactionsByReference);

// Create manual SMP transaction (admin only)
router.post('/create', SMPTransactionController.createManualTransaction);

module.exports = router; 