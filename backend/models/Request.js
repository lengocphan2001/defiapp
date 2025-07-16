const mysql = require('mysql2/promise');
const { pool } = require('../config/database');

class Request {
  static async create(requestData) {
    const { user_id, type, smp_amount, usdt_amount, address_wallet, status = 'pending' } = requestData;
    
    const query = `
      INSERT INTO requests (user_id, type, smp_amount, usdt_amount, address_wallet, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    try {
      const [result] = await pool.execute(query, [
        user_id, type, smp_amount, usdt_amount, address_wallet, status
      ]);
      
      return {
        id: result.insertId,
        user_id,
        type,
        smp_amount,
        usdt_amount,
        address_wallet,
        status,
        created_at: new Date(),
        updated_at: new Date()
      };
    } catch (error) {
      throw new Error(`Error creating request: ${error.message}`);
    }
  }

  static async findByUserId(userId) {
    const query = `
      SELECT * FROM requests 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;
    
    try {
      const [rows] = await pool.execute(query, [userId]);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching requests: ${error.message}`);
    }
  }

  static async findById(requestId) {
    const query = 'SELECT * FROM requests WHERE id = ?';
    
    try {
      const [rows] = await pool.execute(query, [requestId]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching request: ${error.message}`);
    }
  }

  static async updateStatus(requestId, status) {
    const query = `
      UPDATE requests 
      SET status = ?, updated_at = NOW() 
      WHERE id = ?
    `;
    
    try {
      const [result] = await pool.execute(query, [status, requestId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating request status: ${error.message}`);
    }
  }

  static async getAll() {
    const query = `
      SELECT r.*, u.username 
      FROM requests r 
      JOIN users u ON r.user_id = u.id 
      ORDER BY r.created_at DESC
    `;
    
    try {
      const [rows] = await pool.execute(query);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching all requests: ${error.message}`);
    }
  }

  static async getPendingRequests() {
    const query = `
      SELECT r.*, u.username 
      FROM requests r 
      JOIN users u ON r.user_id = u.id 
      WHERE r.status = 'pending'
      ORDER BY r.created_at ASC
    `;
    
    try {
      const [rows] = await pool.execute(query);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching pending requests: ${error.message}`);
    }
  }
}

module.exports = Request; 