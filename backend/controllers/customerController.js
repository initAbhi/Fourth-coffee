const customerService = require('../services/customerService');

class CustomerController {
  // Get customer profile with loyalty points and wallet
  async getCustomerProfile(req, res) {
    try {
      const { customerId } = req.params;
      const profile = await customerService.getCustomerProfile(customerId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found',
        });
      }

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get customer by phone
  async getCustomerByPhone(req, res) {
    try {
      const { phone } = req.params;
      const Customer = require('../models/Customer');
      const customer = await Customer.findByPhone(phone);

      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found',
        });
      }

      const profile = await customerService.getCustomerProfile(customer.id);
      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get loyalty point transactions
  async getLoyaltyPointTransactions(req, res) {
    try {
      const { customerId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const transactions = await customerService.getLoyaltyPointTransactions(customerId, limit);

      res.json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get wallet transactions
  async getWalletTransactions(req, res) {
    try {
      const { customerId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const transactions = await customerService.getWalletTransactions(customerId, limit);

      res.json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Top-up wallet using loyalty points
  async topUpWalletFromPoints(req, res) {
    try {
      const { customerId } = req.params;
      const { points, conversionRate } = req.body;

      if (!points || points <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Points must be greater than 0',
        });
      }

      const result = await customerService.topUpWalletFromPoints(
        customerId,
        points,
        conversionRate || 0.1
      );

      res.json({
        success: true,
        data: result,
        message: 'Wallet top-up request created. Pending manager approval.',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Approve wallet top-up (Manager only)
  async approveWalletTopUp(req, res) {
    try {
      const { transactionId } = req.params;
      const { approvedBy } = req.body;

      if (!approvedBy) {
        return res.status(400).json({
          success: false,
          error: 'Approved by is required',
        });
      }

      const transaction = await customerService.approveWalletTopUp(transactionId, approvedBy);

      res.json({
        success: true,
        data: transaction,
        message: 'Wallet top-up approved',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new CustomerController();


