const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../config.env') });

async function createSessionsTable() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'defiapp',
      port: process.env.DB_PORT || 3306
    });

    console.log('Connected to database successfully');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../migrations/create_sessions_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL file into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        console.log(statement.substring(0, 100) + '...');
        
        await connection.execute(statement);
        console.log(`Statement ${i + 1} executed successfully`);
      }
    }

    console.log('✅ Sessions table migration completed successfully!');
    
    // Verify the tables were created
    console.log('\nVerifying tables...');
    
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('sessions', 'session_registrations', 'nft_transactions')
    `, [process.env.DB_NAME || 'defiapp']);
    
    console.log('Created tables:');
    tables.forEach(table => {
      console.log(`  - ${table.TABLE_NAME}`);
    });

  } catch (error) {
    console.error('❌ Error creating sessions table:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the migration
createSessionsTable()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  }); 