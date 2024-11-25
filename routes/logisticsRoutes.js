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
router.get('/procurement',logisticsController.getProcurementView);

router.get('/api/procurements', logisticsController.getProcurementJson);
router.get('/api/agencies', logisticsController.getAgenciesJson);
router.get('/api/items', logisticsController.getItemsJson);
router.get('/api/orders', logisticsController.getOrdersJson);
router.post('/api/submit-procurement', logisticsController.submitProcurement);
router.post('/api/complete-procurement', logisticsController.completeProcurement);
router.post('/api/create-delivery/:orderID', logisticsController.createDelivery);
router.put('/api/procurement-status/:procurementID', logisticsController.setProcurementStatus);
router.put('/api/order-status/:orderID', logisticsController.setOrderStatus);

module.exports = router;