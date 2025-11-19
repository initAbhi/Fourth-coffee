const tableService = require('../services/tableService');
const pool = require('../config/db');
const { generateId } = require('../utils/uuid');
const orderService = require('../services/orderService');

class TableController {
  // Get all tables
  async getAllTables(req, res) {
    try {
      const tables = await tableService.getAllTables();
      res.json({
        success: true,
        data: tables,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get table by ID
  async getTableById(req, res) {
    try {
      const { id } = req.params;
      const table = await tableService.getTableById(id);

      if (!table) {
        return res.status(404).json({
          success: false,
          error: 'Table not found',
        });
      }

      res.json({
        success: true,
        data: table,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get table by QR slug
  async getTableBySlug(req, res) {
    try {
      const { slug } = req.params;
      const table = await tableService.getTableBySlug(slug);

      if (!table) {
        return res.status(404).json({
          success: false,
          error: 'Table not found',
        });
      }

      res.json({
        success: true,
        data: table,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Create new table
  async createTable(req, res) {
    try {
      const { tableNumber, qrSlug } = req.body;

      if (!tableNumber) {
        return res.status(400).json({
          success: false,
          error: 'Table number is required',
        });
      }

      const id = generateId();
      await pool.query(
        `INSERT INTO tables (id, table_number, qr_slug, status)
         VALUES ($1, $2, $3, $4)`,
        [id, tableNumber, qrSlug || tableNumber, 'idle']
      );

      const table = await tableService.getTableById(id);
      res.status(201).json({
        success: true,
        data: table,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Update table status
  async updateTableStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const table = await tableService.updateTableStatus(id, status);
      if (!table) {
        return res.status(404).json({
          success: false,
          error: 'Table not found',
        });
      }

      res.json({
        success: true,
        data: table,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Reset table to idle
  async resetTable(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      
      await client.query('BEGIN');
      
      // Update table status to idle
      await client.query(
        'UPDATE tables SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['idle', id]
      );
      
      // Also update any active orders for this table to 'served' if not already
      // This ensures the table stays idle even if there are old orders
      await client.query(
        `UPDATE orders 
         SET status = 'served', served_at = CURRENT_TIMESTAMP 
         WHERE table_id = $1 AND status IN ('pending', 'approved')`,
        [id]
      );
      
      await client.query('COMMIT');
      
      const table = await tableService.getTableById(id);
      if (!table) {
        return res.status(404).json({
          success: false,
          error: 'Table not found',
        });
      }

      res.json({
        success: true,
        data: table,
        message: 'Table reset to idle',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      res.status(500).json({
        success: false,
        error: error.message,
      });
    } finally {
      client.release();
    }
  }
}

module.exports = new TableController();

