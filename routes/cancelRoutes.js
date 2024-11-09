const express = require('express');
const router = express.Router();
const cancelController = require('../controllers/cancelController');

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

// Customer authorization middleware
const isCustomer = (req, res, next) => {
    if (req.session.userType !== 'Customer') {
        return res.status(403).send('Unauthorized');
    }
    next();
};

// Apply middleware to all routes
router.use(isAuthenticated);
router.use(isCustomer);

// Routes
router.get('/', cancelController.getCancelView);
router.post('/request', cancelController.cancelRequest);
router.post('/order', cancelController.cancelOrder);

module.exports = router;