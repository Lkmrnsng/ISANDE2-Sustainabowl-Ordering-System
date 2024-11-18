const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const Request = require('../models/Request');
const Order = require('../models/Order');
const Item = require('../models/Item');
const User = require('../models/User');

// Consolidated auth middleware
const authMiddleware = {
    validateSession: (req, res, next) => {
        if (!req.session.userId) {
            return res.redirect('/login');
        }

        next();
    },

    validateRequest: async (req, res, next) => {
        try {
            const requestId = req.params.requestId || req.body.requestID;
            const request = await Request.findOne({ requestID: requestId });
            
            if (!request) {
                return res.status(404).json({ error: 'Request not found' });
            }

            const userType = req.session.userType;
            const userId = req.session.userId;

            const hasAccess = userType === 'Customer' 
                ? request.customerID === userId
                : request.pointPersonID === userId;

            if (!hasAccess) {
                return res.status(403).json({ error: 'Unauthorized access' });
            }

            req.chatRequest = request;
            next();
        } catch (error) {
            next(error);
        }
    },

    salesOnly: (req, res, next) => {
        if (req.session.userType !== 'Sales') {
            return res.render('error', {
                message: 'Access denied',
                layout: 'bodyOnly'
            });
        }
        next();
    }
};

// Routes with consolidated middleware
router.get('/customer', 
    authMiddleware.validateSession,
    chatController.getCustomerChatView
);

router.get('/sales', 
    authMiddleware.validateSession,
    authMiddleware.salesOnly,
    chatController.getSalesChatView
);

router.get('/api/chat/:requestId',
    authMiddleware.validateSession,
    authMiddleware.validateRequest,
    chatController.getChatMessages
);

router.post('/api/message',
    authMiddleware.validateSession,
    authMiddleware.validateRequest,
    chatController.sendMessage
);

// In chatRoutes.js:
router.put('/api/order/:orderId',
    authMiddleware.salesOnly,
    authMiddleware.validateSession,
    async (req, res) => {
        try {
            const order = await Order.findOne({ OrderID: parseInt(req.params.orderId) });
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            // Keep the date as is from the client
            const updates = {
                deliveryDate: req.body.deliveryDate,  // Don't create new Date object
                deliveryTimeRange: req.body.deliveryTimeRange,
                status: req.body.status,
                deliveryAddress: req.body.deliveryAddress,
                customizations: req.body.customizations,
                items: req.body.items
            };

            await Order.findOneAndUpdate(
                { OrderID: parseInt(req.params.orderId) },
                updates
            );

            res.json({ success: true, message: 'Order updated successfully' });
        } catch (error) {
            console.error('Error updating order:', error);
            res.status(500).json({ error: 'Failed to update order' });
        }
    }
);

router.put('/api/request/:requestId/orders',
    authMiddleware.salesOnly,
    authMiddleware.validateSession,
    authMiddleware.validateRequest,
    async (req, res) => {
        try {
            const orders = await Order.find({ requestID: parseInt(req.params.requestId) });
            
            // Keep the date as is from the client
            const updates = {
                deliveryDate: req.body.deliveryDate,  // Don't create new Date object
                deliveryTimeRange: req.body.deliveryTimeRange,
                status: req.body.status,
                deliveryAddress: req.body.deliveryAddress,
                customizations: req.body.customizations,
                items: req.body.items
            };

            await Promise.all(orders.map(order => 
                Order.findOneAndUpdate(
                    { OrderID: order.OrderID },
                    updates
                )
            ));

            res.json({ success: true, message: 'All orders updated successfully' });
        } catch (error) {
            console.error('Error updating orders:', error);
            res.status(500).json({ error: 'Failed to update orders' });
        }
    }
);

router.put('/api/request/:requestId/status',
    authMiddleware.validateSession,
    authMiddleware.salesOnly,
    authMiddleware.validateRequest,
    chatController.updateRequestStatus
);

router.get('/api/items', async (req, res) => {
    try {
        const items = await Item.find({}).lean();
        res.json(items);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

module.exports = router;