const orderService = require('../services/orderService');
const tableService = require('../services/tableService');
const SocketService = require('../services/socketService');
const PrinterService = require('../services/printerService');

class OrderController {
  // Get all orders with optional filters
  async getAllOrders(req, res) {
    try {
      const filters = {
        status: req.query.status,
        tableId: req.query.tableId,
        paymentStatus: req.query.paymentStatus,
        limit: req.query.limit ? parseInt(req.query.limit) : null,
        startDate: req.query.startDate || null,
        endDate: req.query.endDate || null,
      };
      const orders = await orderService.getAllOrders(filters);
      res.json({
        success: true,
        data: orders,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get order by ID
  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        });
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Create new order (from customer QR scan or cashier)
  async createOrder(req, res) {
    try {
      const { 
        table, 
        items, 
        total, 
        paymentMethod, 
        paymentStatus,
        customerName, 
        customerPhone, 
        customerNotes,
        customizations,
        isCashierOrder,
        confirmedBy
      } = req.body;

      if (!table) {
        return res.status(400).json({
          success: false,
          error: 'Table number or slug is required',
        });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Order must contain at least one item',
        });
      }

      // Find table by slug or number
      let tableObj = await tableService.getTableBySlug(table);
      if (!tableObj) {
        const allTables = await tableService.getAllTables();
        tableObj = allTables.find(t => t.tableNumber === table);
      }

      if (!tableObj) {
        return res.status(404).json({
          success: false,
          error: 'Table not found',
        });
      }

      // For cashier orders, payment is mandatory
      if (isCashierOrder && !paymentMethod) {
        return res.status(400).json({
          success: false,
          error: 'Payment method is required for cashier orders',
        });
      }

      const orderData = {
        tableId: tableObj.id,
        tableNumber: tableObj.tableNumber,
        items,
        customizations: customizations || [],
        total,
        paymentMethod,
        paymentStatus, // Allow explicit payment status (for Pay Later and Loyalty Points)
        customerName,
        customerPhone,
        customerNotes,
        isCashierOrder: isCashierOrder || false,
        confirmedBy,
      };

      const order = await orderService.createOrder(orderData);

      // Emit new order event to cashiers
      const socketService = SocketService.getInstance();
      if (socketService) {
        socketService.emitNewOrder(order);
      }

      res.status(201).json({
        success: true,
        data: order,
        message: 'Order created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Confirm payment for cashier order
  async confirmPayment(req, res) {
    try {
      const { id } = req.params;
      const { paymentMethod, isManualFlag, cardMachineUsed, notes, confirmedBy } = req.body;

      if (!paymentMethod) {
        return res.status(400).json({
          success: false,
          error: 'Payment method is required',
        });
      }

      const order = await orderService.confirmPayment(id, {
        paymentMethod,
        isManualFlag: isManualFlag || false,
        cardMachineUsed: cardMachineUsed || false,
        notes,
        confirmedBy,
      });

      const socketService = SocketService.getInstance();
      if (socketService) {
        socketService.emitOrderUpdate(order);
      }

      res.json({
        success: true,
        data: order,
        message: 'Payment confirmed successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Confirm order (cashier approves)
  async confirmOrder(req, res) {
    try {
      const { id } = req.params;
      const { actor = 'Cashier' } = req.body;

      const order = await orderService.approveOrder(id, actor);

      // Queue print job
      const printerService = PrinterService.getInstance();
      if (printerService) {
        printerService.queuePrint(id);
      }

      // Emit updates
      const socketService = SocketService.getInstance();
      if (socketService) {
        socketService.emitOrderUpdate(order);
        if (printerService) {
          socketService.emitKOTUpdate(order, printerService.getPrintStatus(id));
        }
      }

      res.json({
        success: true,
        data: order,
        message: 'Order confirmed and KOT queued for printing',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Reject order
  async rejectOrder(req, res) {
    try {
      const { id } = req.params;
      const { reason = '', actor = 'Cashier' } = req.body;

      const order = await orderService.rejectOrder(id, reason, actor);

      const socketService = SocketService.getInstance();
      if (socketService) {
        socketService.emitOrderUpdate(order);
      }

      res.json({
        success: true,
        data: order,
        message: 'Order rejected',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Mark order as served
  async markServed(req, res) {
    try {
      const { id } = req.params;
      const { actor = 'Cashier' } = req.body;

      const order = await orderService.markServed(id, actor);

      const socketService = SocketService.getInstance();
      if (socketService) {
        socketService.emitOrderUpdate(order);
      }

      res.json({
        success: true,
        data: order,
        message: 'Order marked as served',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get tables with payment status
  async getTablesWithPaymentStatus(req, res) {
    try {
      const tables = await orderService.getTablesWithPaymentStatus();
      res.json({
        success: true,
        data: tables,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new OrderController();

