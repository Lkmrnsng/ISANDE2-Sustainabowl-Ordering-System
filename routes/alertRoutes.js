const express = require('express');
const router = express.Router();
const AlertController = require('../controllers/alertController');

router.post('/alerts', AlertController.createAlert);

module.exports = router;
