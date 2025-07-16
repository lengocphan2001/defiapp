const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const authMiddleware = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticateToken);

// Create a new request (deposit or withdraw)
router.post('/', requestController.createRequest);

// Get user's requests
router.get('/my-requests', requestController.getUserRequests);

// Get specific request by ID
router.get('/:id', requestController.getRequestById);

// Update request status (admin only)
router.patch('/:id/status', requestController.updateRequestStatus);

// Get all requests (admin only)
router.get('/admin/all', requestController.getAllRequests);

// Get pending requests (admin only)
router.get('/admin/pending', requestController.getPendingRequests);

module.exports = router; 