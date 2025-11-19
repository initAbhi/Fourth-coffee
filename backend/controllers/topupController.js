const topupService = require('../services/topupService');

class TopupController {
  // Get all active offers
  async getOffers(req, res) {
    try {
      const offers = await topupService.getActiveOffers();
      res.json({
        success: true,
        data: offers,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Process top-up
  async processTopup(req, res) {
    try {
      const { customerId, amount, offerId } = req.body;

      if (!customerId || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Customer ID and amount are required',
        });
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid amount',
        });
      }

      const result = await topupService.processTopup(customerId, amountNum, offerId);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new TopupController();

