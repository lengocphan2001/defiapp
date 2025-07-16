const bcrypt = require('bcrypt');
require('dotenv').config({ path: '../config.env' });
const { pool } = require('../config/database');

const createAdminUser = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Check if admin user already exists
    const checkQuery = 'SELECT id FROM users WHERE role = "admin" LIMIT 1';
    const [existingAdmins] = await connection.execute(checkQuery);
    
    if (existingAdmins.length > 0) {
      console.log('❌ Admin user already exists!');
      connection.release();
      return;
    }

    // Admin user data
    const adminData = {
      username: 'admin',
      password: 'admin123', // You should change this in production
      phone: '0123456789',
      referral_code: 'ADMIN001',
      balance: '1000000.00', // 1 million SMP starting balance
      role: 'admin',
      status: 'active'
    };

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);

    // Generate unique referral code
    const referralCode = adminData.referral_code;

    // Insert admin user
    const insertQuery = `
      INSERT INTO users (
        username, 
        password, 
        phone, 
        referral_code, 
        balance, 
        role, 
        status, 
        created_at, 
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await connection.execute(insertQuery, [
      adminData.username,
      hashedPassword,
      adminData.phone,
      referralCode,
      adminData.balance,
      adminData.role,
      adminData.status
    ]);

    if (result.affectedRows > 0) {
      console.log('✅ Admin user created successfully!');
      console.log('📋 Admin credentials:');
      console.log(`   Username: ${adminData.username}`);
      console.log(`   Password: ${adminData.password}`);
      console.log(`   Phone: ${adminData.phone}`);
      console.log(`   Referral Code: ${referralCode}`);
      console.log(`   Starting Balance: ${adminData.balance} SMP`);
      console.log('\n⚠️  IMPORTANT: Change the admin password after first login!');
    } else {
      console.log('❌ Failed to create admin user');
    }

    connection.release();
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
};

// Run the script
createAdminUser(); 