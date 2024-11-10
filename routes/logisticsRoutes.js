const express = require('express');
const router = express.Router();
const logisticsController = require('../controllers/logisticsController');

router.get('/logistics_dashboard', logisticsController.getDashboard);

module.exports = router;