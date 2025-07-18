const { pool, testConnection } = require('../config/database');
require('dotenv').config({ path: './config.env' });

const addFullnameColumn = async () => {
  try {
    // Test database connection
    await testConnection();
    console.log('✅ Database connection successful');

    // Check if fullname column already exists
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'fullname'
    `);

    if (columns.length > 0) {
      console.log('⚠️  Fullname column already exists in users table');
      process.exit(0);
    }

    // Add fullname column
    await pool.execute(`
      ALTER TABLE users 
      ADD COLUMN fullname VARCHAR(100) NULL AFTER phone
    `);

    console.log('✅ Fullname column added successfully');

    // Update existing users to have a default fullname based on username
    const [result] = await pool.execute(`
      UPDATE users 
      SET fullname = username 
      WHERE fullname IS NULL
    `);

    console.log(`✅ Updated ${result.affectedRows} existing users with default fullname`);

    // Show sample of updated users
    const [sampleUsers] = await pool.execute(`
      SELECT username, fullname, phone 
      FROM users 
      LIMIT 5
    `);

    console.log('\n📋 Sample users after update:');
    sampleUsers.forEach(user => {
      console.log(`   👤 ${user.username} - ${user.fullname} - ${user.phone}`);
    });

  } catch (error) {
    console.error('❌ Error adding fullname column:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

// Run the script
addFullnameColumn(); 