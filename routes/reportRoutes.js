const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/customer/:month?', reportController.getCustomerReport);
router.get('/customer/:month/download', reportController.downloadCustomerReport);

module.exports = router;