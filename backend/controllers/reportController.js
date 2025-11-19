const reportService = require('../services/reportService');

class ReportController {
  // Generate daily report
  async generateDailyReport(req, res) {
    try {
      const { date } = req.query;
      const report = await reportService.generateDailyReport(date);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Generate weekly report
  async generateWeeklyReport(req, res) {
    try {
      const { startDate } = req.query;
      const report = await reportService.generateWeeklyReport(startDate);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Generate monthly report
  async generateMonthlyReport(req, res) {
    try {
      const { year, month } = req.query;
      const report = await reportService.generateMonthlyReport(
        year ? parseInt(year) : null,
        month ? parseInt(month) : null
      );

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get saved reports
  async getSavedReports(req, res) {
    try {
      const { reportType, limit } = req.query;
      const reports = await reportService.getSavedReports(
        reportType || null,
        limit ? parseInt(limit) : 50
      );

      res.json({
        success: true,
        data: reports,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new ReportController();


