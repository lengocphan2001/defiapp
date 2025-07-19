const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../config.env') });

async function setupSessions() {
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

    console.log('🔗 Connected to database successfully');
    console.log('📋 Starting session setup...\n');

    // Check if sessions table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sessions'
    `, [process.env.DB_NAME || 'defiapp']);

    if (tables.length === 0) {
      console.log('📦 Creating new sessions tables...');
      await createNewTables(connection);
    } else {
      console.log('✅ Sessions table already exists');
      await updateExistingTables(connection);
    }

    // Final verification
    await verifySetup(connection);

  } catch (error) {
    console.error('❌ Error in session setup:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

async function createNewTables(connection) {
  try {
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
        console.log(`  📝 Executing statement ${i + 1}/${statements.length}...`);
        await connection.execute(statement);
      }
    }

    console.log('✅ New sessions tables created successfully!');
  } catch (error) {
    throw new Error(`Failed to create new tables: ${error.message}`);
  }
}

async function updateExistingTables(connection) {
  try {
    // Check if time_start column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sessions' AND COLUMN_NAME = 'time_start'
    `, [process.env.DB_NAME || 'defiapp']);

    if (columns.length === 0) {
      console.log('⏰ Adding time_start column to existing sessions table...');
      
      // Add time_start column
      await connection.execute(`
        ALTER TABLE sessions 
        ADD COLUMN time_start TIME DEFAULT '09:00:00' 
        AFTER session_date
      `);

      // Update existing sessions
      const [updateResult] = await connection.execute(`
        UPDATE sessions 
        SET time_start = '09:00:00' 
        WHERE time_start IS NULL
      `);

      console.log(`✅ Added time_start column and updated ${updateResult.affectedRows} existing sessions`);
    } else {
      console.log('✅ time_start column already exists');
    }

    // Check for other required tables
    const requiredTables = ['session_registrations', 'nft_transactions'];
    
    for (const tableName of requiredTables) {
      const [tableExists] = await connection.execute(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      `, [process.env.DB_NAME || 'defiapp', tableName]);

      if (tableExists.length === 0) {
        console.log(`📦 Creating missing table: ${tableName}`);
        await createMissingTable(connection, tableName);
      } else {
        console.log(`✅ Table ${tableName} already exists`);
      }
    }

  } catch (error) {
    throw new Error(`Failed to update existing tables: ${error.message}`);
  }
}

async function createMissingTable(connection, tableName) {
  const tableDefinitions = {
    'session_registrations': `
      CREATE TABLE session_registrations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        session_id INT NOT NULL,
        user_id INT NOT NULL,
        registration_fee DECIMAL(20,8) NOT NULL,
        status ENUM('registered', 'cancelled') DEFAULT 'registered',
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_session_user (session_id, user_id)
      )
    `,
    'nft_transactions': `
      CREATE TABLE nft_transactions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nft_id INT NOT NULL,
        buyer_id INT NOT NULL,
        seller_id INT NOT NULL,
        price DECIMAL(20,8) NOT NULL,
        transaction_type ENUM('buy', 'sell') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (nft_id) REFERENCES nfts(id) ON DELETE CASCADE,
        FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `
  };

  if (tableDefinitions[tableName]) {
    await connection.execute(tableDefinitions[tableName]);
    console.log(`✅ Created table: ${tableName}`);
  }
}

async function verifySetup(connection) {
  console.log('\n🔍 Verifying session setup...');

  // Check all required tables
  const requiredTables = ['sessions', 'session_registrations', 'nft_transactions'];
  const existingTables = [];

  for (const tableName of requiredTables) {
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
    `, [process.env.DB_NAME || 'defiapp', tableName]);

    if (tables.length > 0) {
      existingTables.push(tableName);
    }
  }

  console.log(`✅ Found ${existingTables.length}/${requiredTables.length} required tables:`);
  existingTables.forEach(table => console.log(`  - ${table}`));

  // Check sessions table structure
  const [sessionColumns] = await connection.execute(`
    SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, IS_NULLABLE
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sessions'
    ORDER BY ORDINAL_POSITION
  `, [process.env.DB_NAME || 'defiapp']);

  console.log('\n📋 Sessions table structure:');
  sessionColumns.forEach(col => {
    console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (Default: ${col.COLUMN_DEFAULT || 'NULL'})`);
  });

  // Show sample data
  const [sampleSessions] = await connection.execute(`
    SELECT id, session_date, time_start, status, registration_fee
    FROM sessions 
    ORDER BY session_date DESC 
    LIMIT 3
  `);

  if (sampleSessions.length > 0) {
    console.log('\n📊 Sample sessions:');
    sampleSessions.forEach(session => {
      console.log(`  - Session ${session.id}: ${session.session_date} at ${session.time_start} (${session.status})`);
    });
  } else {
    console.log('\n📊 No sessions found (this is normal for new installations)');
  }
}

// Run the setup
setupSessions()
  .then(() => {
    console.log('\n🎉 Session setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Start your backend server');
    console.log('  2. Access the admin panel at /admin');
    console.log('  3. Navigate to Sessions to manage trading sessions');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Session setup failed:', error);
    process.exit(1);
  }); 