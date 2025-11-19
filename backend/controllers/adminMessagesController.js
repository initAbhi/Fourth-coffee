const pool = require('../config/db');
const { generateId } = require('../utils/uuid');

class AdminMessagesController {
  // Get all messages
  async getMessages(req, res) {
    try {
      const { to, read, limit = 100, offset = 0 } = req.query;
      
      let query = 'SELECT * FROM admin_messages WHERE 1=1';
      const params = [];
      let paramCount = 1;

      if (to) {
        query += ` AND (to_user = $${paramCount++} OR to_user = 'All Cashiers' OR to_user = 'All Staff')`;
        params.push(to);
      }

      if (read !== undefined) {
        query += ` AND read = $${paramCount++}`;
        params.push(read === 'true');
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      params.push(parseInt(limit), parseInt(offset));

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Create message
  async createMessage(req, res) {
    try {
      const { fromUser, toUser, subject, message, priority } = req.body;

      if (!fromUser || !toUser || !subject || !message) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      const id = generateId();
      const result = await pool.query(
        `INSERT INTO admin_messages (id, from_user, to_user, subject, message, priority)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, fromUser, toUser, subject, message, priority || 'medium']
      );

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Mark message as read
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const result = await pool.query(
        `UPDATE admin_messages 
         SET read = TRUE, read_at = CURRENT_TIMESTAMP 
         WHERE id = $1 
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Message not found',
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get unread count
  async getUnreadCount(req, res) {
    try {
      const { to } = req.query;
      
      let query = "SELECT COUNT(*) FROM admin_messages WHERE read = FALSE";
      const params = [];
      
      if (to) {
        query += ` AND (to_user = $1 OR to_user = 'All Cashiers' OR to_user = 'All Staff')`;
        params.push(to);
      }

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: {
          count: parseInt(result.rows[0].count),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new AdminMessagesController();

