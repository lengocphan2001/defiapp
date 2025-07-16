const { pool } = require('../config/database');

const userController = {
  // Get all users (admin only)
  async getAllUsers(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const query = `
        SELECT id, username, phone, balance, address_wallet, created_at, updated_at
        FROM users 
        ORDER BY created_at DESC
      `;
      
      const [rows] = await pool.execute(query);
      
      res.json({
        success: true,
        data: rows
      });

    } catch (error) {
      console.error('Error fetching all users:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get user by ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if user owns this account or is admin
      if (parseInt(id) !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const query = 'SELECT id, username, phone, balance, address_wallet, created_at, updated_at FROM users WHERE id = ?';
      const [rows] = await pool.execute(query, [id]);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: rows[0]
      });

    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Update user balance (admin only)
  async updateUserBalance(req, res) {
    try {
      const { id } = req.params;
      const { amount } = req.body;

      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      // Validate amount
      if (!amount || isNaN(amount) || parseFloat(amount) < 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid amount. Must be a positive number.'
        });
      }

      // First check if user exists
      const checkQuery = 'SELECT id, balance FROM users WHERE id = ?';
      const [userRows] = await pool.execute(checkQuery, [id]);

      if (userRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const currentBalance = parseFloat(userRows[0].balance);
      const newBalance = currentBalance + parseFloat(amount);

      // Update user balance
      const updateQuery = 'UPDATE users SET balance = ?, updated_at = NOW() WHERE id = ?';
      const [result] = await pool.execute(updateQuery, [newBalance, id]);

      if (result.affectedRows === 0) {
        return res.status(400).json({
          success: false,
          message: 'Failed to update user balance'
        });
      }

      res.json({
        success: true,
        message: 'User balance updated successfully',
        data: {
          userId: id,
          previousBalance: currentBalance,
          newBalance: newBalance,
          amountAdded: parseFloat(amount)
        }
      });

    } catch (error) {
      console.error('Error updating user balance:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Update user status (admin only)
  async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      // Validate status
      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be active or inactive.'
        });
      }

      // Check if user exists
      const checkQuery = 'SELECT id FROM users WHERE id = ?';
      const [userRows] = await pool.execute(checkQuery, [id]);

      if (userRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update user status
      const updateQuery = 'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?';
      const [result] = await pool.execute(updateQuery, [status, id]);

      if (result.affectedRows === 0) {
        return res.status(400).json({
          success: false,
          message: 'Failed to update user status'
        });
      }

      res.json({
        success: true,
        message: 'User status updated successfully',
        data: {
          userId: id,
          status: status
        }
      });

    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get user statistics (admin only)
  async getUserStats(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      // Get various user statistics
      const statsQueries = {
        totalUsers: 'SELECT COUNT(*) as count FROM users',
        activeUsers: 'SELECT COUNT(*) as count FROM users WHERE status = "active"',
        totalBalance: 'SELECT SUM(balance) as total FROM users',
        todayRegistrations: 'SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURDATE()',
        monthlyRegistrations: 'SELECT COUNT(*) as count FROM users WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())'
      };

      const stats = {};
      
      for (const [key, query] of Object.entries(statsQueries)) {
        const [rows] = await pool.execute(query);
        stats[key] = rows[0].count || 0;
      }

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
};

module.exports = userController; 