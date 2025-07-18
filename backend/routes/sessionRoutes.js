const express = require('express');
const router = express.Router();
const SessionController = require('../controllers/sessionController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public routes (no auth required)
router.get('/today', SessionController.getTodaySession);

// Protected routes (auth required)
router.use(authMiddleware);

// User session routes
router.post('/register', SessionController.registerForSession);
router.get('/check-registration', SessionController.checkRegistration);
router.get('/available-nfts', SessionController.getAvailableNFTs);
router.post('/buy-nft/:nftId', SessionController.buyNFT);
router.get('/transaction-history', SessionController.getTransactionHistory);

// Admin routes (require both auth and admin privileges)
router.get('/stats', adminMiddleware, SessionController.getSessionStats);
router.get('/registered-users', adminMiddleware, SessionController.getRegisteredUsers);
router.post('/close', adminMiddleware, SessionController.closeSession);

module.exports = router; 