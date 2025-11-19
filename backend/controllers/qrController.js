const { generateQRCodeDataURL, generateQRCodeSVG, getTableOrderURL } = require('../utils/qrCode');
const tableService = require('../services/tableService');

class QRController {
  // Get QR code data URL for a table
  async getQRCodeDataURL(req, res) {
    try {
      const { tableId } = req.params;
      const table = await tableService.getTableById(tableId);

      if (!table) {
        return res.status(404).json({
          success: false,
          error: 'Table not found',
        });
      }

      const qrDataURL = await generateQRCodeDataURL(table.qrSlug || table.tableNumber);

      res.json({
        success: true,
        data: {
          qrCode: qrDataURL,
          url: getTableOrderURL(table.qrSlug || table.tableNumber),
          tableNumber: table.tableNumber,
          tableSlug: table.qrSlug || table.tableNumber,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get QR code SVG for a table
  async getQRCodeSVG(req, res) {
    try {
      const { tableId } = req.params;
      const table = await tableService.getTableById(tableId);

      if (!table) {
        return res.status(404).json({
          success: false,
          error: 'Table not found',
        });
      }

      const qrSVG = await generateQRCodeSVG(table.qrSlug || table.tableNumber);

      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(qrSVG);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get QR code info (URL) for a table
  async getQRCodeInfo(req, res) {
    try {
      const { tableId } = req.params;
      const table = await tableService.getTableById(tableId);

      if (!table) {
        return res.status(404).json({
          success: false,
          error: 'Table not found',
        });
      }

      res.json({
        success: true,
        data: {
          url: getTableOrderURL(table.qrSlug || table.tableNumber),
          tableNumber: table.tableNumber,
          tableSlug: table.qrSlug || table.tableNumber,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get all QR codes for all tables
  async getAllQRCodes(req, res) {
    try {
      const allTables = await tableService.getAllTables();
      const qrCodes = await Promise.all(
        allTables.map(async (table) => {
          const qrDataURL = await generateQRCodeDataURL(table.qrSlug || table.tableNumber);
          // console.log('QR Data URL:', qrDataURL);
          return {
            tableId: table.id,
            tableNumber: table.tableNumber,
            tableSlug: table.qrSlug || table.tableNumber,
            qrCode: qrDataURL,
            url: getTableOrderURL(table.qrSlug || table.tableNumber), 
          };
        })
      );

      res.json({
        success: true,
        data: qrCodes,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new QRController();

