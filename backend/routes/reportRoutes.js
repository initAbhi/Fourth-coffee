const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/daily', reportController.generateDailyReport);
router.get('/weekly', reportController.generateWeeklyReport);
router.get('/monthly', reportController.generateMonthlyReport);
router.get('/saved', reportController.getSavedReports);

module.exports = router;


