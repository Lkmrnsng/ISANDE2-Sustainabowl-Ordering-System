const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Define Routes

// Get the customer dashboard
router.get('/dashboard', customerController.getDashboard);
router.get('/dashboard/requests/:requestID/breakdown', customerController.getBreakdown);

module.exports = router; // Export router so it can be used in app.js
