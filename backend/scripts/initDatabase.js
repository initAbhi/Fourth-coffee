const setupDatabase = require('../config/setupDatabase');
const pool = require('../config/db');
const { generateId } = require('../utils/uuid');

const initializeDefaultData = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check if tables already exist
    const tablesCheck = await client.query(`
      SELECT COUNT(*) FROM tables
    `);

    if (tablesCheck.rows[0].count === '0') {
      // Create 4 default tables for testing
      for (let i = 1; i <= 4; i++) {
        const tableNumber = `T-${String(i).padStart(2, '0')}`;
        const id = generateId();
        await client.query(`
          INSERT INTO tables (id, table_number, qr_slug, status)
          VALUES ($1, $2, $3, $4)
        `, [id, tableNumber, tableNumber, 'idle']);
      }
      console.log('✅ Created 4 default tables');
    }

    // Check if cashiers exist
    const cashiersCheck = await client.query(`
      SELECT COUNT(*) FROM cashiers
    `);

    if (cashiersCheck.rows[0].count === '0') {
      // Create default cashier (password: cashier123)
      const cashierId = generateId();
      await client.query(`
        INSERT INTO cashiers (id, user_id, name, password_hash, role)
        VALUES ($1, $2, $3, $4, $5)
      `, [cashierId, 'cashier1', 'Default Cashier', 'cashier123', 'cashier']);

      // Create default manager (password: manager123)
      const managerId = generateId();
      await client.query(`
        INSERT INTO cashiers (id, user_id, name, password_hash, role)
        VALUES ($1, $2, $3, $4, $5)
      `, [managerId, 'manager1', 'Default Manager', 'manager123', 'manager']);

      console.log('✅ Created default cashier and manager accounts');
      console.log('   Cashier: user_id=cashier1, password=cashier123');
      console.log('   Manager: user_id=manager1, password=manager123');
    }

    await client.query('COMMIT');
    console.log('✅ Default data initialized');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error initializing default data:', error);
    throw error;
  } finally {
    client.release();
  }
};

const seedData = require('./seedData');

const run = async () => {
  try {
    console.log('🚀 Setting up database...');
    await setupDatabase();
    await initializeDefaultData();
    await seedData();
    console.log('✅ Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
};

// Only run if this file is executed directly (not when required)
if (require.main === module) {
  run();
}

