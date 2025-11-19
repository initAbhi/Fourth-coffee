const pool = require('../config/db');
const { generateId } = require('../utils/uuid');

class WastageController {
  // Get all wastage entries
  async getWastageEntries(req, res) {
    try {
      const { limit = 100, offset = 0 } = req.query;
      const result = await pool.query(
        `SELECT * FROM wastage_log 
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2`,
        [parseInt(limit), parseInt(offset)]
      );

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

  // Create wastage entry
  async createWastageEntry(req, res) {
    try {
      const { itemName, category, quantity, unit, reason, recordedBy } = req.body;

      if (!itemName || !category || !quantity || !reason) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      const id = generateId();
      const result = await pool.query(
        `INSERT INTO wastage_log (id, item_name, category, quantity, unit, reason, recorded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [id, itemName, category, quantity, unit || 'pieces', reason, recordedBy || 'Cashier']
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

  // Delete wastage entry
  async deleteWastageEntry(req, res) {
    try {
      const { id } = req.params;
      const result = await pool.query(
        'DELETE FROM wastage_log WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Wastage entry not found',
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
}

module.exports = new WastageController();

