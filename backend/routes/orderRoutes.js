const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.get('/', orderController.getAllOrders);
// IMPORTANT: This route must come before /:id to avoid route conflicts
router.get('/tables/payment-status', orderController.getTablesWithPaymentStatus);
router.get('/:id', orderController.getOrderById);
router.post('/', orderController.createOrder);
router.post('/:id/payment', orderController.confirmPayment);
router.post('/:id/confirm', orderController.confirmOrder);
router.post('/:id/reject', orderController.rejectOrder);
router.post('/:id/serve', orderController.markServed);

module.exports = router;

