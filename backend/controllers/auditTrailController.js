const pool = require('../config/db');
const { generateId } = require('../utils/uuid');

class AuditTrailController {
  // Get audit logs
  async getAuditLogs(req, res) {
    try {
      const { 
        limit = 100, 
        offset = 0, 
        action, 
        actor, 
        entityType,
        search 
      } = req.query;

      let query = 'SELECT * FROM audit_trail WHERE 1=1';
      const params = [];
      let paramCount = 1;

      if (action) {
        query += ` AND action = $${paramCount++}`;
        params.push(action);
      }

      if (actor) {
        query += ` AND actor = $${paramCount++}`;
        params.push(actor);
      }

      if (entityType) {
        query += ` AND entity_type = $${paramCount++}`;
        params.push(entityType);
      }

      if (search) {
        query += ` AND (
          action ILIKE $${paramCount} OR 
          actor ILIKE $${paramCount} OR 
          entity_id ILIKE $${paramCount} OR 
          details ILIKE $${paramCount}
        )`;
        params.push(`%${search}%`);
        paramCount++;
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

  // Create audit log (usually called internally)
  async createAuditLog(req, res) {
    try {
      const { action, actor, entityType, entityId, details, ipAddress } = req.body;

      if (!action || !actor || !entityType || !entityId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      const id = generateId();
      const result = await pool.query(
        `INSERT INTO audit_trail (id, action, actor, entity_type, entity_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [id, action, actor, entityType, entityId, details || null, ipAddress || null]
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

  // Get unique actions and actors for filters
  async getFilterOptions(req, res) {
    try {
      const actionsResult = await pool.query(
        'SELECT DISTINCT action FROM audit_trail ORDER BY action'
      );
      const actorsResult = await pool.query(
        'SELECT DISTINCT actor FROM audit_trail ORDER BY actor'
      );
      const entityTypesResult = await pool.query(
        'SELECT DISTINCT entity_type FROM audit_trail ORDER BY entity_type'
      );

      res.json({
        success: true,
        data: {
          actions: actionsResult.rows.map(r => r.action),
          actors: actorsResult.rows.map(r => r.actor),
          entityTypes: entityTypesResult.rows.map(r => r.entity_type),
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

module.exports = new AuditTrailController();

