const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');

// Get all deliveries with pagination
router.get('/deliveries', deliveryController.getAllDeliveries);

// Book a delivery
router.post('/deliveries/:requestId/book', deliveryController.bookDelivery);

// Complete a delivery
router.put('/deliveries/:requestId/complete', deliveryController.completeDelivery);

// Delete a delivery
router.delete('/deliveries/:requestId', deliveryController.deleteDelivery);

module.exports = router;