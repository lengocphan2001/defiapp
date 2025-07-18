const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Generate referral code
const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Register user
const register = async (req, res) => {
  try {
    const { username, referral, phone, password } = req.body;

    // Check if username already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Check if phone already exists
    const [existingPhones] = await pool.execute(
      'SELECT id FROM users WHERE phone = ?',
      [phone]
    );

    if (existingPhones.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already registered'
      });
    }

    // Verify referral code exists (if provided)
    let referredBy = null;
    if (referral && referral.trim()) {
      const [referralUsers] = await pool.execute(
        'SELECT id, username FROM users WHERE referral_code = ?',
        [referral]
      );

      if (referralUsers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid referral code'
        });
      }
      referredBy = referralUsers[0].username;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate unique referral code for new user
    let newReferralCode;
    let isUnique = false;
    
    while (!isUnique) {
      newReferralCode = generateReferralCode();
      const [existingCodes] = await pool.execute(
        'SELECT id FROM users WHERE referral_code = ?',
        [newReferralCode]
      );
      if (existingCodes.length === 0) {
        isUnique = true;
      }
    }

    // Insert new user
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, phone, referral_code, referred_by, balance) VALUES (?, ?, ?, ?, ?, 0.00000000)',
      [username, hashedPassword, phone, newReferralCode, referredBy]
    );

    // Get the created user (without password)
    const [newUser] = await pool.execute(
      'SELECT id, username, phone, fullname, referral_code, referred_by, balance, address_wallet, status, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser[0].id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: newUser[0],
        token
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const [users] = await pool.execute(
      'SELECT id, username, password, phone, fullname, referral_code, referred_by, balance, address_wallet, status, role, created_at FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const user = users[0];

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Remove password from response
    delete user.password;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update wallet address
const updateWalletAddress = async (req, res) => {
  try {
    const { address_wallet } = req.body;
    const userId = req.user.id;

    // Validate wallet address
    if (!address_wallet || address_wallet.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required'
      });
    }

    // Update wallet address
    await pool.execute(
      'UPDATE users SET address_wallet = ? WHERE id = ?',
      [address_wallet.trim(), userId]
    );

    // Get updated user data
    const [users] = await pool.execute(
      'SELECT id, username, phone, fullname, referral_code, referred_by, balance, address_wallet, status, role, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Wallet address updated successfully',
      data: {
        user: users[0]
      }
    });

  } catch (error) {
    console.error('Update wallet address error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Logout (client-side token removal)
const logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  logout,
  updateWalletAddress
}; 