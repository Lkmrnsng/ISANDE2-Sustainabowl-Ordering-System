const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplaceController');

// Define Routes
router.get('/', marketplaceController.getCatalog);
router.get('/checkout', marketplaceController.getCheckout);

module.exports = router; // Export router so it can be used in app.js