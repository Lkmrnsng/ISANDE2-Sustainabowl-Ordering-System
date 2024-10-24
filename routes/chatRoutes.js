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
            return res.status(401).json({ error: 'Unauthorized' });
        }
        req.session.userType = req.session.userId === 10002 ? 'Sales' : 'Customer';
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
    }
};

// Routes with consolidated middleware
router.get('/customer', 
    authMiddleware.validateSession,
    chatController.getCustomerChatView
);

router.get('/sales', 
    authMiddleware.validateSession,
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

router.get('/api/order/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        // Parse orderId to number if your OrderID is stored as number
        const order = await Order.findOne({ OrderID: parseInt(orderId) });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: `Order #${orderId} not found`
            });
        }

        // Fetch item details with prices for the order
        const enhancedItems = await Promise.all(order.items.map(async (item) => {
            const itemData = await Item.findOne({ itemID: item.itemID });
            return {
                ...item.toObject(),
                itemName: itemData ? itemData.itemName : 'Unknown Item',
                itemPrice: itemData ? itemData.itemPrice : 0,
                totalPrice: (itemData ? itemData.itemPrice : 0) * item.quantity
            };
        }));

        // Calculate total amount
        const totalAmount = enhancedItems.reduce((sum, item) => sum + item.totalPrice, 0);

        const orderResponse = {
            ...order.toObject(),
            items: enhancedItems,
            totalAmount
        };

        res.json(orderResponse);

    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order details'
        });
    }
});



module.exports = router;