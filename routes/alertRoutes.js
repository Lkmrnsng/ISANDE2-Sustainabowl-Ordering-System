const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

// Middleware to ensure user is authenticated
const isAuthenticated = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    next();
};

// Get notifications
router.get('/notifications', isAuthenticated, alertController.getNotifications);

// Create alert
router.post('/create', isAuthenticated, async (req, res) => {
    try {
        const alert = await alertController.createAlert(req.body);
        res.json({ success: true, alert });
    } catch (error) {
        console.error('Error creating alert:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create alert'
        });
    }
});

module.exports = router;