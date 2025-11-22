const pool = require('../config/db');
const { generateId } = require('../utils/uuid');

const createAdmin = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check if admin already exists
    const existingAdmin = await client.query(
      'SELECT * FROM admins WHERE username = $1',
      ['admin']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('⚠️  Admin user already exists');
      console.log('   Username: admin');
      console.log('   If you forgot the password, you can update it manually in the database');
      await client.query('ROLLBACK');
      return;
    }

    // Create admin user
    const adminId = generateId();
    await client.query(
      `INSERT INTO admins (id, username, email, password_hash, name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
      [
        adminId,
        'admin',
        'admin@cafeflow.com',
        'admin123', // Plain text password for development
        'Admin User',
        'super_admin',
      ]
    );

    await client.query('COMMIT');
    console.log('✅ Admin user created successfully!');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   You can now login at /admin/login');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
};

createAdmin();

