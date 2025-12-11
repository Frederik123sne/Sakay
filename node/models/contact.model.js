// node/models/contact.model.js
// Contact Us Model - Handles database operations for contact messages

const db = require('../config/database');

class ContactModel {
  /**
   * Generate unique message ID
   * @returns {string} Generated message ID (e.g., MSG001)
   */
  static async generateMessageId() {
    const query = `
      SELECT messageID 
      FROM contact_us 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const [rows] = await db.query(query);
    
    if (rows.length === 0) {
      return 'MSG001';
    }
    
    const lastId = rows[0].messageID;
    const numPart = parseInt(lastId.replace('MSG', ''));
    const newNum = numPart + 1;
    return `MSG${String(newNum).padStart(3, '0')}`;
  }

  /**
   * Create a new contact message
   * @param {Object} messageData - Message details
   * @returns {Object} Created message
   */
  static async create(messageData) {
    const { name, email, message } = messageData;
    const messageID = await this.generateMessageId();
    
    const query = `
      INSERT INTO contact_us (messageID, name, email, message, status)
      VALUES (?, ?, ?, ?, 'new')
    `;
    
    await db.query(query, [messageID, name, email, message]);
    
    return {
      messageID,
      name,
      email,
      message,
      status: 'new',
      created_at: new Date()
    };
  }

  /**
   * Get all messages (admin function)
   * @param {Object} filters - Optional filters (status, dateFrom, dateTo)
   * @returns {Array} List of messages
   */
  static async getAll(filters = {}) {
    let query = `
      SELECT messageID, name, email, message, status, created_at
      FROM contact_us
      WHERE 1=1
    `;
    const params = [];
    
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    if (filters.dateFrom) {
      query += ' AND created_at >= ?';
      params.push(filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query += ' AND created_at <= ?';
      params.push(filters.dateTo);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await db.query(query, params);
    return rows;
  }

  /**
   * Get message by ID
   * @param {string} messageID - Message ID
   * @returns {Object} Message details
   */
  static async getById(messageID) {
    const query = `
      SELECT messageID, name, email, message, status, created_at
      FROM contact_us
      WHERE messageID = ?
    `;
    
    const [rows] = await db.query(query, [messageID]);
    return rows[0] || null;
  }

  /**
   * Update message status
   * @param {string} messageID - Message ID
   * @param {string} status - New status (new, read, replied)
   * @returns {boolean} Success status
   */
  static async updateStatus(messageID, status) {
    const validStatuses = ['new', 'read', 'replied'];
    
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status value');
    }
    
    const query = `
      UPDATE contact_us
      SET status = ?
      WHERE messageID = ?
    `;
    
    const [result] = await db.query(query, [status, messageID]);
    return result.affectedRows > 0;
  }

  /**
   * Delete message
   * @param {string} messageID - Message ID
   * @returns {boolean} Success status
   */
  static async delete(messageID) {
    const query = 'DELETE FROM contact_us WHERE messageID = ?';
    const [result] = await db.query(query, [messageID]);
    return result.affectedRows > 0;
  }

  /**
   * Get message count by status
   * @returns {Object} Count by status
   */
  static async getCountByStatus() {
    const query = `
      SELECT 
        status,
        COUNT(*) as count
      FROM contact_us
      GROUP BY status
    `;
    
    const [rows] = await db.query(query);
    
    const counts = {
      new: 0,
      read: 0,
      replied: 0,
      total: 0
    };
    
    rows.forEach(row => {
      counts[row.status] = row.count;
      counts.total += row.count;
    });
    
    return counts;
  }
}

module.exports = ContactModel;