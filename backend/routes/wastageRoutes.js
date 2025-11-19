const express = require('express');
const router = express.Router();
const wastageController = require('../controllers/wastageController');

router.get('/', wastageController.getWastageEntries);
router.post('/', wastageController.createWastageEntry);
router.delete('/:id', wastageController.deleteWastageEntry);

module.exports = router;

