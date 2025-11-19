const pool = require('../config/db');
const { generateId, generateOrderNumber } = require('../utils/uuid');
const customerService = require('./customerService');

class OrderService {
  // Create order
  async createOrder(data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get or create customer if phone provided
      let customerId = null;
      if (data.customerPhone) {
        const customer = await customerService.getOrCreateCustomer(
          data.customerPhone,
          data.customerName,
          null
        );
        customerId = customer.id;
      }

      const id = generateId();
      const orderNumber = generateOrderNumber();
      const isCashierOrder = data.isCashierOrder || false;
      
      // Determine payment status: use explicit status if provided, otherwise determine from payment method
      let paymentStatus;
      if (data.paymentStatus) {
        paymentStatus = data.paymentStatus; // Explicit status (for Pay Later or Loyalty Points)
      } else if (isCashierOrder) {
        paymentStatus = 'unpaid'; // Cashier orders start unpaid
      } else {
        paymentStatus = data.paymentMethod ? 'paid' : 'unpaid';
      }
      
      // Handle Loyalty Points payment - deduct points before creating order
      // Note: We'll deduct points after order creation to have orderNumber available

      // Insert order
      const result = await client.query(
        `INSERT INTO orders (
          id, order_number, table_id, table_number, customer_id,
          items, customizations, total, status, payment_status,
          payment_method, payment_confirmed, is_cashier_order,
          customer_name, customer_phone, customer_notes, timeline
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *`,
        [
          id,
          orderNumber,
          data.tableId,
          data.tableNumber,
          customerId,
          JSON.stringify(data.items || []),
          JSON.stringify(data.customizations || []),
          data.total,
          'pending',
          paymentStatus,
          data.paymentMethod || null,
          paymentStatus === 'paid' && data.paymentMethod ? true : false,
          isCashierOrder,
          data.customerName || null,
          data.customerPhone || null,
          data.customerNotes || null,
          JSON.stringify([{
            action: 'Order Created',
            actor: isCashierOrder ? 'Cashier' : 'Customer',
            notes: '',
            timestamp: Date.now(),
          }]),
        ]
      );

      // Update table status to occupied when order is created
      // This ensures tables show as occupied when they have orders
      // Note: If table was manually set to idle, it will be overridden by new order
      // This is expected behavior - new orders should occupy tables
      if (data.tableId) {
        await client.query(
          `UPDATE tables 
           SET status = 'occupied', updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [data.tableId]
        );
      }

      // If payment is confirmed, create payment record
      if (paymentStatus === 'paid' && data.paymentMethod) {
        // Handle Loyalty Points payment - deduct points
        if (data.paymentMethod === 'Loyalty Points' && customerId) {
          const pointsRequired = Math.ceil(data.total);
          await customerService.redeemLoyaltyPoints(
            customerId,
            pointsRequired,
            `Order payment: ${orderNumber}`
          );
        }
        
        await this.createPaymentRecord(client, {
          orderId: id,
          customerId,
          amount: data.total,
          paymentMethod: data.paymentMethod,
          paymentType: this.getPaymentType(data.paymentMethod),
          confirmedBy: data.confirmedBy || null,
        });
        
        // Add timeline entry for payment
        await this.addTimelineEntry(client, id, 'Payment Confirmed', 'Customer');
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get order by ID
  async getOrderById(id) {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    return result.rows.length > 0 ? this.formatOrder(result.rows[0]) : null;
  }

  // Get all orders with filters
  async getAllOrders(filters = {}) {
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.status) {
      query += ` AND status = $${paramCount++}`;
      params.push(filters.status);
    }

    if (filters.tableId) {
      query += ` AND table_id = $${paramCount++}`;
      params.push(filters.tableId);
    }

    if (filters.paymentStatus) {
      query += ` AND payment_status = $${paramCount++}`;
      params.push(filters.paymentStatus);
    }

    if (filters.startDate) {
      query += ` AND created_at >= $${paramCount++}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND created_at <= $${paramCount++}`;
      params.push(filters.endDate);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramCount++}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    return result.rows.map(row => this.formatOrder(row));
  }

  // Confirm payment for cashier order
  async confirmPayment(orderId, paymentData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const order = await this.getOrderById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.paymentStatus === 'paid') {
        throw new Error('Order already paid');
      }

      // Update order payment status
      await client.query(
        `UPDATE orders
         SET payment_status = 'paid',
             payment_method = $1,
             payment_confirmed = TRUE,
             payment_confirmed_at = CURRENT_TIMESTAMP,
             payment_confirmed_by = $2
         WHERE id = $3`,
        [paymentData.paymentMethod, paymentData.confirmedBy, orderId]
      );

      // Create payment record
      await this.createPaymentRecord(client, {
        orderId,
        customerId: order.customerId,
        amount: order.total,
        paymentMethod: paymentData.paymentMethod,
        paymentType: this.getPaymentType(paymentData.paymentMethod),
        isManualFlag: paymentData.isManualFlag || false,
        cardMachineUsed: paymentData.cardMachineUsed || false,
        confirmedBy: paymentData.confirmedBy,
        notes: paymentData.notes,
      });

      // If wallet payment, deduct from wallet
      if (paymentData.paymentMethod === 'Wallet') {
        await this.processWalletPayment(client, order.customerId, order.total, orderId);
      }

      // Add timeline entry
      await this.addTimelineEntry(client, orderId, 'Payment Confirmed', paymentData.confirmedBy || 'Cashier');

      await client.query('COMMIT');
      return await this.getOrderById(orderId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Approve order
  async approveOrder(orderId, actor = 'Cashier') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const order = await this.getOrderById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'pending') {
        throw new Error(`Order is already ${order.status}`);
      }

      // For cashier orders, payment must be confirmed
      if (order.isCashierOrder && order.paymentStatus !== 'paid') {
        throw new Error('Payment must be confirmed before approving cashier order');
      }

      await client.query(
        `UPDATE orders
         SET status = 'approved', approved_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [orderId]
      );

      await this.addTimelineEntry(client, orderId, 'Order Approved', actor);

      // Award loyalty points (1 point = ₹1)
      if (order.customerId && order.paymentStatus === 'paid') {
        const points = Math.floor(order.total); // 1 point per ₹1
        if (points > 0) {
          await customerService.addLoyaltyPoints(
            order.customerId,
            points,
            orderId,
            `Points earned for order ${order.orderNumber}`
          );
        }
      }

      await client.query('COMMIT');
      return await this.getOrderById(orderId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Reject order
  async rejectOrder(orderId, reason = '', actor = 'Cashier') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const order = await this.getOrderById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      await client.query(
        `UPDATE orders SET status = 'rejected' WHERE id = $1`,
        [orderId]
      );

      await this.addTimelineEntry(client, orderId, 'Order Rejected', actor, reason);

      // Reset table status
      if (order.tableId) {
        await client.query(
          'UPDATE tables SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['idle', order.tableId]
        );
      }

      await client.query('COMMIT');
      return await this.getOrderById(orderId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Mark order as served
  async markServed(orderId, actor = 'Cashier') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const order = await this.getOrderById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      await client.query(
        `UPDATE orders SET status = 'served', served_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [orderId]
      );

      await this.addTimelineEntry(client, orderId, 'Order Served', actor);

      // Keep table status as 'occupied' - don't reset to idle yet
      // Table will be reset to idle only when cashier explicitly marks it idle
      // This allows cashier to see served orders before clearing the table
      if (order.tableId) {
        await client.query(
          'UPDATE tables SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [order.tableId]
        );
      }

      await client.query('COMMIT');
      return await this.getOrderById(orderId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get paid/unpaid tables
  async getTablesWithPaymentStatus() {
    // Get the most recent active order for each table (including served orders)
    // Priority: pending > approved > served (most recent of each)
    const result = await pool.query(`
      SELECT 
        t.*,
        o.id as order_id,
        o.payment_status,
        o.total,
        o.customer_name,
        o.customer_phone,
        o.status as order_status,
        o.served_at,
        o.created_at as order_created_at,
        o.approved_at as order_approved_at,
        o.items as order_items
      FROM tables t
      LEFT JOIN LATERAL (
        SELECT *
        FROM orders
        WHERE table_id = t.id 
          AND status IN ('pending', 'approved', 'served')
        ORDER BY 
          CASE status
            WHEN 'pending' THEN 1
            WHEN 'approved' THEN 2
            WHEN 'served' THEN 3
            ELSE 4
          END,
          created_at DESC
        LIMIT 1
      ) o ON true
      ORDER BY t.table_number
    `);
    
    return result.rows.map(row => {
      // If table status is 'idle' in database AND no order exists, return idle
      // BUT if there's a served order, we should show it even if table status is idle
      // (this handles the case where table was reset but order still exists)
      const tableStatus = row.status;
      const hasOrder = row.order_id !== null;
      
      // CRITICAL: If table status is 'idle' in database, ALWAYS return idle
      // Table status is the source of truth - don't show orders for idle tables
      if (tableStatus === 'idle') {
        return {
          id: row.id,
          tableNumber: row.table_number,
          qrSlug: row.qr_slug,
          status: 'idle', // Always idle if table status is idle
          orderId: null, // Don't show orders for idle tables
          paymentStatus: null,
          total: null,
          customerName: null,
          customerPhone: null,
          orderStatus: null,
          isPaid: false,
        };
      }
      
      // If table is occupied, include order data
      return {
        id: row.id,
        tableNumber: row.table_number,
        qrSlug: row.qr_slug,
        status: tableStatus, // Table status from database ('occupied')
        orderId: row.order_id,
        paymentStatus: row.payment_status,
        total: row.total ? parseFloat(row.total) : null,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        orderStatus: row.order_status, // 'pending', 'approved', or 'served'
        orderServedAt: row.served_at,
        orderCreatedAt: row.order_created_at,
        orderApprovedAt: row.order_approved_at,
        orderItems: row.order_items,
        isPaid: row.payment_status === 'paid',
      };
    });
  }

  // Helper methods
  formatOrder(row) {
    return {
      id: row.id,
      orderNumber: row.order_number,
      tableId: row.table_id,
      tableNumber: row.table_number,
      customerId: row.customer_id,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
      customizations: typeof row.customizations === 'string' ? JSON.parse(row.customizations) : row.customizations,
      total: parseFloat(row.total),
      status: row.status,
      paymentStatus: row.payment_status,
      paymentMethod: row.payment_method,
      paymentConfirmed: row.payment_confirmed,
      paymentConfirmedAt: row.payment_confirmed_at,
      paymentConfirmedBy: row.payment_confirmed_by,
      isCashierOrder: row.is_cashier_order,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerNotes: row.customer_notes,
      createdAt: row.created_at,
      approvedAt: row.approved_at,
      servedAt: row.served_at,
      timeline: typeof row.timeline === 'string' ? JSON.parse(row.timeline) : row.timeline,
    };
  }

  getPaymentType(paymentMethod) {
    if (!paymentMethod) return 'cash';
    const method = paymentMethod.toLowerCase();
    if (method.includes('upi')) return 'upi';
    if (method.includes('card')) return 'card';
    if (method.includes('wallet')) return 'wallet';
    return 'cash';
  }

  async createPaymentRecord(client, data) {
    const paymentId = generateId();
    await client.query(
      `INSERT INTO payments (
        id, order_id, customer_id, amount, payment_method, payment_type,
        is_manual_flag, card_machine_used, confirmed_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        paymentId,
        data.orderId,
        data.customerId,
        data.amount,
        data.paymentMethod,
        data.paymentType,
        data.isManualFlag || false,
        data.cardMachineUsed || false,
        data.confirmedBy,
        data.notes || null,
      ]
    );
    return paymentId;
  }

  async processWalletPayment(client, customerId, amount, orderId) {
    if (!customerId) return;

    const walletResult = await client.query(
      'SELECT id, balance FROM wallet WHERE customer_id = $1',
      [customerId]
    );

    if (walletResult.rows.length === 0) {
      throw new Error('Wallet not found');
    }

    const wallet = walletResult.rows[0];
    const balanceBefore = parseFloat(wallet.balance);
    
    if (balanceBefore < amount) {
      throw new Error('Insufficient wallet balance');
    }

    const balanceAfter = balanceBefore - amount;

    await client.query(
      'UPDATE wallet SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [balanceAfter, wallet.id]
    );

    // Create wallet transaction
    const transactionId = generateId();
    await client.query(
      `INSERT INTO wallet_transactions (
        id, wallet_id, customer_id, transaction_type, amount,
        balance_before, balance_after, order_id, status, description
      ) VALUES ($1, $2, $3, 'payment', $4, $5, $6, $7, 'approved', $8)`,
      [
        transactionId,
        wallet.id,
        customerId,
        amount,
        balanceBefore,
        balanceAfter,
        orderId,
        `Payment for order ${orderId}`,
      ]
    );
  }

  async addTimelineEntry(client, orderId, action, actor = 'System', notes = '') {
    const order = await client.query('SELECT timeline FROM orders WHERE id = $1', [orderId]);
    if (order.rows.length === 0) return;

    const timeline = typeof order.rows[0].timeline === 'string' 
      ? JSON.parse(order.rows[0].timeline) 
      : order.rows[0].timeline || [];

    timeline.push({
      action,
      actor,
      notes,
      timestamp: Date.now(),
    });

    await client.query(
      'UPDATE orders SET timeline = $1 WHERE id = $2',
      [JSON.stringify(timeline), orderId]
    );
  }
}

module.exports = new OrderService();


