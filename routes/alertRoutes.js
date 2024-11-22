const express = require('express');
const router = express.Router();
const AlertController = require('../controllers/alertController');

// Middleware to ensure user is authenticated
const isAuthenticated = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    next();
};

// Create alert
router.post('/alerts', AlertController.createAlert);

// Get notifications for the logged-in user
router.get('/api/notifications', isAuthenticated, AlertController.getNotifications);

module.exports = router;