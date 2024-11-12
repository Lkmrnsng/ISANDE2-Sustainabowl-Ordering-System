const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

router.get('/dashboard', salesController.getDashboard);
router.get('/requests', salesController.getReviewRequests);
router.get('/api/:requestID/details', salesController.getRequestDetailsApi);
router.put('/api/:requestID/status', salesController.setRequestStatus);
router.get('/api/requests', salesController.getRequests);

router.get('/warehouse', salesController.getWarehouseInventory);

module.exports = router;