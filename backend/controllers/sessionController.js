const Session = require('../models/Session');

class SessionController {
  // Get today's session info
  static async getTodaySession(req, res) {
    try {
      const session = await Session.getTodaySession();
      
      res.json({
        success: true,
        data: {
          session_id: session.id,
          session_date: session.session_date,
          status: session.status,
          registration_fee: session.registration_fee
        }
      });
    } catch (error) {
      console.error('Error getting today session:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Register user for today's session
  static async registerForSession(req, res) {
    try {
      const userId = req.user.id;
      
      const registration = await Session.registerUser(userId);
      
      res.json({
        success: true,
        message: 'Đăng ký phiên thành công!',
        data: {
          registration_id: registration.id,
          session_id: registration.session_id,
          registration_fee: registration.registration_fee,
          registered_at: registration.registered_at
        }
      });
    } catch (error) {
      console.error('Error registering for session:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Check if user is registered for today's session
  static async checkRegistration(req, res) {
    try {
      const userId = req.user.id;
      
      const isRegistered = await Session.isUserRegistered(userId);
      const registration = isRegistered ? await Session.getUserRegistration(userId) : null;
      
      res.json({
        success: true,
        data: {
          is_registered: isRegistered,
          registration: registration
        }
      });
    } catch (error) {
      console.error('Error checking registration:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get session statistics (admin only)
  static async getSessionStats(req, res) {
    try {
      const stats = await Session.getSessionStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting session stats:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get registered users for today's session (admin only)
  static async getRegisteredUsers(req, res) {
    try {
      const users = await Session.getRegisteredUsers();
      
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Error getting registered users:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Close today's session (admin only)
  static async closeSession(req, res) {
    try {
      const success = await Session.closeTodaySession();
      
      if (success) {
        res.json({
          success: true,
          message: 'Phiên đã được đóng thành công'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Không thể đóng phiên'
        });
      }
    } catch (error) {
      console.error('Error closing session:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get available NFTs for registered users only
  static async getAvailableNFTs(req, res) {
    try {
      const userId = req.user.id;
      
      // Check if user is registered for today's session
      const isRegistered = await Session.isUserRegistered(userId);
      
      if (!isRegistered) {
        return res.status(403).json({
          success: false,
          message: 'Bạn cần đăng ký phiên để xem NFT khả dụng'
        });
      }
      
      // Get available NFTs (not owned by current user)
      const [nfts] = await require('../config/database').pool.execute(`
        SELECT n.*, u.username as owner_name 
        FROM nfts n 
        JOIN users u ON n.owner_id = u.id 
        WHERE n.owner_id != ? AND n.status = 'available'
        ORDER BY n.created_at DESC
      `, [userId]);
      
      res.json({
        success: true,
        data: nfts
      });
    } catch (error) {
      console.error('Error getting available NFTs:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Buy NFT
  static async buyNFT(req, res) {
    try {
      const userId = req.user.id;
      const { nftId } = req.params;
      
      // Check if user is registered for today's session
      const isRegistered = await Session.isUserRegistered(userId);
      
      if (!isRegistered) {
        return res.status(403).json({
          success: false,
          message: 'Bạn cần đăng ký phiên để mua NFT'
        });
      }
      
      const connection = await require('../config/database').pool.getConnection();
      
      try {
        await connection.beginTransaction();
        
        // Get NFT details
        const [nftRows] = await connection.execute(`
          SELECT n.*, u.username as owner_name 
          FROM nfts n 
          JOIN users u ON n.owner_id = u.id 
          WHERE n.id = ? AND n.status = 'available'
        `, [nftId]);
        
        if (nftRows.length === 0) {
          throw new Error('NFT không tồn tại hoặc đã được bán');
        }
        
        const nft = nftRows[0];
        
        // Check if user is trying to buy their own NFT
        if (nft.owner_id === userId) {
          throw new Error('Bạn không thể mua NFT của chính mình');
        }
        
        // Get user's current balance
        const [userRows] = await connection.execute(
          'SELECT balance FROM users WHERE id = ?',
          [userId]
        );
        
        if (userRows.length === 0) {
          throw new Error('Người dùng không tồn tại');
        }
        
        const userBalance = parseFloat(userRows[0].balance);
        const nftPrice = parseFloat(nft.price);
        
        if (userBalance < nftPrice) {
          throw new Error('Số dư không đủ để mua NFT này');
        }
        
        // Deduct balance from buyer
        await connection.execute(
          'UPDATE users SET balance = balance - ? WHERE id = ?',
          [nftPrice, userId]
        );
        
        // Add balance to seller
        await connection.execute(
          'UPDATE users SET balance = balance + ? WHERE id = ?',
          [nftPrice, nft.owner_id]
        );
        
        // Transfer NFT ownership
        await connection.execute(
          'UPDATE nfts SET owner_id = ?, updated_at = NOW() WHERE id = ?',
          [userId, nftId]
        );
        
        // Create transaction history record
        await connection.execute(`
          INSERT INTO nft_transactions (nft_id, buyer_id, seller_id, price, transaction_type, created_at)
          VALUES (?, ?, ?, ?, 'buy', NOW())
        `, [nftId, userId, nft.owner_id, nftPrice]);
        
        await connection.commit();
        
        res.json({
          success: true,
          message: 'Mua NFT thành công!',
          data: {
            nft_id: nftId,
            price: nftPrice,
            new_balance: userBalance - nftPrice
          }
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error buying NFT:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get user's transaction history
  static async getTransactionHistory(req, res) {
    try {
      const userId = req.user.id;
      
      const [transactions] = await require('../config/database').pool.execute(`
        SELECT 
          nt.id,
          nt.nft_id,
          n.name as nft_name,
          nt.price,
          nt.transaction_type,
          nt.created_at
        FROM nft_transactions nt
        JOIN nfts n ON nt.nft_id = n.id
        WHERE nt.buyer_id = ? OR nt.seller_id = ?
        ORDER BY nt.created_at DESC
        LIMIT 50
      `, [userId, userId]);
      
      res.json({
        success: true,
        data: transactions
      });
    } catch (error) {
      console.error('Error getting transaction history:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = SessionController; 