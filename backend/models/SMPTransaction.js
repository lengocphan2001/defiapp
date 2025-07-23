const { pool } = require('../config/database');

class SMPTransaction {
  static async create(transactionData) {
    const {
      from_user_id,
      to_user_id,
      amount,
      transaction_type,
      description,
      reference_id = null,
      reference_type = null,
      status = 'completed'
    } = transactionData;

    const query = `
      INSERT INTO smp_transactions (
        from_user_id, to_user_id, amount, transaction_type, 
        description, reference_id, reference_type, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    try {
      const [result] = await pool.execute(query, [
        from_user_id,
        to_user_id,
        amount,
        transaction_type,
        description,
        reference_id,
        reference_type,
        status
      ]);

      return {
        id: result.insertId,
        from_user_id,
        to_user_id,
        amount,
        transaction_type,
        description,
        reference_id,
        reference_type,
        status,
        created_at: new Date()
      };
    } catch (error) {
      throw new Error(`Error creating SMP transaction: ${error.message}`);
    }
  }

  static async getByUserId(userId, limit = 50, offset = 0) {
    try {
      // Convert parameters to proper types and ensure they're valid
      const userIdInt = userId ? parseInt(userId) : 0;
      const limitInt = limit ? parseInt(limit) : 50;
      const offsetInt = offset ? parseInt(offset) : 0;
      
      // Validate parameters
      if (isNaN(userIdInt) || isNaN(limitInt) || isNaN(offsetInt)) {
        throw new Error('Invalid parameters provided');
      }

      // First, ensure the table exists
      await this.ensureTableExists();
      
      // Use a different approach - get all records and filter in JavaScript
      // This avoids the LIMIT/OFFSET parameter binding issue
      const query = `
        SELECT * FROM smp_transactions 
        WHERE from_user_id = ? OR to_user_id = ?
        ORDER BY created_at DESC
      `;
      
      const [allRows] = await pool.execute(query, [userIdInt, userIdInt]);
      
      // Apply pagination in JavaScript
      const startIndex = offsetInt;
      const endIndex = startIndex + limitInt;
      const rows = allRows.slice(startIndex, endIndex);
      
      return rows;
    } catch (error) {
      throw new Error(`Error fetching user SMP transactions: ${error.message}`);
    }
  }

  static async ensureTableExists() {
    try {
      // Check if table exists
      const [tables] = await pool.execute('SHOW TABLES LIKE "smp_transactions"');
      
      if (tables.length === 0) {
        // Create the table
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS smp_transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            from_user_id INT NULL,
            to_user_id INT NULL,
            amount DECIMAL(20, 8) NOT NULL,
            transaction_type ENUM('deposit', 'withdrawal', 'transfer', 'nft_payment', 'nft_sale', 'commission', 'refund') NOT NULL,
            description TEXT,
            reference_id VARCHAR(50) NULL,
            reference_type ENUM('nft_transaction', 'session_registration', 'deposit_request', 'withdrawal_request') NULL,
            status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'completed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_from_user_id (from_user_id),
            INDEX idx_to_user_id (to_user_id),
            INDEX idx_transaction_type (transaction_type),
            INDEX idx_reference_id (reference_id),
            INDEX idx_status (status),
            INDEX idx_created_at (created_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;
        
        await pool.execute(createTableQuery);
      }
    } catch (error) {
      console.error('Error ensuring table exists:', error);
      // Don't throw here, let the main query handle it
    }
  }

  static async getByType(transactionType, limit = 50, offset = 0) {
    const query = `
      SELECT st.*, 
             fu.username as from_username,
             tu.username as to_username
      FROM smp_transactions st
      LEFT JOIN users fu ON st.from_user_id = fu.id
      LEFT JOIN users tu ON st.to_user_id = tu.id
      WHERE st.transaction_type = ?
      ORDER BY st.created_at DESC
    `;

    try {
      // Convert parameters to proper types
      const limitInt = parseInt(limit);
      const offsetInt = parseInt(offset);
      
      const [allRows] = await pool.execute(query, [transactionType]);
      
      // Apply pagination in JavaScript
      const startIndex = offsetInt;
      const endIndex = startIndex + limitInt;
      const rows = allRows.slice(startIndex, endIndex);
      
      return rows;
    } catch (error) {
      throw new Error(`Error fetching SMP transactions by type: ${error.message}`);
    }
  }

  static async getByReference(referenceId, referenceType) {
    const query = `
      SELECT st.*, 
             fu.username as from_username,
             tu.username as to_username
      FROM smp_transactions st
      LEFT JOIN users fu ON st.from_user_id = fu.id
      LEFT JOIN users tu ON st.to_user_id = tu.id
      WHERE st.reference_id = ? AND st.reference_type = ?
      ORDER BY st.created_at DESC
    `;

    try {
      const [rows] = await pool.execute(query, [referenceId, referenceType]);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching SMP transactions by reference: ${error.message}`);
    }
  }

  static async getAll(limit = 100, offset = 0) {
    const query = `
      SELECT st.*, 
             fu.username as from_username,
             tu.username as to_username
      FROM smp_transactions st
      LEFT JOIN users fu ON st.from_user_id = fu.id
      LEFT JOIN users tu ON st.to_user_id = tu.id
      ORDER BY st.created_at DESC
    `;

    try {
      // Convert parameters to proper types
      const limitInt = parseInt(limit);
      const offsetInt = parseInt(offset);
      
      const [allRows] = await pool.execute(query);
      
      // Apply pagination in JavaScript
      const startIndex = offsetInt;
      const endIndex = startIndex + limitInt;
      const rows = allRows.slice(startIndex, endIndex);
      
      return rows;
    } catch (error) {
      throw new Error(`Error fetching all SMP transactions: ${error.message}`);
    }
  }

  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_transactions,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_transactions,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_transactions,
        SUM(amount) as total_volume,
        transaction_type,
        COUNT(*) as type_count
      FROM smp_transactions 
      GROUP BY transaction_type
    `;

    try {
      const [rows] = await pool.execute(query);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching SMP transaction stats: ${error.message}`);
    }
  }

  // Helper method to create NFT payment transaction
  static async createNFTPaymentTransaction(nftTransactionId, buyerId, sellerId, amount, nftId) {
    return await this.create({
      from_user_id: buyerId,
      to_user_id: sellerId,
      amount: amount,
      transaction_type: 'nft_payment',
      description: `Payment for NFT ${nftId}`,
      reference_id: nftTransactionId.toString(),
      reference_type: 'nft_transaction',
      status: 'completed'
    });
  }

  // Helper method to create NFT sale transaction
  static async createNFTSaleTransaction(nftTransactionId, sellerId, buyerId, amount, nftId) {
    return await this.create({
      from_user_id: sellerId,
      to_user_id: buyerId,
      amount: amount,
      transaction_type: 'nft_sale',
      description: `Sale of NFT ${nftId}`,
      reference_id: nftTransactionId.toString(),
      reference_type: 'nft_transaction',
      status: 'completed'
    });
  }

  // Helper method to create deposit transaction
  static async createDepositTransaction(userId, amount, requestId) {
    return await this.create({
      from_user_id: null, // System deposit
      to_user_id: userId,
      amount: amount,
      transaction_type: 'deposit',
      description: `Deposit of ${amount} SMP`,
      reference_id: requestId,
      reference_type: 'deposit_request',
      status: 'completed'
    });
  }

  // Helper method to create withdrawal transaction
  static async createWithdrawalTransaction(userId, amount, requestId) {
    return await this.create({
      from_user_id: userId,
      to_user_id: null, // System withdrawal
      amount: amount,
      transaction_type: 'withdrawal',
      description: `Withdrawal of ${amount} SMP`,
      reference_id: requestId,
      reference_type: 'withdrawal_request',
      status: 'completed'
    });
  }
}

module.exports = SMPTransaction; 