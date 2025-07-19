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
          time_start: session.time_start,
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

  // Buy NFT without deducting balance immediately
  static async buyNFTWithoutDeduction(req, res) {
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
        
        // Transfer NFT ownership without deducting balance
        await connection.execute(
          'UPDATE nfts SET owner_id = ?, updated_at = NOW() WHERE id = ?',
          [userId, nftId]
        );
        
        // Create pending transaction record (balance will be deducted later)
        await connection.execute(`
          INSERT INTO nft_transactions (nft_id, buyer_id, seller_id, price, transaction_type, status, created_at)
          VALUES (?, ?, ?, ?, 'buy', 'pending', NOW())
        `, [nftId, userId, nft.owner_id, nft.price]);
        
        await connection.commit();
        
        res.json({
          success: true,
          message: 'Mua NFT thành công! Thanh toán sẽ được thực hiện sau.',
          data: {
            nft_id: nftId,
            price: nft.price,
            status: 'pending_payment'
          }
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error buying NFT without deduction:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Process pending payments (checkout)
  static async processPendingPayments(req, res) {
    try {
      const userId = req.user.id;
      
      const connection = await require('../config/database').pool.getConnection();
      
      try {
        await connection.beginTransaction();
        
        // Get user's pending transactions
        const [pendingTransactions] = await connection.execute(`
          SELECT nt.*, n.name as nft_name
          FROM nft_transactions nt
          JOIN nfts n ON nt.nft_id = n.id
          WHERE nt.buyer_id = ? AND nt.status = 'pending'
          ORDER BY nt.created_at ASC
        `, [userId]);
        
        if (pendingTransactions.length === 0) {
          return res.json({
            success: true,
            message: 'Không có giao dịch nào cần thanh toán',
            data: { processed_count: 0 }
          });
        }
        
        // Calculate total amount needed
        const totalAmount = pendingTransactions.reduce((sum, transaction) => {
          return sum + parseFloat(transaction.price);
        }, 0);
        
        // Get user's current balance
        const [userRows] = await connection.execute(
          'SELECT balance FROM users WHERE id = ?',
          [userId]
        );
        
        if (userRows.length === 0) {
          throw new Error('Người dùng không tồn tại');
        }
        
        const userBalance = parseFloat(userRows[0].balance);
        
        if (userBalance < totalAmount) {
          throw new Error(`Số dư không đủ để thanh toán. Cần: ${totalAmount}, Có: ${userBalance}`);
        }
        
        // Process each pending transaction
        for (const transaction of pendingTransactions) {
          const price = parseFloat(transaction.price);
          
          // Deduct balance from buyer
          await connection.execute(
            'UPDATE users SET balance = balance - ? WHERE id = ?',
            [price, userId]
          );
          
          // Add balance to seller
          await connection.execute(
            'UPDATE users SET balance = balance + ? WHERE id = ?',
            [price, transaction.seller_id]
          );
          
          // Update transaction status to completed
          await connection.execute(
            'UPDATE nft_transactions SET status = ? WHERE id = ?',
            ['completed', transaction.id]
          );
        }
        
        await connection.commit();
        
        res.json({
          success: true,
          message: `Thanh toán thành công ${pendingTransactions.length} giao dịch!`,
          data: {
            processed_count: pendingTransactions.length,
            total_amount: totalAmount,
            new_balance: userBalance - totalAmount
          }
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error processing pending payments:', error);
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

  // Get all sessions (admin only)
  static async getAllSessions(req, res) {
    try {
      const sessions = await Session.getAllSessions();
      
      res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      console.error('Error getting all sessions:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update session time (admin only)
  static async updateSessionTime(req, res) {
    try {
      const { sessionId } = req.params;
      const { time_start } = req.body;
      
      if (!time_start) {
        return res.status(400).json({
          success: false,
          message: 'Time start is required'
        });
      }
      
      const success = await Session.updateSessionTime(sessionId, time_start);
      
      if (success) {
        res.json({
          success: true,
          message: 'Session time updated successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Session not found or could not be updated'
        });
      }
    } catch (error) {
      console.error('Error updating session time:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update session registration fee (admin only)
  static async updateSessionFee(req, res) {
    try {
      const { sessionId } = req.params;
      const { registration_fee } = req.body;
      
      if (!registration_fee || isNaN(registration_fee)) {
        return res.status(400).json({
          success: false,
          message: 'Valid registration fee is required'
        });
      }
      
      const success = await Session.updateSessionFee(sessionId, registration_fee);
      
      if (success) {
        res.json({
          success: true,
          message: 'Session registration fee updated successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Session not found or could not be updated'
        });
      }
    } catch (error) {
      console.error('Error updating session fee:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get session by ID (admin only)
  static async getSessionById(req, res) {
    try {
      const { sessionId } = req.params;
      
      const session = await Session.getSessionById(sessionId);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }
      
      res.json({
        success: true,
        data: session
      });
    } catch (error) {
      console.error('Error getting session by ID:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create new session (admin only)
  static async createSession(req, res) {
    try {
      const { session_date, time_start, registration_fee } = req.body;
      
      // Validation
      if (!session_date) {
        return res.status(400).json({
          success: false,
          message: 'Session date is required'
        });
      }
      
      // Check if session for this date already exists
      const existingSession = await Session.getTodaySession();
      if (existingSession && existingSession.session_date === session_date) {
        return res.status(400).json({
          success: false,
          message: 'Session for this date already exists'
        });
      }
      
      const sessionId = await Session.createSession({
        session_date,
        time_start,
        registration_fee
      });
      
      const newSession = await Session.getSessionById(sessionId);
      
      res.status(201).json({
        success: true,
        message: 'Session created successfully',
        data: newSession
      });
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update session (admin only)
  static async updateSession(req, res) {
    try {
      const { sessionId } = req.params;
      const { session_date, time_start, status, registration_fee } = req.body;
      
      // Check if session exists
      const existingSession = await Session.getSessionById(sessionId);
      if (!existingSession) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }
      
      const success = await Session.updateSession(sessionId, {
        session_date,
        time_start,
        status,
        registration_fee
      });
      
      if (success) {
        const updatedSession = await Session.getSessionById(sessionId);
        res.json({
          success: true,
          message: 'Session updated successfully',
          data: updatedSession
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to update session'
        });
      }
    } catch (error) {
      console.error('Error updating session:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete session (admin only)
  static async deleteSession(req, res) {
    try {
      const { sessionId } = req.params;
      
      // Check if session exists
      const existingSession = await Session.getSessionById(sessionId);
      if (!existingSession) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }
      
      const success = await Session.deleteSession(sessionId);
      
      if (success) {
        res.json({
          success: true,
          message: 'Session deleted successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to delete session'
        });
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get sessions with pagination (admin only)
  static async getSessionsWithPagination(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const result = await Session.getSessionsWithPagination(page, limit);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting sessions with pagination:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get available sessions (for users)
  static async getAvailableSessions(req, res) {
    try {
      const sessions = await Session.getAvailableSessions();
      
      res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      console.error('Error getting available sessions:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Register user for specific session
  static async registerForSpecificSession(req, res) {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;
      
      const registration = await Session.registerUserForSession(userId, sessionId);
      
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
      console.error('Error registering for specific session:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get user's session registrations
  static async getUserSessionRegistrations(req, res) {
    try {
      const userId = req.user.id;
      
      const registrations = await Session.getUserSessionRegistrations(userId);
      
      res.json({
        success: true,
        data: registrations
      });
    } catch (error) {
      console.error('Error getting user session registrations:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Check if user is registered for specific session
  static async checkUserRegistrationForSession(req, res) {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;
      
      const isRegistered = await Session.isUserRegisteredForSession(userId, sessionId);
      
      res.json({
        success: true,
        data: {
          is_registered: isRegistered
        }
      });
    } catch (error) {
      console.error('Error checking user registration for session:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = SessionController; 


