const pool = require('../config/db');
const { generateId } = require('../utils/uuid');

class TableService {
  // Get all tables
  async getAllTables() {
    const result = await pool.query('SELECT * FROM tables ORDER BY table_number');
    return result.rows.map(row => this.formatTable(row));
  }

  // Get table by ID
  async getTableById(id) {
    const result = await pool.query('SELECT * FROM tables WHERE id = $1', [id]);
    return result.rows.length > 0 ? this.formatTable(result.rows[0]) : null;
  }

  // Get table by slug
  async getTableBySlug(slug) {
    const result = await pool.query('SELECT * FROM tables WHERE qr_slug = $1', [slug]);
    return result.rows.length > 0 ? this.formatTable(result.rows[0]) : null;
  }

  // Update table status
  async updateTableStatus(id, status) {
    await pool.query(
      'UPDATE tables SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, id]
    );
    return await this.getTableById(id);
  }

  formatTable(row) {
    return {
      id: row.id,
      tableNumber: row.table_number,
      qrSlug: row.qr_slug,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

module.exports = new TableService();


