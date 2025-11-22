const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Create Razorpay order
router.post('/createorder', paymentController.createOrder);

// Verify payment and create order (for new orders)
router.post('/verifypayment', paymentController.verifyPayment);

// Verify payment for existing order
router.post('/verifypayment/:orderId', paymentController.verifyPaymentForOrder);

module.exports = router;

