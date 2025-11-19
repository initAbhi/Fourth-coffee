const PrinterService = require('../services/printerService');
const { printJobs } = require('../config/database');

class PrinterController {
  // Get printer health
  getHealth(req, res) {
    try {
      const printerService = PrinterService.getInstance();
      if (!printerService) {
        return res.status(503).json({
          success: false,
          error: 'Printer service not initialized',
        });
      }
      const health = printerService.getHealth();
      res.json({
        success: true,
        data: health,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get print status for an order
  getPrintStatus(req, res) {
    try {
      const { orderId } = req.params;
      const printerService = PrinterService.getInstance();
      if (!printerService) {
        return res.status(503).json({
          success: false,
          error: 'Printer service not initialized',
        });
      }
      const status = printerService.getPrintStatus(orderId);

      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'Print job not found',
        });
      }

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Retry print job
  retryPrint(req, res) {
    try {
      const { orderId } = req.params;
      const printerService = PrinterService.getInstance();
      if (!printerService) {
        return res.status(503).json({
          success: false,
          error: 'Printer service not initialized',
        });
      }
      const success = printerService.retryPrint(orderId);

      if (!success) {
        return res.status(400).json({
          success: false,
          error: 'Cannot retry this print job',
        });
      }

      res.json({
        success: true,
        message: 'Print job queued for retry',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get all print jobs
  getAllPrintJobs(req, res) {
    try {
      const jobs = Array.from(printJobs.values()).map(job => job.toJSON ? job.toJSON() : job);
      res.json({
        success: true,
        data: jobs,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new PrinterController();

