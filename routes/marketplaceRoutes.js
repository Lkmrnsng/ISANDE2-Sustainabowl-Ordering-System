const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplaceController');

// Define Routes
router.get('/', marketplaceController.getCatalog);
router.get('/checkout', marketplaceController.getCheckout);

router.post('/api/submit', marketplaceController.submitRequest);

module.exports = router;