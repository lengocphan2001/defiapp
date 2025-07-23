const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully!');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Initialize database tables
const initDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Create users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        fullname VARCHAR(100) NULL,
        referral_code VARCHAR(50) UNIQUE,
        referred_by VARCHAR(50),
        balance DECIMAL(18,2) DEFAULT 0.00,
        address_wallet VARCHAR(255) NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        role ENUM('user', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_phone (phone),
        INDEX idx_referral_code (referral_code),
        INDEX idx_status (status),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    // Create referral_codes table
    const createReferralCodesTable = `
      CREATE TABLE IF NOT EXISTS referral_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        user_id INT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_code (code),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    // Create requests table
    const createRequestsTable = `
      CREATE TABLE IF NOT EXISTS requests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        type ENUM('deposit', 'withdraw') NOT NULL,
        smp_amount DECIMAL(20, 2) NOT NULL,
        usdt_amount DECIMAL(20, 2) NOT NULL,
        address_wallet VARCHAR(255) NOT NULL,
        status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    

    // Create sessions table
    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_date DATE NOT NULL,
        time_start TIME DEFAULT '09:00:00',
        status ENUM('active', 'closed') DEFAULT 'active',
        registration_fee DECIMAL(20, 2) DEFAULT 20000.00000000,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_session_date (session_date),
        INDEX idx_session_date (session_date),
        INDEX idx_status (status),
        INDEX idx_time_start (time_start)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    // Create session_registrations table
    const createSessionRegistrationsTable = `
      CREATE TABLE IF NOT EXISTS session_registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        user_id INT NOT NULL,
        registration_fee DECIMAL(20, 2) NOT NULL,
        status ENUM('registered', 'cancelled') DEFAULT 'registered',
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_session_user (session_id, user_id),
        INDEX idx_session_id (session_id),
        INDEX idx_user_id (user_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    // Create NFTs table
    const createNFTsTable = `
      CREATE TABLE IF NOT EXISTS nfts (
        id VARCHAR(18) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        owner_id INT NOT NULL,
        price DECIMAL(20, 2) NOT NULL DEFAULT 0.00000000,
        type ENUM('buy', 'sell', 'list', 'open') DEFAULT 'sell',
        status ENUM('available', 'sold', 'cancelled') DEFAULT 'available',
        payment_status ENUM('pending', 'completed', 'unpaid') DEFAULT 'unpaid',
        session_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
        INDEX idx_owner_id (owner_id),
        INDEX idx_type (type),
        INDEX idx_status (status),
        INDEX idx_payment_status (payment_status),
        INDEX idx_price (price),
        INDEX idx_session_id (session_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    // Create nft_transactions table
    const createNFTTransactionsTable = `
      CREATE TABLE IF NOT EXISTS nft_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nft_id VARCHAR(18) NOT NULL,
        buyer_id INT NOT NULL,
        seller_id INT NOT NULL,
        price DECIMAL(20, 2) NOT NULL,
        transaction_type ENUM('buy', 'sell') NOT NULL,
        status ENUM('pending', 'completed', 'cancelled') DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (nft_id) REFERENCES nfts(id) ON DELETE CASCADE,
        FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_nft_id (nft_id),
        INDEX idx_buyer_id (buyer_id),
        INDEX idx_seller_id (seller_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    // Create smp_transactions table for general SMP transactions
    const createSMPTransactionsTable = `
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
        FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_from_user_id (from_user_id),
        INDEX idx_to_user_id (to_user_id),
        INDEX idx_transaction_type (transaction_type),
        INDEX idx_reference_id (reference_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    // Create daily_session_settings table
    const createDailySessionSettingsTable = `
      CREATE TABLE IF NOT EXISTS daily_session_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        time_start TIME NOT NULL DEFAULT '09:00:00',
        registration_fee DECIMAL(20, 8) NOT NULL DEFAULT 20000.00000000,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createUsersTable);
    await connection.execute(createReferralCodesTable);
    await connection.execute(createRequestsTable);
    await connection.execute(createSessionsTable);
    await connection.execute(createNFTsTable);
    await connection.execute(createSessionRegistrationsTable);
    await connection.execute(createNFTTransactionsTable);
    await connection.execute(createSMPTransactionsTable);
    await connection.execute(createDailySessionSettingsTable);
    
    // Add status column to existing nft_transactions table if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE nft_transactions 
        ADD COLUMN status ENUM('pending', 'completed', 'cancelled') DEFAULT 'completed' AFTER transaction_type
      `);
    } catch (error) {
      // Column might already exist, ignore error
      console.log('Status column might already exist in nft_transactions table');
    }

    // Update NFTs table type column to support new values
    try {
      await connection.execute(`
        ALTER TABLE nfts 
        MODIFY COLUMN type ENUM('buy', 'sell', 'list', 'open') DEFAULT 'sell'
      `);
    } catch (error) {
      // Column might already be updated, ignore error
      console.log('Type column might already be updated in nfts table');
    }
    
    // Add index for status column if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE nft_transactions 
        ADD INDEX idx_status (status)
      `);
      console.log('✅ Added status index to nft_transactions table');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Status index already exists in nft_transactions table');
      } else {
        console.log('ℹ️ Could not add status index (might already exist):', error.message);
      }
    }
    
    // Add payment_status column to existing nfts table if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE nfts 
        ADD COLUMN payment_status ENUM('pending', 'completed', 'unpaid') DEFAULT 'unpaid' AFTER status
      `);
      console.log('✅ Added payment_status column to nfts table');
      
      // Update existing NFTs to have completed payment_status if they have completed transactions
      await connection.execute(`
        UPDATE nfts n 
        SET payment_status = 'completed' 
        WHERE EXISTS (
            SELECT 1 FROM nft_transactions nt 
            WHERE nt.nft_id = n.id 
            AND nt.status = 'completed'
        )
      `);
      console.log('✅ Updated existing NFTs with completed payment status');
      
      // Update NFTs with pending transactions to have pending payment_status
      await connection.execute(`
        UPDATE nfts n 
        SET payment_status = 'pending' 
        WHERE EXISTS (
            SELECT 1 FROM nft_transactions nt 
            WHERE nt.nft_id = n.id 
            AND nt.status = 'pending'
        )
      `);
      console.log('✅ Updated existing NFTs with pending payment status');
      
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ Payment_status column already exists in nfts table');
      } else {
        console.log('ℹ️ Could not add payment_status column (might already exist):', error.message);
      }
    }
    
    // Add index for payment_status column if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE nfts 
        ADD INDEX idx_payment_status (payment_status)
      `);
      console.log('✅ Added payment_status index to nfts table');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Payment_status index already exists in nfts table');
      } else {
        console.log('ℹ️ Could not add payment_status index (might already exist):', error.message);
      }
    }

    // Add session_id column to existing nfts table if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE nfts 
        ADD COLUMN session_id INT NULL AFTER payment_status
      `);
      console.log('✅ Added session_id column to nfts table');
      
      // Add foreign key constraint
      try {
        await connection.execute(`
          ALTER TABLE nfts 
          ADD CONSTRAINT fk_nfts_session_id 
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
        `);
        console.log('✅ Added session_id foreign key to nfts table');
      } catch (fkError) {
        if (fkError.code === 'ER_DUP_KEYNAME') {
          console.log('ℹ️ Session_id foreign key already exists in nfts table');
        } else {
          console.log('ℹ️ Could not add session_id foreign key (might already exist):', fkError.message);
        }
      }
      
      // Add index for session_id
      try {
        await connection.execute(`
          ALTER TABLE nfts 
          ADD INDEX idx_session_id (session_id)
        `);
        console.log('✅ Added session_id index to nfts table');
      } catch (indexError) {
        if (indexError.code === 'ER_DUP_KEYNAME') {
          console.log('ℹ️ Session_id index already exists in nfts table');
        } else {
          console.log('ℹ️ Could not add session_id index (might already exist):', indexError.message);
        }
      }
      
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ Session_id column already exists in nfts table');
      } else {
        console.log('ℹ️ Could not add session_id column (might already exist):', error.message);
      }
    }
    
    // Insert default daily session settings if none exist
    try {
      const [existingSettings] = await connection.execute(
        'SELECT COUNT(*) as count FROM daily_session_settings'
      );
      
      if (existingSettings[0].count === 0) {
        await connection.execute(`
          INSERT INTO daily_session_settings (time_start, registration_fee, is_active) 
          VALUES ('09:00:00', 20000.00000000, TRUE)
        `);
        console.log('✅ Inserted default daily session settings');
      } else {
        console.log('ℹ️ Daily session settings already exist');
      }
    } catch (error) {
      console.log('ℹ️ Could not insert default daily session settings:', error.message);
    }
    
    console.log('✅ Database tables initialized successfully!');
    connection.release();
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
};

module.exports = {
  pool,
  testConnection,
  initDatabase
}; 