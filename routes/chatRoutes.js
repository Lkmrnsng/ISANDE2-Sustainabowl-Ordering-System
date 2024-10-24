// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Middleware for session checks
const sessionMiddleware = {
    // Check if user is logged in
    checkAuth: (req, res, next) => {
        // For testing purposes, simulate login if no session exists
        if (!req.session.userId) {
            req.session.userId = 10001; // Default to customer
            req.session.userType = 'customer';
        }
        next();
    },

    // Ensure only sales can access sales routes
    salesOnly: (req, res, next) => {
        if (req.session.userId !== 10002) { // Sales ID
            return res.redirect('/chat/customer');
        }
        next();
    },

    // Ensure only customers can access customer routes
    customerOnly: (req, res, next) => {
        if (req.session.userId === 10002) { // If sales ID
            return res.redirect('/chat/sales');
        }
        next();
    },

    // Set user type based on ID for testing
    setUserType: (req, res, next) => {
        req.session.userType = req.session.userId === 10002 ? 'sales' : 'customer';
        next();
    }
};

// View Routes with middleware
router.get('/customer', 
    sessionMiddleware.checkAuth,
    sessionMiddleware.setUserType,
    sessionMiddleware.customerOnly,
    chatController.getCustomerChatView
);

router.get('/sales', 
    sessionMiddleware.checkAuth,
    sessionMiddleware.setUserType,
    sessionMiddleware.salesOnly,
    chatController.getSalesChatView
);

// API Routes with authentication
// Chat messages
router.get('/api/chat/:requestId',
    sessionMiddleware.checkAuth,
    sessionMiddleware.setUserType,
    async (req, res, next) => {
        // Verify user has access to this request
        try {
            const request = await require('../models/Request').findOne({ 
                requestID: req.params.requestId 
            });
            
            if (!request) {
                return res.status(404).send('Request not found');
            }

            // Check if user has access to this request
            if (req.session.userType === 'customer' && request.customerID !== req.session.userId) {
                return res.status(403).send('Unauthorized access to request');
            }
            if (req.session.userType === 'sales' && request.pointPersonID !== req.session.userId) {
                return res.status(403).send('Unauthorized access to request');
            }
            
            next();
        } catch (error) {
            next(error);
        }
    },
    chatController.getChatMessages
);

// Send message
router.post('/api/message',
    sessionMiddleware.checkAuth,
    sessionMiddleware.setUserType,
    async (req, res, next) => {
        try {
            const request = await require('../models/Request').findOne({ 
                requestID: req.body.requestID 
            });
            
            if (!request) {
                return res.status(404).send('Request not found');
            }

            // Check if user has access to this request
            if (req.session.userType === 'customer' && request.customerID !== req.session.userId) {
                return res.status(403).send('Unauthorized access to request');
            }
            if (req.session.userType === 'sales' && request.pointPersonID !== req.session.userId) {
                return res.status(403).send('Unauthorized access to request');
            }
            
            next();
        } catch (error) {
            next(error);
        }
    },
    chatController.sendMessage
);

// Order routes
router.get('/api/order/:orderId',
    sessionMiddleware.checkAuth,
    sessionMiddleware.setUserType,
    async (req, res, next) => {
        try {
            const order = await require('../models/Order').findOne({ 
                OrderID: req.params.orderId 
            });
            
            if (!order) {
                return res.status(404).send('Order not found');
            }

            // Fetch associated request to check permissions
            const request = await require('../models/Request').findOne({ 
                requestID: order.requestID 
            });

            if (!request) {
                return res.status(404).send('Associated request not found');
            }

            // Check if user has access to this order's request
            if (req.session.userType === 'customer' && request.customerID !== req.session.userId) {
                return res.status(403).send('Unauthorized access to order');
            }
            if (req.session.userType === 'sales' && request.pointPersonID !== req.session.userId) {
                return res.status(403).send('Unauthorized access to order');
            }
            
            next();
        } catch (error) {
            next(error);
        }
    },
    chatController.getOrderDetails
);

// Update order (sales only)
router.put('/api/order/:orderId',
    sessionMiddleware.checkAuth,
    sessionMiddleware.setUserType,
    sessionMiddleware.salesOnly,
    async (req, res, next) => {
        try {
            const order = await require('../models/Order').findOne({ 
                OrderID: req.params.orderId 
            });
            
            if (!order) {
                return res.status(404).send('Order not found');
            }

            // Verify sales person is assigned to this order's request
            const request = await require('../models/Request').findOne({ 
                requestID: order.requestID 
            });

            if (!request || request.pointPersonID !== req.session.userId) {
                return res.status(403).send('Unauthorized to modify this order');
            }
            
            next();
        } catch (error) {
            next(error);
        }
    },
    chatController.updateOrder
);

// Request list routes
router.get('/api/requests/customer/:customerId',
    sessionMiddleware.checkAuth,
    sessionMiddleware.setUserType,
    sessionMiddleware.customerOnly,
    (req, res, next) => {
        // Ensure customer can only access their own requests
        if (parseInt(req.params.customerId) !== req.session.userId) {
            return res.status(403).send('Unauthorized access to customer requests');
        }
        next();
    },
    chatController.getCustomerRequests
);

router.get('/api/requests/sales/:salesId',
    sessionMiddleware.checkAuth,
    sessionMiddleware.setUserType,
    sessionMiddleware.salesOnly,
    (req, res, next) => {
        // Ensure sales person can only access their assigned requests
        if (parseInt(req.params.salesId) !== req.session.userId) {
            return res.status(403).send('Unauthorized access to sales requests');
        }
        next();
    },
    chatController.getSalesRequests
);

module.exports = router;