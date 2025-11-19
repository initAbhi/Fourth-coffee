const express = require('express');
const router = express.Router();
const customerAuthController = require('../controllers/customerAuthController');

router.post('/login', customerAuthController.login);
router.post('/verify', customerAuthController.verifySession);

module.exports = router;


