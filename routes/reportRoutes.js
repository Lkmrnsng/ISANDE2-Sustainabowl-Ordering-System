const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/customer/:month?', reportController.getCustomerReport);
router.get('/customer/:month/download/tool', reportController.downloadCustomerReportUsingTool);

module.exports = router;