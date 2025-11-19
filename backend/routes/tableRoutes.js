const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');

router.get('/', tableController.getAllTables);
router.get('/:id', tableController.getTableById);
router.get('/slug/:slug', tableController.getTableBySlug);
router.post('/', tableController.createTable);
router.patch('/:id/status', tableController.updateTableStatus);
router.post('/:id/reset', tableController.resetTable);

module.exports = router;

