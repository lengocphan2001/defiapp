const mysql = require('mysql2/promise');
const { pool } = require('../config/database');

class User {
  static async findById(userId) {
    const query = 'SELECT * FROM users WHERE id = ?';
    
    try {
      const [rows] = await pool.execute(query, [userId]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching user: ${error.message}`);
    }
  }

  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = ?';
    
    try {
      const [rows] = await pool.execute(query, [username]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching user by username: ${error.message}`);
    }
  }

  static async updateBalance(userId, newBalance) {
    const query = 'UPDATE users SET balance = ? WHERE id = ?';
    
    try {
      const [result] = await pool.execute(query, [newBalance, userId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating user balance: ${error.message}`);
    }
  }

  static async updateProfile(userId, profileData) {
    const { phone, fullname, address_wallet } = profileData;
    const query = `
      UPDATE users 
      SET phone = ?, fullname = ?, address_wallet = ?, updated_at = NOW() 
      WHERE id = ?
    `;
    
    try {
      const [result] = await pool.execute(query, [phone, fullname, address_wallet, userId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating user profile: ${error.message}`);
    }
  }

  static async getAll() {
    const query = 'SELECT * FROM users ORDER BY created_at DESC';
    
    try {
      const [rows] = await pool.execute(query);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching all users: ${error.message}`);
    }
  }

  static async getActiveUsers() {
    const query = 'SELECT * FROM users WHERE status = "active" ORDER BY created_at DESC';
    
    try {
      const [rows] = await pool.execute(query);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching active users: ${error.message}`);
    }
  }
}

module.exports = User; 