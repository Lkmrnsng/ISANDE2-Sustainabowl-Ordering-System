const express = require('express');
const router = express.Router();
const logisticsController = require('../controllers/logisticsController');

// Sidebar routes
router.get('/dashboard', logisticsController.getDashboardView);
router.get('/calendar', logisticsController.getCalendarView);
router.get('/foodprocess', logisticsController.getFoodProcessView);
router.get('/delivery', logisticsController.getDeliveryView);
router.get('/warehouse', logisticsController.getWarehouseView);
router.get('/partners', logisticsController.getPartnersView);
router.get('/sendalert', logisticsController.getSendAlertView);




module.exports = router;