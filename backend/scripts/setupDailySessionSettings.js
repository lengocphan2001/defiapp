const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../config.env') });

async function setupDailySessionSettings() {
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
    console.log('📋 Setting up daily session settings...\n');

    // Check if daily_session_settings table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'daily_session_settings'
    `, [process.env.DB_NAME || 'defiapp']);

    if (tables.length === 0) {
      console.log('📦 Creating daily_session_settings table...');
      await createDailySessionSettingsTable(connection);
    } else {
      console.log('✅ daily_session_settings table already exists');
    }

    // Verify setup
    await verifySetup(connection);

  } catch (error) {
    console.error('❌ Error in daily session settings setup:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

async function createDailySessionSettingsTable(connection) {
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../migrations/create_daily_session_settings.sql');
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

    console.log('✅ Daily session settings table created successfully!');
  } catch (error) {
    throw new Error(`Failed to create daily session settings table: ${error.message}`);
  }
}

async function verifySetup(connection) {
  console.log('\n🔍 Verifying daily session settings setup...');

  // Check if table exists
  const [tables] = await connection.execute(`
    SELECT TABLE_NAME 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'daily_session_settings'
  `, [process.env.DB_NAME || 'defiapp']);

  if (tables.length === 0) {
    throw new Error('Daily session settings table not found');
  }

  console.log('✅ Daily session settings table exists');

  // Check table structure
  const [columns] = await connection.execute(`
    SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, IS_NULLABLE
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'daily_session_settings'
    ORDER BY ORDINAL_POSITION
  `, [process.env.DB_NAME || 'defiapp']);

  console.log('\n📋 Daily session settings table structure:');
  columns.forEach(col => {
    console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (Default: ${col.COLUMN_DEFAULT || 'NULL'})`);
  });

  // Check if default settings exist
  const [settings] = await connection.execute(`
    SELECT * FROM daily_session_settings ORDER BY id DESC LIMIT 1
  `);

  if (settings.length > 0) {
    console.log('\n📊 Current daily session settings:');
    const setting = settings[0];
    console.log(`  - Time Start: ${setting.time_start}`);
    console.log(`  - Registration Fee: ${setting.registration_fee}`);
    console.log(`  - Active: ${setting.is_active ? 'Yes' : 'No'}`);
  } else {
    console.log('\n📊 No settings found, inserting default...');
    await connection.execute(`
      INSERT INTO daily_session_settings (time_start, registration_fee, is_active) 
      VALUES ('09:00:00', 20000.00000000, TRUE)
    `);
    console.log('✅ Default settings inserted');
  }
}

// Run the setup
setupDailySessionSettings()
  .then(() => {
    console.log('\n🎉 Daily session settings setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Start your backend server');
    console.log('  2. Access the admin panel at /admin');
    console.log('  3. Navigate to Sessions to set daily session time');
    console.log('  4. Sessions will be automatically created daily at the specified time');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Daily session settings setup failed:', error);
    process.exit(1);
  }); 