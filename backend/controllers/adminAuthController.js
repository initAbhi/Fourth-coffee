const pool = require('../config/db');
const { generateId } = require('../utils/uuid');

// Session expiration time: 24 hours
const SESSION_EXPIRY_HOURS = 24;

class AdminAuthController {
  // Clean up expired sessions
  async cleanupExpiredSessions() {
    try {
      await pool.query(
        'DELETE FROM admin_sessions WHERE expires_at < CURRENT_TIMESTAMP'
      );
    } catch (error) {
      console.error('Error cleaning up expired admin sessions:', error);
    }
  }

  // Login admin
  async login(req, res) {
    const client = await pool.connect();
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username and password are required',
        });
      }

      // Find admin by username
      const result = await client.query(
        'SELECT * FROM admins WHERE username = $1 AND is_active = TRUE',
        [username]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }

      const adminRow = result.rows[0];

      // Verify password (simple check - in production use bcrypt)
      if (adminRow.password_hash !== password) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }

      await client.query('BEGIN');

      // Update last login
      await client.query(
        'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [adminRow.id]
      );

      // Delete any existing sessions for this admin
      await client.query(
        'DELETE FROM admin_sessions WHERE admin_id = $1',
        [adminRow.id]
      );

      // Create new session in database
      const sessionId = generateId();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + SESSION_EXPIRY_HOURS);

      await client.query(
        `INSERT INTO admin_sessions 
         (session_id, admin_id, username, name, role, login_time, expires_at, last_activity)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, CURRENT_TIMESTAMP)`,
        [
          sessionId,
          adminRow.id,
          adminRow.username,
          adminRow.name,
          adminRow.role,
          expiresAt,
        ]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        data: {
          sessionId,
          admin: {
            id: adminRow.id,
            username: adminRow.username,
            name: adminRow.name,
            email: adminRow.email,
            role: adminRow.role,
            isActive: adminRow.is_active,
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
        `SELECT s.*, a.is_active as admin_active
         FROM admin_sessions s
         JOIN admins a ON s.admin_id = a.id
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

      // Check if admin is still active
      if (!session.admin_active) {
        // Delete session if admin is inactive
        await pool.query('DELETE FROM admin_sessions WHERE session_id = $1', [sessionId]);
        return res.status(401).json({
          success: false,
          error: 'Admin account is inactive',
        });
      }

      // Update last activity
      await pool.query(
        'UPDATE admin_sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_id = $1',
        [sessionId]
      );

      res.json({
        success: true,
        data: {
          admin: {
            username: session.username,
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
        await pool.query('DELETE FROM admin_sessions WHERE session_id = $1', [sessionId]);
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
        'SELECT * FROM admin_sessions WHERE session_id = $1 AND expires_at > CURRENT_TIMESTAMP',
        [sessionId]
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error getting admin session:', error);
      return null;
    }
  }
}

module.exports = new AdminAuthController();

