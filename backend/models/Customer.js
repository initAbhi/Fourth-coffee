const pool = require('../config/db');
const { generateId } = require('../utils/uuid');

class Customer {
  constructor(data) {
    this.id = data.id;
    this.phone = data.phone;
    this.name = data.name;
    this.email = data.email;
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
  }

  toJSON() {
    return {
      id: this.id,
      phone: this.phone,
      name: this.name,
      email: this.email,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static async findByPhone(phone) {
    const result = await pool.query(
      'SELECT * FROM customers WHERE phone = $1',
      [phone]
    );
    return result.rows.length > 0 ? new Customer(result.rows[0]) : null;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM customers WHERE id = $1',
      [id]
    );
    return result.rows.length > 0 ? new Customer(result.rows[0]) : null;
  }

  static async create(data) {
    const id = generateId();
    const result = await pool.query(
      `INSERT INTO customers (id, phone, name, email)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, data.phone, data.name || null, data.email || null]
    );
    return new Customer(result.rows[0]);
  }

  static async update(id, data) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(data.email);
    }
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE customers SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows.length > 0 ? new Customer(result.rows[0]) : null;
  }

  async save() {
    if (this.id) {
      return Customer.update(this.id, {
        name: this.name,
        email: this.email,
      });
    }
    return Customer.create({
      phone: this.phone,
      name: this.name,
      email: this.email,
    });
  }
}

module.exports = Customer;


