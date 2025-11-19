const Cashier = require('../models/Cashier');
const { generateId } = require('../utils/uuid');

const cashiers = new Map();

// Initialize with default cashiers
const initializeCashiers = () => {
  cashiers.clear();

  // Default cashier credentials
  // Username: cashier1
  // Password: cafe123
  const cashier1 = new Cashier({
    id: generateId(),
    userId: 'cashier1',
    name: 'John Doe',
    passwordHash: 'cafe123', // In production, hash with bcrypt
    role: 'cashier',
    isActive: true,
    createdAt: Date.now(),
  });
  cashiers.set(cashier1.id, cashier1);

  console.log(`✅ Seeded ${cashiers.size} cashier account(s)`);
  console.log(`📝 Default Cashier Credentials:`);
  console.log(`   Username: cashier1`);
  console.log(`   Password: cafe123`);
};

initializeCashiers();

module.exports = {
  cashiers,
  initializeCashiers,
};

