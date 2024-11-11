const express = require('express');
const router = express.Router();
const procurementController = require('../controllers/procurementController');

router.get('/', procurementController.index);
router.post('/create', procurementController.create);
router.post('/book-delivery', procurementController.bookDelivery);
router.post('/complete', procurementController.complete);

module.exports = router;