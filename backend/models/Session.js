const mysql = require('mysql2/promise');
const { pool } = require('../config/database');

class Session {
  // Get or create today's session
  static async getTodaySession() {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Try to get existing session
      let [rows] = await pool.execute(
        'SELECT * FROM sessions WHERE session_date = ?',
        [today]
      );
      
      if (rows.length === 0) {
        // Create new session for today
        const [result] = await pool.execute(
          'INSERT INTO sessions (session_date, status, registration_fee) VALUES (?, "active", 20000.00000000)',
          [today]
        );
        
        [rows] = await pool.execute(
          'SELECT * FROM sessions WHERE id = ?',
          [result.insertId]
        );
      }
      
      return rows[0];
    } catch (error) {
      throw new Error(`Error getting today's session: ${error.message}`);
    }
  }

  // Register user for today's session
  static async registerUser(userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Get today's session
      const session = await this.getTodaySession();
      
      // Check if user is already registered
      const [existingRegistrations] = await connection.execute(
        'SELECT * FROM session_registrations WHERE session_id = ? AND user_id = ? AND status = "registered"',
        [session.id, userId]
      );
      
      if (existingRegistrations.length > 0) {
        throw new Error('User is already registered for today\'s session');
      }
      
      // Get user's current balance
      const [userRows] = await connection.execute(
        'SELECT balance FROM users WHERE id = ?',
        [userId]
      );
      
      if (userRows.length === 0) {
        throw new Error('User not found');
      }
      
      const userBalance = parseFloat(userRows[0].balance);
      const registrationFee = parseFloat(session.registration_fee);
      
      if (userBalance < registrationFee) {
        throw new Error('Insufficient balance for registration fee');
      }
      
      // Deduct registration fee from user balance
      await connection.execute(
        'UPDATE users SET balance = balance - ? WHERE id = ?',
        [registrationFee, userId]
      );
      
      // Register user for session
      const [result] = await connection.execute(
        'INSERT INTO session_registrations (session_id, user_id, registration_fee) VALUES (?, ?, ?)',
        [session.id, userId, registrationFee]
      );
      
      await connection.commit();
      
      return {
        id: result.insertId,
        session_id: session.id,
        user_id: userId,
        registration_fee: registrationFee,
        status: 'registered',
        registered_at: new Date()
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Check if user is registered for today's session
  static async isUserRegistered(userId) {
    try {
      const session = await this.getTodaySession();
      
      const [rows] = await pool.execute(
        'SELECT * FROM session_registrations WHERE session_id = ? AND user_id = ? AND status = "registered"',
        [session.id, userId]
      );
      
      return rows.length > 0;
    } catch (error) {
      throw new Error(`Error checking user registration: ${error.message}`);
    }
  }

  // Get session registration info for user
  static async getUserRegistration(userId) {
    try {
      const session = await this.getTodaySession();
      
      const [rows] = await pool.execute(
        'SELECT * FROM session_registrations WHERE session_id = ? AND user_id = ? AND status = "registered"',
        [session.id, userId]
      );
      
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error getting user registration: ${error.message}`);
    }
  }

  // Get all registered users for today's session
  static async getRegisteredUsers() {
    try {
      const session = await this.getTodaySession();
      
      const [rows] = await pool.execute(`
        SELECT sr.*, u.username, u.fullname 
        FROM session_registrations sr 
        JOIN users u ON sr.user_id = u.id 
        WHERE sr.session_id = ? AND sr.status = "registered"
        ORDER BY sr.registered_at ASC
      `, [session.id]);
      
      return rows;
    } catch (error) {
      throw new Error(`Error getting registered users: ${error.message}`);
    }
  }

  // Get session statistics
  static async getSessionStats() {
    try {
      const session = await this.getTodaySession();
      
      const [registrationCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM session_registrations WHERE session_id = ? AND status = "registered"',
        [session.id]
      );
      
      const [totalFees] = await pool.execute(
        'SELECT SUM(registration_fee) as total FROM session_registrations WHERE session_id = ? AND status = "registered"',
        [session.id]
      );
      
      return {
        session_id: session.id,
        session_date: session.session_date,
        registration_count: registrationCount[0].count,
        total_fees: totalFees[0].total || 0,
        registration_fee: session.registration_fee
      };
    } catch (error) {
      throw new Error(`Error getting session stats: ${error.message}`);
    }
  }

  // Close today's session (admin only)
  static async closeTodaySession() {
    try {
      const session = await this.getTodaySession();
      
      const [result] = await pool.execute(
        'UPDATE sessions SET status = "closed" WHERE id = ?',
        [session.id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error closing session: ${error.message}`);
    }
  }
}

module.exports = Session; 