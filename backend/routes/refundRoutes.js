const express = require('express');
const router = express.Router();
const refundController = require('../controllers/refundController');

router.get('/', refundController.getAllRefunds);
router.get('/:id', refundController.getRefundById);
router.post('/', refundController.createRefundRequest);
router.post('/:id/approve', refundController.approveRefund);
router.post('/:id/reject', refundController.rejectRefund);

module.exports = router;


