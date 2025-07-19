const NFT = require('../models/NFT');

const nftController = {
  // Create new NFT
  async createNFT(req, res) {
    try {
      const { name, price, type = 'sell' } = req.body;
      const owner_id = req.user.id;

      // Validate input
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'NFT name is required'
        });
      }

      if (!price || isNaN(price) || parseFloat(price) < 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid price is required'
        });
      }

      // Validate type
      if (type && !['sell', 'buy'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Type must be either "sell" or "buy"'
        });
      }

      const nftData = {
        name: name.trim(),
        owner_id,
        price: parseFloat(price),
        type
      };

      const newNFT = await NFT.create(nftData);

      res.status(201).json({
        success: true,
        message: 'NFT created successfully',
        data: newNFT
      });

    } catch (error) {
      console.error('Error creating NFT:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get all available NFTs
  async getAllAvailable(req, res) {
    try {
      const nfts = await NFT.getAllAvailable();

      res.json({
        success: true,
        data: nfts
      });

    } catch (error) {
      console.error('Error fetching available NFTs:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get all NFTs (admin only)
  async getAllNFTs(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const nfts = await NFT.getAll();

      res.json({
        success: true,
        data: nfts
      });

    } catch (error) {
      console.error('Error fetching all NFTs:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get NFT by ID
  async getNFTById(req, res) {
    try {
      const { id } = req.params;

      const nft = await NFT.findById(id);

      if (!nft) {
        return res.status(404).json({
          success: false,
          message: 'NFT not found'
        });
      }

      res.json({
        success: true,
        data: nft
      });

    } catch (error) {
      console.error('Error fetching NFT:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get user's NFTs
  async getUserNFTs(req, res) {
    try {
      const userId = req.user.id;
      const nfts = await NFT.findByOwnerId(userId);

      res.json({
        success: true,
        data: nfts
      });

    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Update NFT price
  async updateNFTPrice(req, res) {
    try {
      const { id } = req.params;
      const { price } = req.body;
      const userId = req.user.id;

      // Validate price
      if (!price || isNaN(price) || parseFloat(price) < 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid price is required'
        });
      }

      // Check if NFT exists and belongs to user
      const nft = await NFT.findById(id);
      if (!nft) {
        return res.status(404).json({
          success: false,
          message: 'NFT not found'
        });
      }

      if (nft.owner_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own NFTs'
        });
      }

      const success = await NFT.updatePrice(id, parseFloat(price));

      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to update NFT price'
        });
      }

      res.json({
        success: true,
        message: 'NFT price updated successfully'
      });

    } catch (error) {
      console.error('Error updating NFT price:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Update NFT status
  async updateNFTStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      // Validate status
      if (!status || !['available', 'sold', 'cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Valid status is required (available, sold, cancelled)'
        });
      }

      // Check if NFT exists and belongs to user
      const nft = await NFT.findById(id);
      if (!nft) {
        return res.status(404).json({
          success: false,
          message: 'NFT not found'
        });
      }

      if (nft.owner_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own NFTs'
        });
      }

      const success = await NFT.updateStatus(id, status);

      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to update NFT status'
        });
      }

      res.json({
        success: true,
        message: 'NFT status updated successfully'
      });

    } catch (error) {
      console.error('Error updating NFT status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Pay for specific NFT
  async payNFT(req, res) {
    try {
      const { id } = req.params;
      const { price } = req.body;
      const userId = req.user.id;

      // Validate price
      if (!price || isNaN(price) || parseFloat(price) < 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid price is required'
        });
      }

      const connection = await require('../config/database').pool.getConnection();
      
      try {
        await connection.beginTransaction();

        // Check if NFT exists and get its details
        const [nftRows] = await connection.execute(
          'SELECT * FROM nfts WHERE id = ?',
          [id]
        );

        if (nftRows.length === 0) {
          throw new Error('NFT không tồn tại');
        }

        const nft = nftRows[0];

        // Check if user owns this NFT
        if (nft.owner_id !== userId) {
          throw new Error('Bạn không sở hữu NFT này');
        }

        // Check if there's a pending transaction for this NFT
        const [pendingTransactions] = await connection.execute(`
          SELECT * FROM nft_transactions 
          WHERE nft_id = ? AND buyer_id = ? AND status = 'pending'
        `, [id, userId]);

        if (pendingTransactions.length === 0) {
          throw new Error('Không có giao dịch nào cần thanh toán cho NFT này');
        }

        const transaction = pendingTransactions[0];
        const transactionPrice = parseFloat(transaction.price);

        // Check user balance
        const [userRows] = await connection.execute(
          'SELECT balance FROM users WHERE id = ?',
          [userId]
        );

        if (userRows.length === 0) {
          throw new Error('Người dùng không tồn tại');
        }

        const userBalance = parseFloat(userRows[0].balance);

        if (userBalance < transactionPrice) {
          throw new Error(`Số dư không đủ để thanh toán. Cần: ${transactionPrice}, Có: ${userBalance}`);
        }

        // Process the payment
        // Deduct balance from buyer
        await connection.execute(
          'UPDATE users SET balance = balance - ? WHERE id = ?',
          [transactionPrice, userId]
        );

        // Add balance to seller
        await connection.execute(
          'UPDATE users SET balance = balance + ? WHERE id = ?',
          [transactionPrice, transaction.seller_id]
        );

        // Update transaction status to completed
        await connection.execute(
          'UPDATE nft_transactions SET status = ? WHERE id = ?',
          ['completed', transaction.id]
        );

        // Update NFT payment status
        await connection.execute(
          'UPDATE nfts SET payment_status = ? WHERE id = ?',
          ['completed', id]
        );

        await connection.commit();

        res.json({
          success: true,
          message: 'Thanh toán NFT thành công!',
          data: {
            nft_id: id,
            amount_paid: transactionPrice,
            new_balance: userBalance - transactionPrice
          }
        });

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('Error paying NFT:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Delete NFT
  async deleteNFT(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if NFT exists and belongs to user
      const nft = await NFT.findById(id);
      if (!nft) {
        return res.status(404).json({
          success: false,
          message: 'NFT not found'
        });
      }

      if (nft.owner_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own NFTs'
        });
      }

      const success = await NFT.delete(id);

      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to delete NFT'
        });
      }

      res.json({
        success: true,
        message: 'NFT deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting NFT:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get NFT statistics
  async getNFTStats(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const stats = await NFT.getStats();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error fetching NFT stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
};

module.exports = nftController; 