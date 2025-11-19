const refundService = require('../services/refundService');

class RefundController {
  // Create refund request
  async createRefundRequest(req, res) {
    try {
      const { orderId, amount, reason, requestedBy } = req.body;

      if (!orderId || !reason) {
        return res.status(400).json({
          success: false,
          error: 'Order ID and reason are required',
        });
      }

      const refund = await refundService.createRefundRequest({
        orderId,
        amount,
        reason,
        requestedBy,
      });

      res.status(201).json({
        success: true,
        data: refund,
        message: 'Refund request created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get all refunds
  async getAllRefunds(req, res) {
    try {
      const filters = {
        status: req.query.status,
        orderId: req.query.orderId,
        limit: req.query.limit ? parseInt(req.query.limit) : null,
      };
      const refunds = await refundService.getAllRefunds(filters);

      res.json({
        success: true,
        data: refunds,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get refund by ID
  async getRefundById(req, res) {
    try {
      const { id } = req.params;
      const refund = await refundService.getRefundById(id);

      if (!refund) {
        return res.status(404).json({
          success: false,
          error: 'Refund not found',
        });
      }

      res.json({
        success: true,
        data: refund,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Approve refund (Manager only)
  async approveRefund(req, res) {
    try {
      const { id } = req.params;
      const { approvedBy } = req.body;

      if (!approvedBy) {
        return res.status(400).json({
          success: false,
          error: 'Approved by is required',
        });
      }

      const refund = await refundService.approveRefund(id, approvedBy);

      res.json({
        success: true,
        data: refund,
        message: 'Refund approved and processed',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Reject refund (Manager only)
  async rejectRefund(req, res) {
    try {
      const { id } = req.params;
      const { rejectedBy, rejectionReason } = req.body;

      if (!rejectedBy || !rejectionReason) {
        return res.status(400).json({
          success: false,
          error: 'Rejected by and rejection reason are required',
        });
      }

      const refund = await refundService.rejectRefund(id, rejectedBy, rejectionReason);

      res.json({
        success: true,
        data: refund,
        message: 'Refund rejected',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new RefundController();


