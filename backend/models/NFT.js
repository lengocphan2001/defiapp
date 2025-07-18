const { pool } = require('../config/database');

// Generate 18-character hash for NFT ID
const generateNFTHash = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 18; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

class NFT {
  static async create(nftData) {
    const { name, seller_id, price } = nftData;
    
    // Generate unique NFT ID
    let nftId;
    let isUnique = false;
    
    while (!isUnique) {
      nftId = generateNFTHash();
      const [existingNFTs] = await pool.execute(
        'SELECT id FROM nfts WHERE id = ?',
        [nftId]
      );
      if (existingNFTs.length === 0) {
        isUnique = true;
      }
    }
    
    const query = `
      INSERT INTO nfts (id, name, seller_id, price, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'available', NOW(), NOW())
    `;
    
    try {
      const [result] = await pool.execute(query, [
        nftId, name, seller_id, price
      ]);
      
      return {
        id: nftId,
        name,
        seller_id,
        price,
        status: 'available',
        created_at: new Date(),
        updated_at: new Date()
      };
    } catch (error) {
      throw new Error(`Error creating NFT: ${error.message}`);
    }
  }

  static async findById(nftId) {
    const query = `
      SELECT n.*, u.username as seller_name 
      FROM nfts n 
      JOIN users u ON n.seller_id = u.id 
      WHERE n.id = ?
    `;
    
    try {
      const [rows] = await pool.execute(query, [nftId]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching NFT: ${error.message}`);
    }
  }

  static async findBySellerId(sellerId) {
    const query = `
      SELECT n.*, u.username as seller_name 
      FROM nfts n 
      JOIN users u ON n.seller_id = u.id 
      WHERE n.seller_id = ? 
      ORDER BY n.created_at DESC
    `;
    
    try {
      const [rows] = await pool.execute(query, [sellerId]);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching seller NFTs: ${error.message}`);
    }
  }

  static async getAllAvailable() {
    const query = `
      SELECT n.*, u.username as seller_name 
      FROM nfts n 
      JOIN users u ON n.seller_id = u.id 
      WHERE n.status = 'available' 
      ORDER BY n.created_at DESC
    `;
    
    try {
      const [rows] = await pool.execute(query);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching available NFTs: ${error.message}`);
    }
  }

  static async getAll() {
    const query = `
      SELECT n.*, u.username as seller_name 
      FROM nfts n 
      JOIN users u ON n.seller_id = u.id 
      ORDER BY n.created_at DESC
    `;
    
    try {
      const [rows] = await pool.execute(query);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching all NFTs: ${error.message}`);
    }
  }

  static async updateStatus(nftId, status) {
    const query = `
      UPDATE nfts 
      SET status = ?, updated_at = NOW() 
      WHERE id = ?
    `;
    
    try {
      const [result] = await pool.execute(query, [status, nftId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating NFT status: ${error.message}`);
    }
  }

  static async updatePrice(nftId, price) {
    const query = `
      UPDATE nfts 
      SET price = ?, updated_at = NOW() 
      WHERE id = ?
    `;
    
    try {
      const [result] = await pool.execute(query, [price, nftId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating NFT price: ${error.message}`);
    }
  }

  static async delete(nftId) {
    const query = 'DELETE FROM nfts WHERE id = ?';
    
    try {
      const [result] = await pool.execute(query, [nftId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting NFT: ${error.message}`);
    }
  }

  static async getStats() {
    const statsQueries = {
      totalNFTs: 'SELECT COUNT(*) as count FROM nfts',
      availableNFTs: 'SELECT COUNT(*) as count FROM nfts WHERE status = "available"',
      soldNFTs: 'SELECT COUNT(*) as count FROM nfts WHERE status = "sold"',
      totalValue: 'SELECT SUM(price) as total FROM nfts WHERE status = "available"'
    };

    const stats = {};
    
    try {
      for (const [key, query] of Object.entries(statsQueries)) {
        const [rows] = await pool.execute(query);
        stats[key] = rows[0].count || rows[0].total || 0;
      }
      return stats;
    } catch (error) {
      throw new Error(`Error fetching NFT stats: ${error.message}`);
    }
  }
}

module.exports = NFT; 