const express = require('express');
const router = express.Router();
const printerController = require('../controllers/printerController');

router.get('/health', printerController.getHealth);
router.get('/jobs', printerController.getAllPrintJobs);
router.get('/status/:orderId', printerController.getPrintStatus);
router.post('/retry/:orderId', printerController.retryPrint);

module.exports = router;

