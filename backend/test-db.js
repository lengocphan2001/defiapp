const { pool } = require('./config/database');

async function testDatabase() {
  try {
    console.log('=== Testing Database Connection ===');
    
    // Test 1: Basic connection
    console.log('\n1. Testing basic connection...');
    const [result] = await pool.execute('SELECT 1 as test');
    console.log('Connection successful:', result[0]);
    
    // Test 2: Check if smp_transactions table exists
    console.log('\n2. Checking smp_transactions table...');
    const [tables] = await pool.execute('SHOW TABLES LIKE "smp_transactions"');
    console.log('Tables found:', tables);
    
    if (tables.length > 0) {
      // Test 3: Check table structure
      console.log('\n3. Checking table structure...');
      const [columns] = await pool.execute('DESCRIBE smp_transactions');
      console.log('Columns:', columns.map(col => `${col.Field} (${col.Type})`));
      
      // Test 4: Check if there are any records
      console.log('\n4. Checking record count...');
      const [countResult] = await pool.execute('SELECT COUNT(*) as count FROM smp_transactions');
      console.log('Total records:', countResult[0].count);
      
      if (countResult[0].count > 0) {
        // Test 5: Try a simple select
        console.log('\n5. Testing simple select...');
        const [rows] = await pool.execute('SELECT * FROM smp_transactions LIMIT 1');
        console.log('Sample record:', rows[0]);
      }
    }
    
  } catch (error) {
    console.error('Database test failed:', error);
  } finally {
    await pool.end();
  }
}

testDatabase(); 