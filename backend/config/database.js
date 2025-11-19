// In-memory database stores
// TODO: Replace with actual database (PostgreSQL, MongoDB, etc.)

const Table = require('../models/Table');
const Order = require('../models/Order');
const { generateId, generateOrderNumber } = require('../utils/uuid');

const tables = new Map();
const orders = new Map();
const printJobs = new Map();

// Initialize with default tables
const initializeDefaultTables = () => {
  // Clear existing tables
  tables.clear();

  // Create 12 tables (T-01 to T-12)
  for (let i = 1; i <= 12; i++) {
    const tableNumber = `T-${String(i).padStart(2, '0')}`;
    const id = generateId();
    const table = new Table({
      id,
      tableNumber,
      qrSlug: tableNumber,
      status: 'idle',
      createdAt: Date.now(),
    });
    tables.set(id, table);
  }

  console.log(`✅ Seeded ${tables.size} tables:`, Array.from(tables.values()).map(t => t.tableNumber).join(', '));
};

// Initialize with dummy orders for testing
const initializeDummyOrders = () => {
  // Clear existing orders
  orders.clear();

  const tableArray = Array.from(tables.values());
  if (tableArray.length === 0) {
    console.log('⚠️  No tables available, skipping dummy orders');
    return;
  }

  // Get some table IDs for dummy orders
  const table1 = tableArray.find(t => t.tableNumber === 'T-02');
  const table2 = tableArray.find(t => t.tableNumber === 'T-03');
  const table3 = tableArray.find(t => t.tableNumber === 'T-04');
  const table4 = tableArray.find(t => t.tableNumber === 'T-08');
  const table5 = tableArray.find(t => t.tableNumber === 'T-10');

  const now = Date.now();

  // Pending orders (will show in Paid Orders sidebar)
  if (table1) {
    const order1 = new Order({
      id: generateId(),
      orderNumber: generateOrderNumber(),
      tableId: table1.id,
      tableNumber: table1.tableNumber,
      items: [
        { name: 'Cappuccino', quantity: 2, price: 150, modifiers: ['Soy Milk', 'Large'] },
        { name: 'Butter Croissant', quantity: 1, price: 100 }
      ],
      total: 400,
      status: 'pending',
      paymentMethod: 'UPI - GPay',
      customerName: 'Rajesh Kumar',
      customerPhone: '+91 98765-43210',
      createdAt: now - 120000, // 2 minutes ago
    });
    orders.set(order1.id, order1);
  }

  if (table2) {
    const order2 = new Order({
      id: generateId(),
      orderNumber: generateOrderNumber(),
      tableId: table2.id,
      tableNumber: table2.tableNumber,
      items: [
        { name: 'Classic Espresso', quantity: 1, price: 120 },
        { name: 'Chocolate Chip Cookie', quantity: 2, price: 80 }
      ],
      total: 280,
      status: 'pending',
      paymentMethod: 'Card',
      customerName: 'Priya Sharma',
      customerPhone: '+91 98765-43211',
      createdAt: now - 60000, // 1 minute ago
    });
    orders.set(order2.id, order2);
  }

  if (table3) {
    const order3 = new Order({
      id: generateId(),
      orderNumber: generateOrderNumber(),
      tableId: table3.id,
      tableNumber: table3.tableNumber,
      items: [
        { name: 'Cold Brew', quantity: 1, price: 180, modifiers: ['Extra Ice'] },
        { name: 'Butter Croissant', quantity: 1, price: 100 }
      ],
      total: 280,
      status: 'pending',
      paymentMethod: 'UPI - PhonePe',
      customerName: 'Amit Patel',
      customerPhone: '+91 98765-43212',
      customerNotes: 'Customer waiting, please prioritize',
      createdAt: now - 30000, // 30 seconds ago
    });
    orders.set(order3.id, order3);
  }

  // Approved orders (will show on floor plan as preparing/aging)
  if (table4) {
    const order4 = new Order({
      id: generateId(),
      orderNumber: generateOrderNumber(),
      tableId: table4.id,
      tableNumber: table4.tableNumber,
      items: [
        { name: 'Latte', quantity: 2, price: 150, modifiers: ['Oat Milk'] },
        { name: 'Chocolate Chip Cookie', quantity: 1, price: 80 }
      ],
      total: 380,
      status: 'approved',
      paymentMethod: 'UPI - GPay',
      customerName: 'Sneha Reddy',
      customerPhone: '+91 98765-43213',
      createdAt: now - 180000, // 3 minutes ago
      approvedAt: now - 180000,
    });
    order4.addTimelineEntry('Order Approved', 'Cashier');
    orders.set(order4.id, order4);
    
    // Update table status
    table4.updateStatus('occupied');
  }

  if (table5) {
    const order5 = new Order({
      id: generateId(),
      orderNumber: generateOrderNumber(),
      tableId: table5.id,
      tableNumber: table5.tableNumber,
      items: [
        { name: 'Classic Espresso', quantity: 1, price: 120 }
      ],
      total: 120,
      status: 'approved',
      paymentMethod: 'Card',
      customerName: 'Vikram Singh',
      customerPhone: '+91 98765-43214',
      createdAt: now - 360000, // 6 minutes ago
      approvedAt: now - 360000,
    });
    order5.addTimelineEntry('Order Approved', 'Cashier');
    orders.set(order5.id, order5);
    
    // Update table status
    table5.updateStatus('occupied');
  }

  console.log(`✅ Seeded ${orders.size} dummy orders`);
};

// Initialize both tables and orders
// Don't auto-initialize - this is old in-memory database, not used anymore
// initializeDefaultTables();
// initializeDummyOrders();

module.exports = {
  tables,
  orders,
  printJobs,
  initializeDefaultTables,
};

