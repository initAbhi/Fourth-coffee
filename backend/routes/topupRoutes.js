const express = require('express');
const router = express.Router();
const topupController = require('../controllers/topupController');

router.get('/offers', topupController.getOffers);
router.post('/process', topupController.processTopup);

module.exports = router;

