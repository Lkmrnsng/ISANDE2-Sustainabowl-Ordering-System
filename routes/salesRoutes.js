const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

router.get('/dashboard', salesController.getDashboard);
router.get('/requests', salesController.getReviewRequests);
router.get('/api/requests/:requestID/details', salesController.getRequestDetailsApi);

module.exports = router;