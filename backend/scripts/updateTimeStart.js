const mysql = require('mysql2/promise');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../config.env') });

async function updateTimeStart() {
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

    // Check if sessions table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sessions'
    `, [process.env.DB_NAME || 'defiapp']);

    if (tables.length === 0) {
      console.log('❌ Sessions table does not exist. Please run createSessionsTable.js first.');
      return;
    }

    // Check if time_start column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sessions' AND COLUMN_NAME = 'time_start'
    `, [process.env.DB_NAME || 'defiapp']);

    if (columns.length > 0) {
      console.log('✅ time_start column already exists in sessions table');
      return;
    }

    console.log('Adding time_start column to sessions table...');

    // Add time_start column to sessions table
    await connection.execute(`
      ALTER TABLE sessions 
      ADD COLUMN time_start TIME DEFAULT '09:00:00' 
      AFTER session_date
    `);

    console.log('✅ time_start column added successfully');

    // Update existing sessions to have default time_start
    const [updateResult] = await connection.execute(`
      UPDATE sessions 
      SET time_start = '09:00:00' 
      WHERE time_start IS NULL
    `);

    console.log(`✅ Updated ${updateResult.affectedRows} existing sessions with default time_start`);

    // Verify the column was added
    const [verifyColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, IS_NULLABLE
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sessions' AND COLUMN_NAME = 'time_start'
    `, [process.env.DB_NAME || 'defiapp']);

    if (verifyColumns.length > 0) {
      const column = verifyColumns[0];
      console.log('\n✅ time_start column verification:');
      console.log(`  - Column Name: ${column.COLUMN_NAME}`);
      console.log(`  - Data Type: ${column.DATA_TYPE}`);
      console.log(`  - Default Value: ${column.COLUMN_DEFAULT}`);
      console.log(`  - Nullable: ${column.IS_NULLABLE}`);
    }

    // Show sample of updated sessions
    const [sampleSessions] = await connection.execute(`
      SELECT id, session_date, time_start, status, registration_fee
      FROM sessions 
      ORDER BY session_date DESC 
      LIMIT 5
    `);

    console.log('\n📋 Sample of updated sessions:');
    sampleSessions.forEach(session => {
      console.log(`  - Session ${session.id}: ${session.session_date} at ${session.time_start} (${session.status})`);
    });

  } catch (error) {
    console.error('❌ Error updating time_start column:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the update
updateTimeStart()
  .then(() => {
    console.log('\n🎉 time_start update script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 time_start update script failed:', error);
    process.exit(1);
  }); 