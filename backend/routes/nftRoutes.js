const express = require('express');
const router = express.Router();
const nftController = require('../controllers/nftController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create new NFT
router.post('/', nftController.createNFT);

// Get all available NFTs (public)
router.get('/available', nftController.getAllAvailable);

// Get all NFTs (admin only)
router.get('/admin/all', nftController.getAllNFTs);

// Get user's NFTs (must come before /:id route)
router.get('/user/my', nftController.getUserNFTs);

// Get user's selling NFTs (NFTs listed for sale)
router.get('/user/selling', nftController.getUserSellingNFTs);

// Get NFT by ID
router.get('/:id', nftController.getNFTById);

// Update NFT price
router.patch('/:id/price', nftController.updateNFTPrice);

// Update NFT status
router.patch('/:id/status', nftController.updateNFTStatus);

// Pay for specific NFT
router.post('/:id/pay', nftController.payNFT);

// Sell NFT (set for next day session)
router.post('/:id/sell', nftController.sellNFT);

// Open NFT (refund 90% and cancel)
router.post('/:id/open', nftController.openNFT);

// Delete NFT
router.delete('/:id', nftController.deleteNFT);

// Get NFT statistics (admin only)
router.get('/admin/stats', nftController.getNFTStats);

module.exports = router; 