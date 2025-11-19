const pool = require('../config/db');

class Product {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.price = parseFloat(data.price);
    this.image = data.image;
    this.calories = data.calories || 0;
    this.category = data.category;
    this.popular = data.popular || false;
    this.isNew = data.is_new || false;
    this.isActive = data.is_active !== undefined ? data.is_active : true;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      image: this.image,
      calories: this.calories,
      category: this.category,
      popular: this.popular,
      new: this.isNew,
    };
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM products WHERE is_active = TRUE';
    const params = [];
    let paramCount = 1;

    if (filters.category && filters.category !== 'All') {
      query += ` AND category = $${paramCount++}`;
      params.push(filters.category);
    }

    if (filters.popular) {
      query += ' AND popular = TRUE';
    }

    query += ' ORDER BY category, name';

    const result = await pool.query(query, params);
    return result.rows.map(row => new Product(row));
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM products WHERE id = $1 AND is_active = TRUE', [id]);
    return result.rows.length > 0 ? new Product(result.rows[0]) : null;
  }

  static async getCategories() {
    const result = await pool.query(
      'SELECT DISTINCT category FROM products WHERE is_active = TRUE ORDER BY category'
    );
    return result.rows.map(row => ({
      id: row.category,
      name: row.category,
    }));
  }
}

module.exports = Product;


