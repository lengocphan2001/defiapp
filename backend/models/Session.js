const mysql = require('mysql2/promise');
const { pool } = require('../config/database');

class Session {
  // Get today's session (no automatic creation)
  static async getTodaySession() {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Try to get existing session
      let [rows] = await pool.execute(
        'SELECT * FROM sessions WHERE session_date = ?',
        [today]
      );
      
      // Return null if no session exists (no automatic creation)
      return rows.length > 0 ? rows[0] : null;
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
      
      if (!session) {
        throw new Error('No session found for today. Please create one in the admin panel.');
      }

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
      
      if (!session) {
        return false; // No session found, so not registered
      }

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
      
      if (!session) {
        return null; // No session found
      }

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
      
      if (!session) {
        return []; // No session found
      }

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
      
      if (!session) {
        return {
          session_id: null,
          session_date: null,
          registration_count: 0,
          total_fees: 0,
          registration_fee: null
        };
      }

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
      
      if (!session) {
        throw new Error('No session found for today to close.');
      }

      const [result] = await pool.execute(
        'UPDATE sessions SET status = "closed" WHERE id = ?',
        [session.id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error closing session: ${error.message}`);
    }
  }

  // Get all sessions (admin only)
  static async getAllSessions() {
    try {
      const [rows] = await pool.execute(`
        SELECT s.*, 
               COUNT(sr.id) as registration_count,
               SUM(sr.registration_fee) as total_fees
        FROM sessions s
        LEFT JOIN session_registrations sr ON s.id = sr.session_id AND sr.status = 'registered'
        GROUP BY s.id
        ORDER BY s.session_date DESC
        LIMIT 50
      `);
      
      return rows;
    } catch (error) {
      throw new Error(`Error getting all sessions: ${error.message}`);
    }
  }

  // Update session time_start (admin only)
  static async updateSessionTime(sessionId, timeStart) {
    try {
      const [result] = await pool.execute(
        'UPDATE sessions SET time_start = ? WHERE id = ?',
        [timeStart, sessionId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating session time: ${error.message}`);
    }
  }

  // Update session registration fee (admin only)
  static async updateSessionFee(sessionId, registrationFee) {
    try {
      const [result] = await pool.execute(
        'UPDATE sessions SET registration_fee = ? WHERE id = ?',
        [registrationFee, sessionId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating session fee: ${error.message}`);
    }
  }

  // Get session by ID (admin only)
  static async getSessionById(sessionId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM sessions WHERE id = ?',
        [sessionId]
      );
      
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error getting session by ID: ${error.message}`);
    }
  }

  // Get available sessions (from today onwards)
  static async getAvailableSessions() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [rows] = await pool.execute(`
        SELECT s.*, 
               COALESCE(COUNT(sr.id), 0) as registration_count,
               COALESCE(SUM(sr.registration_fee), 0) as total_fees
        FROM sessions s
        LEFT JOIN session_registrations sr ON s.id = sr.session_id AND sr.status = 'registered'
        WHERE s.session_date >= ? AND s.status = 'active'
        GROUP BY s.id, s.session_date, s.time_start, s.status, s.registration_fee, s.created_at, s.updated_at
        ORDER BY s.session_date ASC, s.time_start ASC
      `, [today]);
      
      return rows;
    } catch (error) {
      throw new Error(`Error getting available sessions: ${error.message}`);
    }
  }

  // Register user for specific session
  static async registerUserForSession(userId, sessionId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Get session details
      const [sessionRows] = await connection.execute(
        'SELECT * FROM sessions WHERE id = ? AND status = "active"',
        [sessionId]
      );
      
      if (sessionRows.length === 0) {
        throw new Error('Session not found or not active');
      }
      
      const session = sessionRows[0];
      
      // Check if user is already registered for this session
      const [existingRegistrations] = await connection.execute(
        'SELECT * FROM session_registrations WHERE session_id = ? AND user_id = ? AND status = "registered"',
        [sessionId, userId]
      );
      
      if (existingRegistrations.length > 0) {
        throw new Error('User is already registered for this session');
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
        [sessionId, userId, registrationFee]
      );
      
      await connection.commit();
      
      return {
        id: result.insertId,
        session_id: sessionId,
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

  // Check if user is registered for specific session
  static async isUserRegisteredForSession(userId, sessionId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM session_registrations WHERE session_id = ? AND user_id = ? AND status = "registered"',
        [sessionId, userId]
      );
      
      return rows.length > 0;
    } catch (error) {
      throw new Error(`Error checking user registration: ${error.message}`);
    }
  }

  // Get user's session registrations
  static async getUserSessionRegistrations(userId) {
    try {
      const [rows] = await pool.execute(`
        SELECT sr.*, s.session_date, s.time_start, s.status as session_status
        FROM session_registrations sr
        JOIN sessions s ON sr.session_id = s.id
        WHERE sr.user_id = ? AND sr.status = 'registered'
        ORDER BY s.session_date ASC, s.time_start ASC
      `, [userId]);
      
      return rows;
    } catch (error) {
      throw new Error(`Error getting user session registrations: ${error.message}`);
    }
  }

  // Create new session (admin only)
  static async createSession(sessionData) {
    try {
      const { session_date, time_start, registration_fee } = sessionData;
      
      const [result] = await pool.execute(
        'INSERT INTO sessions (session_date, time_start, status, registration_fee) VALUES (?, ?, "active", ?)',
        [session_date, time_start || '09:00:00', registration_fee || 20000.00000000]
      );
      
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating session: ${error.message}`);
    }
  }

  // Update session (admin only)
  static async updateSession(sessionId, sessionData) {
    try {
      const { session_date, time_start, status, registration_fee } = sessionData;
      
      const [result] = await pool.execute(
        'UPDATE sessions SET session_date = ?, time_start = ?, status = ?, registration_fee = ? WHERE id = ?',
        [session_date, time_start, status, registration_fee, sessionId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating session: ${error.message}`);
    }
  }

  // Delete session (admin only)
  static async deleteSession(sessionId) {
    try {
      // First check if there are any registrations for this session
      const [registrations] = await pool.execute(
        'SELECT COUNT(*) as count FROM session_registrations WHERE session_id = ?',
        [sessionId]
      );
      
      if (registrations[0].count > 0) {
        throw new Error('Cannot delete session with existing registrations');
      }
      
      const [result] = await pool.execute(
        'DELETE FROM sessions WHERE id = ?',
        [sessionId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting session: ${error.message}`);
    }
  }

  // Get sessions with pagination (admin only)
  static async getSessionsWithPagination(page = 1, limit = 10) {
    try {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const offset = (pageNum - 1) * limitNum;
      
      // First get total count
      const [totalCount] = await pool.execute('SELECT COUNT(*) as count FROM sessions');
      const total = totalCount[0].count;
      
      // Then get paginated sessions
      const [sessions] = await pool.execute(`
        SELECT s.*, 
               COALESCE(COUNT(sr.id), 0) as registration_count,
               COALESCE(SUM(sr.registration_fee), 0) as total_fees
        FROM sessions s
        LEFT JOIN session_registrations sr ON s.id = sr.session_id AND sr.status = 'registered'
        GROUP BY s.id, s.session_date, s.time_start, s.status, s.registration_fee, s.created_at, s.updated_at
        ORDER BY s.session_date DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `);
      
      return {
        sessions,
        total: total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      };
    } catch (error) {
      throw new Error(`Error getting sessions with pagination: ${error.message}`);
    }
  }
}

module.exports = Session; 