const { pool } = require('./config/database');
const SMPTransaction = require('./models/SMPTransaction');

async function testSMPTransactions() {
  try {
    console.log('=== Testing SMP Transactions ===');
    
    // Test 1: Check if table exists
    console.log('\n1. Checking if smp_transactions table exists...');
    const [tables] = await pool.execute('SHOW TABLES LIKE "smp_transactions"');
    console.log('Tables found:', tables);
    
    if (tables.length === 0) {
      console.log('Table does not exist! Creating it...');
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
      console.log('Table created successfully!');
    }
    
    // Test 2: Check table structure
    console.log('\n2. Checking table structure...');
    const [columns] = await pool.execute('DESCRIBE smp_transactions');
    console.log('Columns:', columns.map(col => col.Field));
    
    // Test 3: Check if there are any records
    console.log('\n3. Checking existing records...');
    const [countResult] = await pool.execute('SELECT COUNT(*) as count FROM smp_transactions');
    console.log('Total records:', countResult[0].count);
    
    // Test 4: Try to insert a test record
    console.log('\n4. Inserting test record...');
    const insertQuery = `
      INSERT INTO smp_transactions (from_user_id, to_user_id, amount, transaction_type, description, status)
      VALUES (1, 2, 100.0, 'transfer', 'Test transaction', 'completed')
    `;
    const [insertResult] = await pool.execute(insertQuery);
    console.log('Insert result:', insertResult);
    
    // Test 5: Try the problematic query
    console.log('\n5. Testing getByUserId method...');
    try {
      const transactions = await SMPTransaction.getByUserId(1, 50, 0);
      console.log('Query successful! Found', transactions.length, 'transactions');
      console.log('First transaction:', transactions[0]);
    } catch (error) {
      console.error('Query failed:', error.message);
      console.error('Full error:', error);
    }
    
    // Test 6: Try raw query
    console.log('\n6. Testing raw query...');
    try {
      const [rawResult] = await pool.execute(`
        SELECT * FROM smp_transactions 
        WHERE from_user_id = ? OR to_user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `, [1, 1, 50]);
      console.log('Raw query successful! Found', rawResult.length, 'transactions');
    } catch (error) {
      console.error('Raw query failed:', error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await pool.end();
  }
}

testSMPTransactions(); 