const Product = require('../models/Product');
const pool = require('../config/db');

class ProductController {
  // Get all products
  async getAllProducts(req, res) {
    try {
      const filters = {
        category: req.query.category,
        popular: req.query.popular === 'true',
      };
      const products = await Product.findAll(filters);
      res.json({
        success: true,
        data: products.map(p => p.toJSON()),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get product by ID
  async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      res.json({
        success: true,
        data: product.toJSON(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get categories
  async getCategories(req, res) {
    try {
      const categories = await Product.getCategories();
      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get product options (milk, size, etc.)
  async getProductOptions(req, res) {
    try {
      const { type } = req.query;
      let query = 'SELECT * FROM product_options WHERE is_active = TRUE';
      const params = [];

      if (type) {
        query += ' AND option_type = $1';
        params.push(type);
      }

      query += ' ORDER BY display_order, name';

      const result = await pool.query(query, params);
      res.json({
        success: true,
        data: result.rows.map(row => ({
          name: row.name,
          price: parseFloat(row.price_modifier),
          type: row.option_type,
        })),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new ProductController();


