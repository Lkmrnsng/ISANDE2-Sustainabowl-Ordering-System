const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/customer/:month?', reportController.getCustomerReport);
router.get('/customer/:month/download/tool', reportController.downloadCustomerReportUsingTool);

router.get('/logistics/:month?', reportController.getLogisticsReport);
router.get('/logistics/:month/download/tool', reportController.downloadLogisticsReportUsingTool);

router.get('/sales/:month?', reportController.getSalesReport);
router.get('/sales/:month/download/tool', reportController.downloadSalesReportUsingTool);

module.exports = router;