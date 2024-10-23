// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// View Routes
router.get('/customer', chatController.getCustomerChatView);
router.get('/sales', chatController.getSalesChatView);

// API Routes
router.get('/api/chat/:requestId', chatController.getChatMessages);
router.post('/api/message', chatController.sendMessage);
router.get('/api/order/:orderId', chatController.getOrderDetails);
router.put('/api/order/:orderId', chatController.updateOrder);
router.get('/api/requests/customer/:customerId', chatController.getCustomerRequests);
router.get('/api/requests/sales/:salesId', chatController.getSalesRequests);

// Middleware to check user type
function checkUserType(req, res, next) {
    if (!req.session.userType) {
        return res.redirect('/login');
    }
    next();
}

// Middleware to ensure only sales can access sales routes
function salesOnly(req, res, next) {
    if (req.session.userType !== 'sales') {
        return res.redirect('/chat/customer');
    }
    next();
}

// Apply middleware to routes
router.use('/sales', checkUserType, salesOnly);
router.use('/customer', checkUserType);

module.exports = router;