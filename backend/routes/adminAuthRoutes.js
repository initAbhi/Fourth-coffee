const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');

// Login
router.post('/login', adminAuthController.login.bind(adminAuthController));

// Verify session
router.post('/verify', adminAuthController.verifySession.bind(adminAuthController));

// Logout
router.post('/logout', adminAuthController.logout.bind(adminAuthController));

module.exports = router;

