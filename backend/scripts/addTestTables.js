const pool = require('../config/db');
const { generateId } = require('../utils/uuid');

const addTestTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check existing tables
    const existingResult = await client.query('SELECT table_number FROM tables');
    const existingNumbers = existingResult.rows.map(r => r.table_number);

    // Add 4 tables if they don't exist
    const tablesToAdd = ['T-01', 'T-02', 'T-03', 'T-04'];
    let added = 0;

    for (const tableNumber of tablesToAdd) {
      if (!existingNumbers.includes(tableNumber)) {
        const id = generateId();
        await client.query(
          `INSERT INTO tables (id, table_number, qr_slug, status)
           VALUES ($1, $2, $3, $4)`,
          [id, tableNumber, tableNumber, 'idle']
        );
        added++;
        console.log(`✅ Created table ${tableNumber}`);
      } else {
        console.log(`⏭️  Table ${tableNumber} already exists`);
      }
    }

    await client.query('COMMIT');
    console.log(`✅ Added ${added} new tables. Total tables: ${existingNumbers.length + added}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error adding tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

addTestTables()
  .then(() => {
    console.log('✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });


