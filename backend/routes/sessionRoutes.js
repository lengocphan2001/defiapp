const express = require('express');
const router = express.Router();
const SessionController = require('../controllers/sessionController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public routes (no auth required)
router.get('/today', SessionController.getTodaySession);
router.get('/available', SessionController.getAvailableSessions);

// Protected routes (auth required)
router.use(authMiddleware);

// User session routes
router.post('/register', SessionController.registerForSession);
router.get('/check-registration', SessionController.checkRegistration);
router.get('/available-nfts', SessionController.getAvailableNFTs);
router.post('/buy-nft/:nftId', SessionController.buyNFT);
router.post('/buy-nft-without-deduction/:nftId', SessionController.buyNFTWithoutDeduction);
router.post('/process-pending-payments', SessionController.processPendingPayments);
router.get('/transaction-history', SessionController.getTransactionHistory);
router.post('/register/:sessionId', SessionController.registerForSpecificSession);
router.get('/my-registrations', SessionController.getUserSessionRegistrations);
router.get('/check-registration/:sessionId', SessionController.checkUserRegistrationForSession);

// Admin routes (require both auth and admin privileges)
router.get('/stats', adminMiddleware, SessionController.getSessionStats);
router.get('/registered-users', adminMiddleware, SessionController.getRegisteredUsers);
router.post('/close', adminMiddleware, SessionController.closeSession);
router.get('/all', adminMiddleware, SessionController.getAllSessions);
router.get('/paginated', adminMiddleware, SessionController.getSessionsWithPagination);
router.get('/:sessionId', adminMiddleware, SessionController.getSessionById);
router.post('/', adminMiddleware, SessionController.createSession);
router.put('/:sessionId', adminMiddleware, SessionController.updateSession);
router.put('/:sessionId/time', adminMiddleware, SessionController.updateSessionTime);
router.put('/:sessionId/fee', adminMiddleware, SessionController.updateSessionFee);
router.delete('/:sessionId', adminMiddleware, SessionController.deleteSession);

module.exports = router; 