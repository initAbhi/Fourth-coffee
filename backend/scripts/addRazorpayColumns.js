const pool = require('../config/db');

async function addRazorpayColumns() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Adding Razorpay columns to payments table...');

    // Check if columns exist before adding
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      AND column_name IN ('razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature', 'gateway', 'status', 'currency', 'completed_at')
    `);

    const existingColumns = checkColumns.rows.map(row => row.column_name);

    // Add razorpay_order_id
    if (!existingColumns.includes('razorpay_order_id')) {
      await client.query(`
        ALTER TABLE payments 
        ADD COLUMN razorpay_order_id VARCHAR(255)
      `);
      console.log('✅ Added razorpay_order_id column');
    }

    // Add razorpay_payment_id
    if (!existingColumns.includes('razorpay_payment_id')) {
      await client.query(`
        ALTER TABLE payments 
        ADD COLUMN razorpay_payment_id VARCHAR(255)
      `);
      console.log('✅ Added razorpay_payment_id column');
    }

    // Add razorpay_signature
    if (!existingColumns.includes('razorpay_signature')) {
      await client.query(`
        ALTER TABLE payments 
        ADD COLUMN razorpay_signature VARCHAR(255)
      `);
      console.log('✅ Added razorpay_signature column');
    }

    // Add gateway
    if (!existingColumns.includes('gateway')) {
      await client.query(`
        ALTER TABLE payments 
        ADD COLUMN gateway VARCHAR(50) DEFAULT 'razorpay'
      `);
      console.log('✅ Added gateway column');
    }

    // Add status
    if (!existingColumns.includes('status')) {
      await client.query(`
        ALTER TABLE payments 
        ADD COLUMN status VARCHAR(50) DEFAULT 'pending'
      `);
      console.log('✅ Added status column');
    }

    // Add currency
    if (!existingColumns.includes('currency')) {
      await client.query(`
        ALTER TABLE payments 
        ADD COLUMN currency VARCHAR(10) DEFAULT 'INR'
      `);
      console.log('✅ Added currency column');
    }

    // Add completed_at
    if (!existingColumns.includes('completed_at')) {
      await client.query(`
        ALTER TABLE payments 
        ADD COLUMN completed_at TIMESTAMP
      `);
      console.log('✅ Added completed_at column');
    }

    await client.query('COMMIT');
    console.log('✅ All Razorpay columns added successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error adding columns:', error.message);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
}

// Run if executed directly
if (require.main === module) {
  addRazorpayColumns().catch(error => {
    console.error('Failed to add columns:', error);
    process.exit(1);
  });
}

module.exports = addRazorpayColumns;

