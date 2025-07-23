const SMPTransaction = require('../models/SMPTransaction');

class SMPTransactionController {
  // Get user's SMP transaction history
  static async getUserTransactions(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0 } = req.query;

      console.log(`Fetching SMP transactions for user ${userId}, limit: ${limit}, offset: ${offset}`);

      const transactions = await SMPTransaction.getByUserId(userId, limit, offset);

      console.log(`Successfully fetched ${transactions.length} SMP transactions for user ${userId}`);

      res.json({
        success: true,
        data: transactions
      });
    } catch (error) {
      console.error('Error fetching user SMP transactions:', error);
      console.error('Error stack:', error.stack);
      
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get all SMP transactions (admin only)
  static async getAllTransactions(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const { limit = 100, offset = 0 } = req.query;
      const transactions = await SMPTransaction.getAll(parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: transactions
      });
    } catch (error) {
      console.error('Error fetching all SMP transactions:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get SMP transactions by type
  static async getTransactionsByType(req, res) {
    try {
      const { type } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const transactions = await SMPTransaction.getByType(type, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: transactions
      });
    } catch (error) {
      console.error('Error fetching SMP transactions by type:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get SMP transaction statistics
  static async getTransactionStats(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const stats = await SMPTransaction.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching SMP transaction stats:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get transactions by reference (e.g., for a specific NFT transaction)
  static async getTransactionsByReference(req, res) {
    try {
      const { referenceId, referenceType } = req.params;

      const transactions = await SMPTransaction.getByReference(referenceId, referenceType);

      res.json({
        success: true,
        data: transactions
      });
    } catch (error) {
      console.error('Error fetching SMP transactions by reference:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create a manual SMP transaction (admin only)
  static async createManualTransaction(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const {
        from_user_id,
        to_user_id,
        amount,
        transaction_type,
        description,
        reference_id,
        reference_type
      } = req.body;

      // Validate required fields
      if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid amount is required'
        });
      }

      if (!transaction_type) {
        return res.status(400).json({
          success: false,
          message: 'Transaction type is required'
        });
      }

      const transactionData = {
        from_user_id: from_user_id || null,
        to_user_id: to_user_id || null,
        amount: parseFloat(amount),
        transaction_type,
        description: description || '',
        reference_id: reference_id || null,
        reference_type: reference_type || null
      };

      const newTransaction = await SMPTransaction.create(transactionData);

      res.status(201).json({
        success: true,
        message: 'SMP transaction created successfully',
        data: newTransaction
      });
    } catch (error) {
      console.error('Error creating manual SMP transaction:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = SMPTransactionController; 