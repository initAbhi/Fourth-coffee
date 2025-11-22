const pool = require('../config/db');
const { generateId } = require('../utils/uuid');

class MarketingController {
  // Get all campaigns
  async getCampaigns(req, res) {
    try {
      const { status, limit = 50 } = req.query;
      
      let query = 'SELECT * FROM marketing_campaigns WHERE 1=1';
      const params = [];
      let paramCount = 0;

      if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(status);
      }

      query += ' ORDER BY created_at DESC LIMIT $' + (paramCount + 1);
      params.push(parseInt(limit));

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

  // Create campaign
  async createCampaign(req, res) {
    try {
      const {
        name,
        templateName,
        message,
        audienceSegment,
        mediaUrl,
        couponQr,
        personalizationTags,
        scheduledAt,
        createdBy,
      } = req.body;

      if (!name || !message || !audienceSegment || !createdBy) {
        return res.status(400).json({
          success: false,
          error: 'Name, message, audience segment, and created by are required',
        });
      }

      const campaignId = generateId();
      const status = scheduledAt ? 'scheduled' : 'draft';

      await pool.query(
        `INSERT INTO marketing_campaigns 
         (id, name, template_name, message, audience_segment, media_url, coupon_qr, 
          personalization_tags, status, scheduled_at, created_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)`,
        [
          campaignId,
          name,
          templateName || null,
          message,
          audienceSegment,
          mediaUrl || null,
          couponQr || null,
          JSON.stringify(personalizationTags || {}),
          status,
          scheduledAt || null,
          createdBy,
        ]
      );

      res.json({
        success: true,
        data: {
          id: campaignId,
          name,
          status,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Send campaign
  async sendCampaign(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'SELECT * FROM marketing_campaigns WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found',
        });
      }

      const campaign = result.rows[0];

      // Get target customers based on audience segment
      let customersQuery = 'SELECT * FROM customers WHERE 1=1';
      const customersParams = [];

      if (campaign.audience_segment === 'frequent') {
        // Customers with high order count (top 30%)
        customersQuery += `
          AND id IN (
            SELECT customer_id FROM orders 
            WHERE customer_id IS NOT NULL 
            GROUP BY customer_id 
            HAVING COUNT(*) >= (
              SELECT COUNT(*) * 0.3 FROM orders WHERE customer_id IS NOT NULL
            )
          )
        `;
      } else if (campaign.audience_segment === 'dormant') {
        // Customers with no orders in last 30 days
        customersQuery += `
          AND id NOT IN (
            SELECT DISTINCT customer_id FROM orders 
            WHERE customer_id IS NOT NULL 
            AND created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
          )
        `;
      } else if (campaign.audience_segment === 'vip') {
        // Customers with high loyalty points
        customersQuery += `
          AND id IN (
            SELECT customer_id FROM loyalty_points 
            WHERE points >= 500
          )
        `;
      }
      // 'all' segment - no filter needed

      const customersResult = await pool.query(customersQuery, customersParams);
      const customers = customersResult.rows;

      // Update campaign status
      await pool.query(
        `UPDATE marketing_campaigns 
         SET status = 'sent', sent_at = CURRENT_TIMESTAMP, sent_count = $1
         WHERE id = $2`,
        [customers.length, id]
      );

      // In production, this would integrate with WhatsApp API
      // For now, we'll just log it
      console.log(`📱 Marketing campaign "${campaign.name}" sent to ${customers.length} customers`);

      res.json({
        success: true,
        data: {
          id,
          sentCount: customers.length,
          status: 'sent',
          message: `Campaign sent to ${customers.length} customers`,
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

module.exports = new MarketingController();

