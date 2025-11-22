const Razorpay = require('razorpay');
const crypto = require('crypto');
const pool = require('../config/db');
const { generateId } = require('../utils/uuid');
const orderService = require('./orderService');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

class PaymentService {
  // Create Razorpay order
  async createRazorpayOrder(amount, currency = 'INR') {
    try {
      const options = {
        amount: Math.round(amount * 100), // Convert to paisa
        currency,
        receipt: `receipt_order_${Date.now()}_${Math.floor(Math.random() * 1000)}`
      };
      
      const order = await razorpay.orders.create(options);
      return order;
    } catch (error) {
      console.error('Razorpay order creation error:', error);
      throw new Error(`Failed to create Razorpay order: ${error.message}`);
    }
  }

  // Verify Razorpay payment signature
  verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature) {
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');
    
    return generated_signature === razorpay_signature;
  }

  // Create payment record
  async createPaymentRecord(data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const paymentId = generateId();
      
      await client.query(
        `INSERT INTO payments (
          id, order_id, customer_id, amount, payment_method, payment_type,
          razorpay_order_id, razorpay_payment_id, razorpay_signature,
          gateway, status, currency, transaction_id, confirmed_by, completed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          paymentId,
          data.orderId,
          data.customerId || null,
          data.amount,
          data.paymentMethod || 'Razorpay',
          data.paymentType || 'razorpay',
          data.razorpayOrderId || null,
          data.razorpayPaymentId || null,
          data.razorpaySignature || null,
          data.gateway || 'razorpay',
          data.status || 'completed',
          data.currency || 'INR',
          data.transactionId || data.razorpayPaymentId || null,
          data.confirmedBy || null,
          data.status === 'completed' ? new Date() : null
        ]
      );

      await client.query('COMMIT');
      return await this.getPaymentById(paymentId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get payment by ID
  async getPaymentById(paymentId) {
    const result = await pool.query('SELECT * FROM payments WHERE id = $1', [paymentId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Get payment by order ID
  async getPaymentByOrderId(orderId) {
    const result = await pool.query(
      'SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1',
      [orderId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Update payment status
  async updatePaymentStatus(paymentId, status, additionalData = {}) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const updates = ['status = $1'];
      const values = [status, paymentId];
      let paramCount = 2;

      if (additionalData.razorpayPaymentId) {
        updates.push(`razorpay_payment_id = $${paramCount++}`);
        values.splice(-1, 0, additionalData.razorpayPaymentId);
      }

      if (additionalData.razorpaySignature) {
        updates.push(`razorpay_signature = $${paramCount++}`);
        values.splice(-1, 0, additionalData.razorpaySignature);
      }

      if (status === 'completed') {
        updates.push(`completed_at = CURRENT_TIMESTAMP`);
      }

      await client.query(
        `UPDATE payments SET ${updates.join(', ')} WHERE id = $${paramCount}`,
        values
      );

      await client.query('COMMIT');
      return await this.getPaymentById(paymentId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new PaymentService();

