const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

router.get('/phone/:phone', customerController.getCustomerByPhone);
router.get('/:customerId/profile', customerController.getCustomerProfile);
router.get('/:customerId/loyalty-points', customerController.getLoyaltyPointTransactions);
router.get('/:customerId/wallet', customerController.getWalletTransactions);
router.post('/:customerId/wallet/topup', customerController.topUpWalletFromPoints);
router.post('/wallet/:transactionId/approve', customerController.approveWalletTopUp);

module.exports = router;


