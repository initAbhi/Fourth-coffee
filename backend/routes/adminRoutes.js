const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const centralInventoryController = require('../controllers/centralInventoryController');
const marketingController = require('../controllers/marketingController');

// Dashboard
router.get('/dashboard', adminController.getGlobalDashboard.bind(adminController));
router.get('/cafes', adminController.getCafes.bind(adminController));
router.get('/cafes/:cafeId', adminController.getCafeDetail.bind(adminController));

// Central Inventory
router.get('/inventory', centralInventoryController.getInventory.bind(centralInventoryController));
router.get('/inventory/:sku', centralInventoryController.getInventoryItem.bind(centralInventoryController));
router.post('/inventory/dispatch', centralInventoryController.createDispatchOrder.bind(centralInventoryController));
router.get('/inventory/dispatch/:orderId', centralInventoryController.getDispatchOrder.bind(centralInventoryController));

// Marketing
router.get('/marketing/campaigns', marketingController.getCampaigns.bind(marketingController));
router.post('/marketing/campaigns', marketingController.createCampaign.bind(marketingController));
router.post('/marketing/campaigns/:id/send', marketingController.sendCampaign.bind(marketingController));

module.exports = router;

