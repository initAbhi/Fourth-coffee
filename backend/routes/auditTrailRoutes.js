const express = require('express');
const router = express.Router();
const auditTrailController = require('../controllers/auditTrailController');

router.get('/', auditTrailController.getAuditLogs);
router.get('/filters', auditTrailController.getFilterOptions);
router.post('/', auditTrailController.createAuditLog);

module.exports = router;

