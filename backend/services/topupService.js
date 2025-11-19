const pool = require('../config/db');
const { generateId } = require('../utils/uuid');
const customerService = require('./customerService');

class TopupService {
  // Get all active top-up offers
  async getActiveOffers() {
    const result = await pool.query(
      `SELECT * FROM topup_offers 
       WHERE is_active = TRUE 
       ORDER BY display_order ASC, amount ASC`
    );
    return result.rows;
  }

  // Get offer by ID
  async getOfferById(offerId) {
    const result = await pool.query(
      'SELECT * FROM topup_offers WHERE id = $1 AND is_active = TRUE',
      [offerId]
    );
    return result.rows[0] || null;
  }

  // Process top-up (add money, get points with offer)
  async processTopup(customerId, amount, offerId = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let pointsToAdd = Math.floor(amount); // Base: 1 point = ₹1
      let bonusPoints = 0;
      let offer = null;

      // If offer is selected, calculate bonus points
      if (offerId) {
        offer = await this.getOfferById(offerId);
        if (offer && parseFloat(offer.amount) === parseFloat(amount)) {
          pointsToAdd = offer.points;
          bonusPoints = offer.bonus_points || 0;
        }
      } else {
        // Check if there's a matching offer for this amount
        const matchingOffer = await client.query(
          `SELECT * FROM topup_offers 
           WHERE amount = $1 AND is_active = TRUE 
           ORDER BY display_order ASC LIMIT 1`,
          [amount]
        );
        if (matchingOffer.rows.length > 0) {
          offer = matchingOffer.rows[0];
          pointsToAdd = offer.points;
          bonusPoints = offer.bonus_points || 0;
        }
      }

      const totalPoints = pointsToAdd + bonusPoints;

      // Add loyalty points
      const description = bonusPoints > 0
        ? `Top-up: ₹${amount} = ${pointsToAdd} points + ${bonusPoints} bonus points`
        : `Top-up: ₹${amount} = ${pointsToAdd} points`;

      await customerService.addLoyaltyPoints(
        customerId,
        totalPoints,
        null,
        description
      );

      // Create transaction record
      const transactionId = generateId();
      await client.query(
        `INSERT INTO loyalty_point_transactions (
          id, customer_id, transaction_type, points, description
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          transactionId,
          customerId,
          'topup',
          totalPoints,
          description
        ]
      );

      await client.query('COMMIT');

      return {
        success: true,
        amount,
        basePoints: pointsToAdd,
        bonusPoints,
        totalPoints,
        offer: offer ? {
          id: offer.id,
          amount: offer.amount,
          points: offer.points,
          bonusPoints: offer.bonus_points
        } : null
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Create/Update offer (admin function)
  async createOffer(data) {
    const id = generateId();
    await pool.query(
      `INSERT INTO topup_offers (
        id, amount, points, bonus_points, description, is_active, display_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        data.amount,
        data.points,
        data.bonusPoints || 0,
        data.description || null,
        data.isActive !== false,
        data.displayOrder || 0
      ]
    );
    return await this.getOfferById(id);
  }
}

module.exports = new TopupService();

