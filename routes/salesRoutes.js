const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

router.get('/dashboard', salesController.getDashboardPage);
router.get('/requests', salesController.getRequestsPage);
router.get('/warehouse', salesController.getWarehousePage);
router.get('/calendar', salesController.getCalendarPage); 

router.get('/api/:requestID/details', salesController.getRequestSidebar);
router.put('/api/:requestID/status', salesController.setRequestStatus);
router.get('/api/requests', salesController.getRequestJson);


module.exports = router;