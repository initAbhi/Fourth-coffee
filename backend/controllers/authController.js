const pool = require('../config/db');
const { generateId } = require('../utils/uuid');

// Session expiration time: 24 hours
const SESSION_EXPIRY_HOURS = 24;

class AuthController {
  // Clean up expired sessions (call this periodically)
  async cleanupExpiredSessions() {
    try {
      await pool.query(
        'DELETE FROM cashier_sessions WHERE expires_at < CURRENT_TIMESTAMP'
      );
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }

  // Login cashier
  async login(req, res) {
    const client = await pool.connect();
    try {
      const { userId, password } = req.body;

      if (!userId || !password) {
        return res.status(400).json({
          success: false,
          error: 'User ID and password are required',
        });
      }

      // Find cashier by userId
      const result = await client.query(
        'SELECT * FROM cashiers WHERE user_id = $1 AND is_active = TRUE',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }

      const cashierRow = result.rows[0];

      // Verify password (simple check - in production use bcrypt)
      if (cashierRow.password_hash !== password) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }

      await client.query('BEGIN');

      // Update last login
      await client.query(
        'UPDATE cashiers SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [cashierRow.id]
      );

      // Delete any existing sessions for this cashier
      await client.query(
        'DELETE FROM cashier_sessions WHERE cashier_id = $1',
        [cashierRow.id]
      );

      // Create new session in database
      const sessionId = generateId();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + SESSION_EXPIRY_HOURS);

      await client.query(
        `INSERT INTO cashier_sessions 
         (session_id, cashier_id, user_id, name, role, login_time, expires_at, last_activity)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, CURRENT_TIMESTAMP)`,
        [
          sessionId,
          cashierRow.id,
          cashierRow.user_id,
          cashierRow.name,
          cashierRow.role,
          expiresAt,
        ]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        data: {
          sessionId,
          cashier: {
            id: cashierRow.id,
            userId: cashierRow.user_id,
            name: cashierRow.name,
            role: cashierRow.role,
            isActive: cashierRow.is_active,
          },
        },
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

  // Verify session
  async verifySession(req, res) {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID is required',
        });
      }

      // Clean up expired sessions first
      await this.cleanupExpiredSessions();

      // Check session in database
      const result = await pool.query(
        `SELECT s.*, c.is_active as cashier_active
         FROM cashier_sessions s
         JOIN cashiers c ON s.cashier_id = c.id
         WHERE s.session_id = $1 AND s.expires_at > CURRENT_TIMESTAMP`,
        [sessionId]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired session',
        });
      }

      const session = result.rows[0];

      // Check if cashier is still active
      if (!session.cashier_active) {
        // Delete session if cashier is inactive
        await pool.query('DELETE FROM cashier_sessions WHERE session_id = $1', [sessionId]);
        return res.status(401).json({
          success: false,
          error: 'Cashier account is inactive',
        });
      }

      // Update last activity
      await pool.query(
        'UPDATE cashier_sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_id = $1',
        [sessionId]
      );

      res.json({
        success: true,
        data: {
          cashier: {
            userId: session.user_id,
            name: session.name,
            role: session.role,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Logout
  async logout(req, res) {
    try {
      const { sessionId } = req.body;

      if (sessionId) {
        await pool.query('DELETE FROM cashier_sessions WHERE session_id = $1', [sessionId]);
      }

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get session (helper method)
  static async getSession(sessionId) {
    try {
      const result = await pool.query(
        'SELECT * FROM cashier_sessions WHERE session_id = $1 AND expires_at > CURRENT_TIMESTAMP',
        [sessionId]
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }
}

module.exports = new AuthController();

