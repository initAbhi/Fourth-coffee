const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');

router.get('/table/:tableId', qrController.getQRCodeDataURL);
router.get('/table/:tableId/svg', qrController.getQRCodeSVG);
router.get('/table/:tableId/info', qrController.getQRCodeInfo);
router.get('/all', qrController.getAllQRCodes);

module.exports = router;

