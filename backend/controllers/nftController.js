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

      // Get today's session
      const Session = require('../models/Session');
      const todaySession = await Session.getTodaySession();
      
      if (!todaySession) {
        return res.status(400).json({
          success: false,
          message: 'Không có phiên giao dịch nào cho hôm nay. Vui lòng liên hệ admin để tạo phiên.'
        });
      }

      const nftData = {
        name: name.trim(),
        owner_id,
        price: parseFloat(price),
        type,
        session_id: todaySession.id
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

  // Get user's selling NFTs (NFTs listed for sale)
  async getUserSellingNFTs(req, res) {
    try {
      const userId = req.user.id;
      
      const connection = await require('../config/database').pool.getConnection();
      
      try {
        const [nfts] = await connection.execute(`
          SELECT n.*, u.username as owner_name 
          FROM nfts n 
          JOIN users u ON n.owner_id = u.id 
          WHERE n.owner_id = ? 
            AND n.type = 'sell' 
            AND n.status = 'available'
          ORDER BY n.created_at DESC
        `, [userId]);

        res.json({
          success: true,
          data: nfts
        });

      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('Error fetching user selling NFTs:', error);
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

        // Create SMP transaction record directly in the same transaction
        await connection.execute(`
          INSERT INTO smp_transactions (
            from_user_id, to_user_id, amount, transaction_type, 
            description, reference_id, reference_type, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
          userId,
          transaction.seller_id,
          transactionPrice,
          'nft_payment',
          `Payment for NFT ${id}`,
          transaction.id.toString(),
          'nft_transaction',
          'completed'
        ]);

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

  // Sell NFT (set for next day session)
  async sellNFT(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const connection = await require('../config/database').pool.getConnection();
      
      try {
        await connection.beginTransaction();

        // Check if NFT exists and belongs to user
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

        // Check if NFT is paid
        if (nft.payment_status !== 'completed') {
          throw new Error('NFT chưa được thanh toán. Vui lòng thanh toán trước khi bán.');
        }

        // Get next day's session
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDate = tomorrow.toISOString().split('T')[0];

        const [sessionRows] = await connection.execute(
          'SELECT * FROM sessions WHERE session_date = ?',
          [tomorrowDate]
        );

        if (sessionRows.length === 0) {
          throw new Error('Không có phiên giao dịch cho ngày mai. Vui lòng liên hệ admin.');
        }

        const nextDaySession = sessionRows[0];

        // Update NFT to be available for next day session
        await connection.execute(
          'UPDATE nfts SET session_id = ?, type = "sell", status = "available", updated_at = NOW() WHERE id = ?',
          [nextDaySession.id, id]
        );

        // Create SMP transaction for listing NFT for sale
        await connection.execute(`
          INSERT INTO smp_transactions (
            from_user_id, to_user_id, amount, transaction_type, 
            description, reference_id, reference_type, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
          userId,
          null, // No recipient for listing
          0, // No amount for listing
          'nft_sale',
          `Listed NFT ${id} for next day session`,
          id,
          'nft_transaction',
          'completed'
        ]);

        await connection.commit();

        res.json({
          success: true,
          message: 'NFT đã được đăng bán cho phiên giao dịch ngày mai!',
          data: {
            nft_id: id,
            next_session_date: tomorrowDate
          }
        });

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('Error selling NFT:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Open NFT (refund 90% and cancel)
  async openNFT(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const connection = await require('../config/database').pool.getConnection();
      
      try {
        await connection.beginTransaction();

        // Check if NFT exists and belongs to user
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

        // Check if NFT is paid
        if (nft.payment_status !== 'completed') {
          throw new Error('NFT chưa được thanh toán. Vui lòng thanh toán trước khi mở.');
        }

        // Calculate refund amount (90% of original price)
        const refundAmount = parseFloat(nft.price) * 0.9;

        // Add refund to user's balance
        await connection.execute(
          'UPDATE users SET balance = balance + ? WHERE id = ?',
          [refundAmount, userId]
        );

        // Update NFT status to cancelled
        await connection.execute(
          'UPDATE nfts SET type = "open", status = "cancelled", updated_at = NOW() WHERE id = ?',
          [id]
        );

        // Create SMP transaction for refund
        await connection.execute(`
          INSERT INTO smp_transactions (
            from_user_id, to_user_id, amount, transaction_type, 
            description, reference_id, reference_type, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
          null, // System refund
          userId,
          refundAmount,
          'refund',
          `Refund 90% for opening NFT ${id}`,
          id,
          'nft_transaction',
          'completed'
        ]);

        await connection.commit();

        res.json({
          success: true,
          message: `Đã mở NFT và hoàn tiền ${refundAmount.toFixed(2)} SMP (90% giá trị)!`,
          data: {
            nft_id: id,
            refund_amount: refundAmount,
            original_price: nft.price
          }
        });

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('Error opening NFT:', error);
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
  },

  // Update NFT owner (admin only)
  async updateNFTOwner(req, res) {
    try {
      const { id } = req.params;
      const { owner_id } = req.body;

      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      // Validate input
      if (!owner_id || isNaN(parseInt(owner_id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid owner_id is required'
        });
      }

      const connection = await require('../config/database').pool.getConnection();
      
      try {
        await connection.beginTransaction();

        // Check if NFT exists
        const [nftRows] = await connection.execute(
          'SELECT * FROM nfts WHERE id = ?',
          [id]
        );

        if (nftRows.length === 0) {
          throw new Error('NFT không tồn tại');
        }

        // Check if new owner exists
        const [userRows] = await connection.execute(
          'SELECT id, username FROM users WHERE id = ?',
          [owner_id]
        );

        if (userRows.length === 0) {
          throw new Error('Người dùng không tồn tại');
        }

        // Update NFT owner
        await connection.execute(
          'UPDATE nfts SET owner_id = ?, updated_at = NOW() WHERE id = ?',
          [owner_id, id]
        );

        await connection.commit();

        res.json({
          success: true,
          message: `Đã chuyển NFT cho người dùng ${userRows[0].username}`,
          data: {
            nft_id: id,
            new_owner_id: owner_id,
            new_owner_name: userRows[0].username
          }
        });

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('Error updating NFT owner:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = nftController; 