const bcrypt = require('bcryptjs');
const { pool, testConnection } = require('../config/database');
const { generateReferralCode } = require('../utils/validation');
require('dotenv').config({ path: './config.env' });

const createFirstUser = async () => {
  try {
    // Test database connection
    await testConnection();
    console.log('✅ Database connection successful');

    // Check if users table exists and has any users
    const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
    
    if (users[0].count > 0) {
      console.log('⚠️  Users already exist in the database');
      console.log('💡 You can use any existing user\'s referral code for registration');
      
      // Show existing users
      const [existingUsers] = await pool.execute(
        'SELECT username, referral_code, created_at FROM users LIMIT 5'
      );
      
      console.log('\n📋 Existing users:');
      existingUsers.forEach(user => {
        console.log(`   👤 ${user.username} - Referral: ${user.referral_code || 'None'}`);
      });
      
      process.exit(0);
    }

    // Create first user (admin)
    const adminData = {
      username: 'admin',
      password: 'admin123',
      phone: '+1234567890',
      referral_code: 'ADMIN001'
    };

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);

    // Insert admin user (no referral code, no referred_by)
    await pool.execute(
      'INSERT INTO users (username, password, phone, referral_code, referred_by) VALUES (?, ?, ?, ?, ?)',
      [adminData.username, hashedPassword, adminData.phone, adminData.referral_code, null]
    );

    console.log('✅ First user created successfully!');
    console.log('\n📋 Admin User Details:');
    console.log(`   👤 Username: ${adminData.username}`);
    console.log(`   🔑 Password: ${adminData.password}`);
    console.log(`   📱 Phone: ${adminData.phone}`);
    console.log(`   🎫 Referral Code: ${adminData.referral_code}`);
    console.log('\n💡 You can now use this referral code to register new users!');
    console.log('💡 Or register without a referral code (optional)');

  } catch (error) {
    console.error('❌ Error creating first user:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

// Run the script
createFirstUser(); 