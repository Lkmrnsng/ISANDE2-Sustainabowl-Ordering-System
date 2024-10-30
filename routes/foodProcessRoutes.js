const express = require('express');
const router = express.Router();
const foodProcessController = require('../controllers/foodProcessController');

router.get('/logistics_foodprocess', foodProcessController.getProcessingRequests);
router.get('/logistics_foodprocess/:id', foodProcessController.getRequestDetails);
router.post('/logistics_foodprocess/update', foodProcessController.updateProduceStatus);

module.exports = router;
