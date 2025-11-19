const pool = require('./db');

const setupDatabase = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create customers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(255) PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255),
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create loyalty_points table
    await client.query(`
      CREATE TABLE IF NOT EXISTS loyalty_points (
        id VARCHAR(255) PRIMARY KEY,
        customer_id VARCHAR(255) REFERENCES customers(id) ON DELETE CASCADE,
        points INTEGER NOT NULL DEFAULT 0,
        earned_points INTEGER DEFAULT 0,
        redeemed_points INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create loyalty_point_transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS loyalty_point_transactions (
        id VARCHAR(255) PRIMARY KEY,
        customer_id VARCHAR(255) REFERENCES customers(id) ON DELETE CASCADE,
        order_id VARCHAR(255),
        transaction_type VARCHAR(50) NOT NULL, -- 'earned', 'redeemed', 'expired', 'topup'
        points INTEGER NOT NULL,
        description TEXT,
        expiry_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create wallet table
    await client.query(`
      CREATE TABLE IF NOT EXISTS wallet (
        id VARCHAR(255) PRIMARY KEY,
        customer_id VARCHAR(255) REFERENCES customers(id) ON DELETE CASCADE UNIQUE,
        balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create wallet_transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id VARCHAR(255) PRIMARY KEY,
        wallet_id VARCHAR(255) REFERENCES wallet(id) ON DELETE CASCADE,
        customer_id VARCHAR(255) REFERENCES customers(id) ON DELETE CASCADE,
        transaction_type VARCHAR(50) NOT NULL, -- 'topup', 'payment', 'refund'
        amount DECIMAL(10, 2) NOT NULL,
        balance_before DECIMAL(10, 2) NOT NULL,
        balance_after DECIMAL(10, 2) NOT NULL,
        order_id VARCHAR(255),
        points_used INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP,
        approved_by VARCHAR(255)
      )
    `);

    // Create tables table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tables (
        id VARCHAR(255) PRIMARY KEY,
        table_number VARCHAR(50) UNIQUE NOT NULL,
        qr_slug VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'idle', -- 'idle', 'occupied', 'reserved'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create orders table (enhanced)
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        order_number VARCHAR(100) UNIQUE NOT NULL,
        table_id VARCHAR(255) REFERENCES tables(id),
        table_number VARCHAR(50),
        customer_id VARCHAR(255) REFERENCES customers(id),
        items JSONB NOT NULL,
        customizations JSONB DEFAULT '[]'::jsonb,
        total DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'served', 'cancelled'
        payment_status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'paid', 'refunded'
        payment_method VARCHAR(100), -- 'Cash', 'UPI', 'Card', 'Wallet', 'UPI - GPay', etc.
        payment_confirmed BOOLEAN DEFAULT FALSE,
        payment_confirmed_at TIMESTAMP,
        payment_confirmed_by VARCHAR(255),
        is_cashier_order BOOLEAN DEFAULT FALSE,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(20),
        customer_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP,
        served_at TIMESTAMP,
        timeline JSONB DEFAULT '[]'::jsonb
      )
    `);

    // Create payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(255) PRIMARY KEY,
        order_id VARCHAR(255) REFERENCES orders(id) ON DELETE CASCADE,
        customer_id VARCHAR(255) REFERENCES customers(id),
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(100) NOT NULL,
        payment_type VARCHAR(50) NOT NULL, -- 'card', 'upi', 'cash', 'wallet'
        is_manual_flag BOOLEAN DEFAULT FALSE,
        card_machine_used BOOLEAN DEFAULT FALSE,
        transaction_id VARCHAR(255),
        confirmed_by VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create refunds table
    await client.query(`
      CREATE TABLE IF NOT EXISTS refunds (
        id VARCHAR(255) PRIMARY KEY,
        order_id VARCHAR(255) REFERENCES orders(id) ON DELETE CASCADE,
        customer_id VARCHAR(255) REFERENCES customers(id),
        amount DECIMAL(10, 2) NOT NULL,
        reason VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
        requested_by VARCHAR(255),
        approved_by VARCHAR(255),
        rejected_by VARCHAR(255),
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP,
        rejected_at TIMESTAMP,
        refunded_at TIMESTAMP
      )
    `);

    // Create cashiers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cashiers (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'cashier', -- 'cashier', 'manager'
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);

    // Create cashier_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cashier_sessions (
        session_id VARCHAR(255) PRIMARY KEY,
        cashier_id VARCHAR(255) REFERENCES cashiers(id) ON DELETE CASCADE,
        user_id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index on expires_at for cleanup
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cashier_sessions_expires_at 
      ON cashier_sessions(expires_at)
    `);

    // Create reports table (for storing report metadata)
    await client.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id VARCHAR(255) PRIMARY KEY,
        report_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
        period_start TIMESTAMP NOT NULL,
        period_end TIMESTAMP NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255)
      )
    `);

    // Create products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image VARCHAR(500),
        calories INTEGER DEFAULT 0,
        category VARCHAR(100) NOT NULL,
        popular BOOLEAN DEFAULT FALSE,
        is_new BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create product_options table (for milk, size options)
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_options (
        id VARCHAR(255) PRIMARY KEY,
        option_type VARCHAR(50) NOT NULL, -- 'milk', 'size', 'sugar', 'temperature'
        name VARCHAR(100) NOT NULL,
        price_modifier DECIMAL(10, 2) DEFAULT 0,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create topup_offers table (for loyalty points top-up offers)
    await client.query(`
      CREATE TABLE IF NOT EXISTS topup_offers (
        id VARCHAR(255) PRIMARY KEY,
        amount DECIMAL(10, 2) NOT NULL,
        points INTEGER NOT NULL,
        bonus_points INTEGER DEFAULT 0,
        description VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create wastage_log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS wastage_log (
        id VARCHAR(255) PRIMARY KEY,
        item_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL,
        unit VARCHAR(50) NOT NULL DEFAULT 'pieces',
        reason TEXT NOT NULL,
        recorded_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create audit_trail table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_trail (
        id VARCHAR(255) PRIMARY KEY,
        action VARCHAR(255) NOT NULL,
        actor VARCHAR(255) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(255) NOT NULL,
        details TEXT,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create admin_messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_messages (
        id VARCHAR(255) PRIMARY KEY,
        from_user VARCHAR(255) NOT NULL,
        to_user VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        priority VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high'
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_loyalty_points_customer_id ON loyalty_points(customer_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_wallet_customer_id ON wallet(customer_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_wastage_log_created_at ON wastage_log(created_at)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON audit_trail(created_at)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_trail_actor ON audit_trail(actor)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_admin_messages_read ON admin_messages(read)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_admin_messages_created_at ON admin_messages(created_at)`);

    await client.query('COMMIT');
    console.log('✅ Database tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = setupDatabase;

