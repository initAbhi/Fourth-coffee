const customerService = require('../services/customerService');
const Customer = require('../models/Customer');
const { generateId } = require('../utils/uuid');

// Simple session store (in production, use Redis or JWT)
const customerSessions = new Map();

class CustomerAuthController {
  // Login/Register customer by phone
  async login(req, res) {
    try {
      const { phone, name } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          error: 'Phone number is required',
        });
      }

      // Get or create customer
      const customer = await customerService.getOrCreateCustomer(phone, name || null, null);
      
      // Get customer profile with points and wallet
      const profile = await customerService.getCustomerProfile(customer.id);

      // Create session
      const sessionId = generateId();
      const session = {
        sessionId,
        customerId: customer.id,
        phone: customer.phone,
        name: customer.name,
        loginTime: Date.now(),
      };

      customerSessions.set(sessionId, session);

      res.json({
        success: true,
        data: {
          sessionId,
          customer: {
            id: customer.id,
            phone: customer.phone,
            name: customer.name,
          },
          loyaltyPoints: profile.loyaltyPoints,
          wallet: profile.wallet,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Verify customer session
  verifySession(req, res) {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID is required',
        });
      }

      const session = customerSessions.get(sessionId);

      if (!session) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired session',
        });
      }

      res.json({
        success: true,
        data: {
          customer: {
            id: session.customerId,
            phone: session.phone,
            name: session.name,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get session (helper method)
  static getSession(sessionId) {
    return customerSessions.get(sessionId);
  }
}

module.exports = new CustomerAuthController();


