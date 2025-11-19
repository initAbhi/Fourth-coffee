const pool = require('../config/db');
const { generateId } = require('../utils/uuid');
const orderService = require('./orderService');
const customerService = require('./customerService');

class RefundService {
  // Create refund request
  async createRefundRequest(data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const order = await orderService.getOrderById(data.orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.paymentStatus !== 'paid') {
        throw new Error('Can only refund paid orders');
      }

      const refundId = generateId();
      await client.query(
        `INSERT INTO refunds (
          id, order_id, customer_id, amount, reason, status, requested_by
        ) VALUES ($1, $2, $3, $4, $5, 'pending', $6)`,
        [
          refundId,
          data.orderId,
          order.customerId,
          data.amount || order.total,
          data.reason,
          data.requestedBy,
        ]
      );

      await client.query('COMMIT');
      return await this.getRefundById(refundId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get refund by ID
  async getRefundById(id) {
    const result = await pool.query('SELECT * FROM refunds WHERE id = $1', [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Get all refunds with filters
  async getAllRefunds(filters = {}) {
    let query = `
      SELECT 
        r.*,
        o.order_number as order_number
      FROM refunds r
      LEFT JOIN orders o ON r.order_id = o.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.status) {
      query += ` AND r.status = $${paramCount++}`;
      params.push(filters.status);
    }

    if (filters.orderId) {
      query += ` AND r.order_id = $${paramCount++}`;
      params.push(filters.orderId);
    }

    query += ' ORDER BY r.created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramCount++}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Approve refund (Manager only)
  async approveRefund(refundId, approvedBy) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const refund = await this.getRefundById(refundId);
      if (!refund) {
        throw new Error('Refund not found');
      }

      if (refund.status !== 'pending') {
        throw new Error(`Refund is already ${refund.status}`);
      }

      // Update refund status
      await client.query(
        `UPDATE refunds
         SET status = 'approved',
             approved_by = $1,
             approved_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [approvedBy, refundId]
      );

      // Process refund based on original payment method
      const order = await orderService.getOrderById(refund.order_id);
      if (!order) {
        throw new Error('Order not found');
      }

      // Update order payment status
      await client.query(
        `UPDATE orders
         SET payment_status = 'refunded'
         WHERE id = $1`,
        [refund.order_id]
      );

      // Process refund to customer
      if (order.paymentMethod === 'Wallet') {
        // Refund to wallet
        await this.refundToWallet(client, refund.customer_id, refund.amount, refund.order_id);
      } else {
        // For other payment methods, mark as refunded (actual refund handled externally)
        // Could add logic here to track refund transactions
      }

      // Mark refund as completed
      await client.query(
        `UPDATE refunds SET refunded_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [refundId]
      );

      await client.query('COMMIT');
      return await this.getRefundById(refundId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Reject refund (Manager only)
  async rejectRefund(refundId, rejectedBy, rejectionReason) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const refund = await this.getRefundById(refundId);
      if (!refund) {
        throw new Error('Refund not found');
      }

      if (refund.status !== 'pending') {
        throw new Error(`Refund is already ${refund.status}`);
      }

      await client.query(
        `UPDATE refunds
         SET status = 'rejected',
             rejected_by = $1,
             rejection_reason = $2,
             rejected_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [rejectedBy, rejectionReason, refundId]
      );

      await client.query('COMMIT');
      return await this.getRefundById(refundId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Refund to wallet
  async refundToWallet(client, customerId, amount, orderId) {
    if (!customerId) return;

    const walletResult = await client.query(
      'SELECT id, balance FROM wallet WHERE customer_id = $1',
      [customerId]
    );

    if (walletResult.rows.length === 0) {
      // Initialize wallet if doesn't exist
      const walletId = generateId();
      await client.query(
        `INSERT INTO wallet (id, customer_id, balance) VALUES ($1, $2, $3)`,
        [walletId, customerId, amount]
      );

      const transactionId = generateId();
      await client.query(
        `INSERT INTO wallet_transactions (
          id, wallet_id, customer_id, transaction_type, amount,
          balance_before, balance_after, order_id, status, description
        ) VALUES ($1, $2, $3, 'refund', $4, 0, $4, $5, 'approved', $6)`,
        [
          transactionId,
          walletId,
          customerId,
          amount,
          orderId,
          `Refund for order ${orderId}`,
        ]
      );
    } else {
      const wallet = walletResult.rows[0];
      const balanceBefore = parseFloat(wallet.balance);
      const balanceAfter = balanceBefore + amount;

      await client.query(
        'UPDATE wallet SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [balanceAfter, wallet.id]
      );

      const transactionId = generateId();
      await client.query(
        `INSERT INTO wallet_transactions (
          id, wallet_id, customer_id, transaction_type, amount,
          balance_before, balance_after, order_id, status, description
        ) VALUES ($1, $2, $3, 'refund', $4, $5, $6, $7, 'approved', $8)`,
        [
          transactionId,
          wallet.id,
          customerId,
          amount,
          balanceBefore,
          balanceAfter,
          orderId,
          `Refund for order ${orderId}`,
        ]
      );
    }
  }
}

module.exports = new RefundService();


