const pool = require('../config/db');
const { generateId } = require('../utils/uuid');
const QRCode = require('qrcode');

class CentralInventoryController {
  // Get all inventory items
  async getInventory(req, res) {
    try {
      const { category, status, search } = req.query;
      
      let query = 'SELECT * FROM central_inventory WHERE 1=1';
      const params = [];
      let paramCount = 0;

      if (category) {
        paramCount++;
        query += ` AND category = $${paramCount}`;
        params.push(category);
      }

      if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(status);
      }

      if (search) {
        paramCount++;
        query += ` AND (item_name ILIKE $${paramCount} OR sku ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      query += ' ORDER BY item_name';

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get single inventory item
  async getInventoryItem(req, res) {
    try {
      const { sku } = req.params;
      const result = await pool.query(
        'SELECT * FROM central_inventory WHERE sku = $1',
        [sku]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Item not found',
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Create dispatch order
  async createDispatchOrder(req, res) {
    const client = await pool.connect();
    try {
      const { cafeId, items, createdBy } = req.body;

      if (!cafeId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Cafe ID and items are required',
        });
      }

      await client.query('BEGIN');

      // Generate order number
      const orderNumber = `DISP-${Date.now()}`;
      const orderId = generateId();

      // Calculate total cost and validate items
      let totalCost = 0;
      const validatedItems = [];

      for (const item of items) {
        const invResult = await client.query(
          'SELECT * FROM central_inventory WHERE sku = $1',
          [item.sku]
        );

        if (invResult.rows.length === 0) {
          throw new Error(`Item with SKU ${item.sku} not found`);
        }

        const invItem = invResult.rows[0];
        const itemCost = parseFloat(invItem.cost_price) * parseFloat(item.quantity);
        totalCost += itemCost;

        validatedItems.push({
          sku: item.sku,
          itemName: invItem.item_name,
          quantity: parseFloat(item.quantity),
          costPrice: parseFloat(invItem.cost_price),
          unit: invItem.unit,
        });
      }

      // Create dispatch order
      await client.query(
        `INSERT INTO dispatch_orders 
         (id, order_number, cafe_id, items, total_cost, status, created_by, created_at)
         VALUES ($1, $2, $3, $4, $5, 'pending', $6, CURRENT_TIMESTAMP)`,
        [orderId, orderNumber, cafeId, JSON.stringify(validatedItems), totalCost, createdBy]
      );

      // Generate QR code with batch information
      const qrData = {
        orderId,
        orderNumber,
        cafeId,
        items: validatedItems,
        totalCost,
        createdAt: new Date().toISOString(),
      };

      const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

      // Update dispatch order with QR code
      await client.query(
        'UPDATE dispatch_orders SET qr_code = $1 WHERE id = $2',
        [qrCode, orderId]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        data: {
          id: orderId,
          orderNumber,
          cafeId,
          items: validatedItems,
          totalCost,
          qrCode,
          status: 'pending',
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      res.status(500).json({
        success: false,
        error: error.message,
      });
    } finally {
      client.release();
    }
  }

  // Get dispatch order
  async getDispatchOrder(req, res) {
    try {
      const { orderId } = req.params;
      const result = await pool.query(
        'SELECT * FROM dispatch_orders WHERE id = $1',
        [orderId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Dispatch order not found',
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new CentralInventoryController();

