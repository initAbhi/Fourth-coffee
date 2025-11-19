const pool = require('../config/db');
const { generateId } = require('../utils/uuid');

const seedData = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check if products already exist
    const productsCheck = await client.query('SELECT COUNT(*) FROM products');
    if (productsCheck.rows[0].count === '0') {
      // Seed Products
      const products = [
        {
          id: generateId(),
          name: 'Classic Espresso',
          description: 'Rich and bold single-origin espresso',
          price: 120,
          image: '/images/coffee-espresso.jpg',
          calories: 5,
          category: 'Coffee',
          popular: true,
          is_new: false,
        },
        {
          id: generateId(),
          name: 'Cappuccino',
          description: 'Creamy espresso with steamed milk',
          price: 150,
          image: '/images/coffee-cappuccino.jpg',
          calories: 120,
          category: 'Coffee',
          popular: true,
          is_new: false,
        },
        {
          id: generateId(),
          name: 'Cold Brew',
          description: 'Smooth, refreshing cold-steeped coffee',
          price: 180,
          image: '/images/coffee-coldbrew.jpg',
          calories: 15,
          category: 'Cold Brew',
          popular: true,
          is_new: false,
        },
        {
          id: generateId(),
          name: 'Butter Croissant',
          description: 'Flaky, buttery French pastry',
          price: 100,
          image: '/images/pastry-croissant.jpg',
          calories: 280,
          category: 'Pastries',
          popular: true,
          is_new: false,
        },
        {
          id: generateId(),
          name: 'Chocolate Chip Cookie',
          description: 'Freshly baked with premium chocolate',
          price: 80,
          image: '/images/cookie-chocolate.jpg',
          calories: 220,
          category: 'Cookies',
          popular: true,
          is_new: false,
        },
      ];

      for (const product of products) {
        await client.query(
          `INSERT INTO products (id, name, description, price, image, calories, category, popular, is_new, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)`,
          [
            product.id,
            product.name,
            product.description,
            product.price,
            product.image,
            product.calories,
            product.category,
            product.popular,
            product.is_new,
          ]
        );
      }
      console.log(`✅ Seeded ${products.length} products`);
    }

    // Check if product options exist
    const optionsCheck = await client.query('SELECT COUNT(*) FROM product_options');
    if (optionsCheck.rows[0].count === '0') {
      // Seed Product Options
      const milkOptions = [
        { name: 'Regular', price: 0, order: 1 },
        { name: 'Soy Milk', price: 10, order: 2 },
        { name: 'Almond Milk', price: 15, order: 3 },
        { name: 'Oat Milk', price: 20, order: 4 },
      ];

      const sizeOptions = [
        { name: 'Small', price: -20, order: 1 },
        { name: 'Regular', price: 0, order: 2 },
        { name: 'Large', price: 30, order: 3 },
      ];

      for (const option of milkOptions) {
        await client.query(
          `INSERT INTO product_options (id, option_type, name, price_modifier, display_order, is_active)
           VALUES ($1, 'milk', $2, $3, $4, TRUE)`,
          [generateId(), option.name, option.price, option.order]
        );
      }

      for (const option of sizeOptions) {
        await client.query(
          `INSERT INTO product_options (id, option_type, name, price_modifier, display_order, is_active)
           VALUES ($1, 'size', $2, $3, $4, TRUE)`,
          [generateId(), option.name, option.price, option.order]
        );
      }
      console.log(`✅ Seeded product options`);
    }

    // Seed sample customers with loyalty points
    const customersCheck = await client.query('SELECT COUNT(*) FROM customers');
    if (customersCheck.rows[0].count === '0') {
      const sampleCustomers = [
        { phone: '+919876543210', name: 'Rajesh Kumar', email: 'rajesh@example.com' },
        { phone: '+919876543211', name: 'Priya Sharma', email: 'priya@example.com' },
        { phone: '+919876543212', name: 'Amit Patel', email: 'amit@example.com' },
        { phone: '+919876543213', name: 'Sneha Reddy', email: 'sneha@example.com' },
        { phone: '+919876543214', name: 'Vikram Singh', email: 'vikram@example.com' },
      ];

      for (const customerData of sampleCustomers) {
        const customerId = generateId();
        await client.query(
          `INSERT INTO customers (id, phone, name, email) VALUES ($1, $2, $3, $4)`,
          [customerId, customerData.phone, customerData.name, customerData.email]
        );

        // Initialize loyalty points (give some initial points)
        const pointsId = generateId();
        const initialPoints = Math.floor(Math.random() * 200) + 50; // 50-250 points
        await client.query(
          `INSERT INTO loyalty_points (id, customer_id, points, earned_points, redeemed_points)
           VALUES ($1, $2, $3, $3, 0)`,
          [pointsId, customerId, initialPoints]
        );

        // Wallet removed - using only loyalty points
      }
      console.log(`✅ Seeded ${sampleCustomers.length} sample customers with points`);
    }

    // Seed top-up offers
    const offersCheck = await client.query('SELECT COUNT(*) FROM topup_offers');
    if (offersCheck.rows[0].count === '0') {
      const offers = [
        { amount: 100, points: 100, bonusPoints: 0, description: '₹100 = 100 points', order: 1 },
        { amount: 250, points: 250, bonusPoints: 0, description: '₹250 = 250 points', order: 2 },
        { amount: 500, points: 550, bonusPoints: 50, description: '₹500 = 550 points (50 bonus)', order: 3 },
        { amount: 1000, points: 1150, bonusPoints: 150, description: '₹1000 = 1150 points (150 bonus)', order: 4 },
        { amount: 2000, points: 2400, bonusPoints: 400, description: '₹2000 = 2400 points (400 bonus)', order: 5 },
      ];

      for (const offer of offers) {
        await client.query(
          `INSERT INTO topup_offers (id, amount, points, bonus_points, description, is_active, display_order)
           VALUES ($1, $2, $3, $4, $5, TRUE, $6)`,
          [generateId(), offer.amount, offer.points, offer.bonusPoints, offer.description, offer.order]
        );
      }
      console.log(`✅ Seeded ${offers.length} top-up offers`);
    }

    // Seed wastage log entries
    const wastageCheck = await client.query('SELECT COUNT(*) FROM wastage_log');
    if (wastageCheck.rows[0].count === '0') {
      const wastageEntries = [
        { itemName: 'Espresso Beans', category: 'Coffee Beans', quantity: 0.5, unit: 'kg', reason: 'Expired stock', recordedBy: 'Cashier 1' },
        { itemName: 'Whole Milk', category: 'Milk', quantity: 2, unit: 'liters', reason: 'Spilled during preparation', recordedBy: 'Cashier 2' },
        { itemName: 'Butter Croissant', category: 'Pastries', quantity: 3, unit: 'pieces', reason: 'Stale - not sold', recordedBy: 'Manager' },
        { itemName: 'Almond Milk', category: 'Milk', quantity: 1, unit: 'liters', reason: 'Damaged packaging', recordedBy: 'Cashier 1' },
        { itemName: 'Chocolate Syrup', category: 'Other', quantity: 0.5, unit: 'liters', reason: 'Leaked container', recordedBy: 'Cashier 2' },
      ];

      for (const entry of wastageEntries) {
        await client.query(
          `INSERT INTO wastage_log (id, item_name, category, quantity, unit, reason, recorded_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [generateId(), entry.itemName, entry.category, entry.quantity, entry.unit, entry.reason, entry.recordedBy]
        );
      }
      console.log(`✅ Seeded ${wastageEntries.length} wastage entries`);
    }

    // Seed audit trail entries
    const auditCheck = await client.query('SELECT COUNT(*) FROM audit_trail');
    if (auditCheck.rows[0].count === '0') {
      const auditEntries = [
        { action: 'Order Created', actor: 'Cashier 1', entityType: 'Order', entityId: 'ORD-001', details: 'Created manual order for Table 5' },
        { action: 'Payment Confirmed', actor: 'Cashier 1', entityType: 'Order', entityId: 'ORD-002', details: 'Payment confirmed via UPI' },
        { action: 'Refund Approved', actor: 'Manager', entityType: 'Refund', entityId: 'REF-001', details: 'Refund approved for Order ORD-003' },
        { action: 'Order Served', actor: 'Cashier 2', entityType: 'Order', entityId: 'ORD-004', details: 'Order marked as served' },
        { action: 'Table Reset', actor: 'Cashier 1', entityType: 'Table', entityId: 'TBL-005', details: 'Table 5 reset to idle' },
        { action: 'Wastage Recorded', actor: 'Cashier 1', entityType: 'Wastage', entityId: 'WST-001', details: 'Recorded wastage: 0.5kg Espresso Beans' },
        { action: 'Message Sent', actor: 'Manager', entityType: 'Message', entityId: 'MSG-001', details: 'Sent message to all cashiers' },
      ];

      for (const entry of auditEntries) {
        // Set timestamps to be spread over the last few days
        const daysAgo = Math.floor(Math.random() * 7);
        const hoursAgo = Math.floor(Math.random() * 24);
        const timestamp = new Date();
        timestamp.setDate(timestamp.getDate() - daysAgo);
        timestamp.setHours(timestamp.getHours() - hoursAgo);

        await client.query(
          `INSERT INTO audit_trail (id, action, actor, entity_type, entity_id, details, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [generateId(), entry.action, entry.actor, entry.entityType, entry.entityId, entry.details, timestamp]
        );
      }
      console.log(`✅ Seeded ${auditEntries.length} audit trail entries`);
    }

    // Seed admin messages
    const messagesCheck = await client.query('SELECT COUNT(*) FROM admin_messages');
    if (messagesCheck.rows[0].count === '0') {
      const messages = [
        { fromUser: 'Manager', toUser: 'All Cashiers', subject: 'New Menu Item Available', message: "We've added a new seasonal latte to the menu. Please familiarize yourself with it.", priority: 'medium' },
        { fromUser: 'Admin', toUser: 'All Staff', subject: 'System Maintenance Tonight', message: 'Scheduled maintenance from 11 PM to 1 AM. System will be unavailable.', priority: 'high' },
        { fromUser: 'Manager', toUser: 'All Cashiers', subject: 'Reminder: End of Day Report', message: 'Please ensure all orders are properly closed before end of shift.', priority: 'low' },
      ];

      for (const msg of messages) {
        const daysAgo = Math.floor(Math.random() * 3);
        const timestamp = new Date();
        timestamp.setDate(timestamp.getDate() - daysAgo);

        await client.query(
          `INSERT INTO admin_messages (id, from_user, to_user, subject, message, priority, read, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [generateId(), msg.fromUser, msg.toUser, msg.subject, msg.message, msg.priority, daysAgo > 1, timestamp]
        );
      }
      console.log(`✅ Seeded ${messages.length} admin messages`);
    }

    await client.query('COMMIT');
    console.log('✅ Seed data completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = seedData;


