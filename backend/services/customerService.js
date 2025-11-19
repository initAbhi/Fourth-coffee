const Customer = require('../models/Customer');
const pool = require('../config/db');
const { generateId } = require('../utils/uuid');

class CustomerService {
  // Get or create customer by phone
  async getOrCreateCustomer(phone, name = null, email = null) {
    let customer = await Customer.findByPhone(phone);
    
    if (!customer) {
      customer = await Customer.create({ phone, name, email });
      // Initialize loyalty points
      await this.initializeLoyaltyPoints(customer.id);
    }
    
    return customer;
  }

  // Initialize loyalty points for customer
  async initializeLoyaltyPoints(customerId) {
    const id = generateId();
    await pool.query(
      `INSERT INTO loyalty_points (id, customer_id, points, earned_points, redeemed_points)
       VALUES ($1, $2, 0, 0, 0)`,
      [id, customerId]
    );
  }

  // Wallet functionality removed - using only loyalty points

  // Get customer with loyalty points
  async getCustomerProfile(customerId) {
    const customer = await Customer.findById(customerId);
    if (!customer) return null;

    const loyaltyResult = await pool.query(
      'SELECT * FROM loyalty_points WHERE customer_id = $1',
      [customerId]
    );

    return {
      ...customer.toJSON(),
      loyaltyPoints: loyaltyResult.rows[0] || null,
    };
  }

  // Get loyalty point transactions
  async getLoyaltyPointTransactions(customerId, limit = 50) {
    const result = await pool.query(
      `SELECT * FROM loyalty_point_transactions
       WHERE customer_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [customerId, limit]
    );
    return result.rows;
  }

  // Get wallet transactions
  async getWalletTransactions(customerId, limit = 50) {
    const result = await pool.query(
      `SELECT * FROM wallet_transactions
       WHERE customer_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [customerId, limit]
    );
    return result.rows;
  }

  // Add loyalty points
  async addLoyaltyPoints(customerId, points, orderId = null, description = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update loyalty points
      await client.query(
        `UPDATE loyalty_points
         SET points = points + $1,
             earned_points = earned_points + $1,
             last_updated = CURRENT_TIMESTAMP
         WHERE customer_id = $2`,
        [points, customerId]
      );

      // Create transaction record
      const transactionId = generateId();
      await client.query(
        `INSERT INTO loyalty_point_transactions
         (id, customer_id, order_id, transaction_type, points, description)
         VALUES ($1, $2, $3, 'earned', $4, $5)`,
        [transactionId, customerId, orderId, points, description]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Redeem loyalty points (for wallet top-up)
  async redeemLoyaltyPoints(customerId, points, description = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if customer has enough points
      const pointsResult = await client.query(
        'SELECT points FROM loyalty_points WHERE customer_id = $1',
        [customerId]
      );

      if (pointsResult.rows.length === 0 || pointsResult.rows[0].points < points) {
        throw new Error('Insufficient loyalty points');
      }

      // Update loyalty points
      await client.query(
        `UPDATE loyalty_points
         SET points = points - $1,
             redeemed_points = redeemed_points + $1,
             last_updated = CURRENT_TIMESTAMP
         WHERE customer_id = $2`,
        [points, customerId]
      );

      // Create transaction record
      const transactionId = generateId();
      await client.query(
        `INSERT INTO loyalty_point_transactions
         (id, customer_id, transaction_type, points, description)
         VALUES ($1, $2, 'redeemed', $3, $4)`,
        [transactionId, customerId, points, description]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Top-up wallet using loyalty points
  async topUpWalletFromPoints(customerId, points, conversionRate = 0.1) {
    // Default: 1 point = 0.1 currency unit (e.g., 10 points = 1 rupee)
    const amount = points * conversionRate;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Redeem points
      await this.redeemLoyaltyPoints(customerId, points, `Wallet top-up: ${points} points`);

      // Get current wallet balance
      const walletResult = await client.query(
        'SELECT id, balance FROM wallet WHERE customer_id = $1',
        [customerId]
      );

      if (walletResult.rows.length === 0) {
        throw new Error('Wallet not found');
      }

      const wallet = walletResult.rows[0];
      const balanceBefore = parseFloat(wallet.balance);
      const balanceAfter = balanceBefore + amount;

      // Update wallet balance
      await client.query(
        `UPDATE wallet SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE customer_id = $2`,
        [balanceAfter, customerId]
      );

      // Create wallet transaction (pending approval)
      const transactionId = generateId();
      await client.query(
        `INSERT INTO wallet_transactions
         (id, wallet_id, customer_id, transaction_type, amount, balance_before, balance_after, points_used, status, description)
         VALUES ($1, $2, $3, 'topup', $4, $5, $6, $7, 'pending', $8)`,
        [
          transactionId,
          wallet.id,
          customerId,
          amount,
          balanceBefore,
          balanceAfter,
          points,
          `Top-up using ${points} loyalty points`
        ]
      );

      await client.query('COMMIT');
      return { transactionId, amount, balanceAfter };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Approve wallet top-up (Manager only)
  async approveWalletTopUp(transactionId, approvedBy) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE wallet_transactions
         SET status = 'approved', approved_at = CURRENT_TIMESTAMP, approved_by = $1
         WHERE id = $2 AND status = 'pending'
         RETURNING *`,
        [approvedBy, transactionId]
      );

      if (result.rows.length === 0) {
        throw new Error('Transaction not found or already processed');
      }

      const transaction = result.rows[0];

      // If not already applied, apply the transaction
      if (transaction.status === 'approved') {
        await client.query(
          `UPDATE wallet SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [transaction.balance_after, transaction.wallet_id]
        );
      }

      await client.query('COMMIT');
      return transaction;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new CustomerService();


