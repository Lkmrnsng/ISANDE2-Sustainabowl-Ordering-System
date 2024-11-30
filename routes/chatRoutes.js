const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const Request = require('../models/Request');
const Order = require('../models/Order');
const Item = require('../models/Item');
const User = require('../models/User');
const { createAlert } = require('../controllers/alertController');

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
            return res.status(403).json({ error: 'Access denied' });
        }
        next();
    }
};

// Chat view routes
router.get('/customer', 
    authMiddleware.validateSession,
    chatController.getCustomerChatView
);

router.get('/sales', 
    authMiddleware.validateSession,
    authMiddleware.salesOnly,
    chatController.getSalesChatView
);

// Chat API routes
router.get('/api/chat/:requestId',
    authMiddleware.validateSession,
    authMiddleware.validateRequest,
    chatController.getChatMessages
);

// Get individual order details
router.get('/api/order/:orderId',
    authMiddleware.validateSession,
    async (req, res) => {
        try {
            const order = await Order.findOne({ OrderID: parseInt(req.params.orderId) });
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            // Get the associated request to check permissions
            const request = await Request.findOne({ requestID: order.requestID });
            if (!request) {
                return res.status(404).json({ error: 'Associated request not found' });
            }

            // Check if user has access to this order
            const userType = req.session.userType;
            const userId = req.session.userId;
            const hasAccess = userType === 'Customer' 
                ? request.customerID === userId
                : request.pointPersonID === userId;

            if (!hasAccess) {
                return res.status(403).json({ error: 'Unauthorized access' });
            }

            // Get item details for each item in the order
            const processedItems = await Promise.all(order.items.map(async (item) => {
                const itemDetails = await Item.findOne({ itemID: item.itemID });
                return {
                    itemID: item.itemID,
                    itemName: itemDetails ? itemDetails.itemName : 'Unknown Item',
                    itemPrice: itemDetails ? itemDetails.itemPrice : 0,
                    quantity: item.quantity
                };
            }));

            // Create response object with all order details
            const orderDetails = {
                OrderID: order.OrderID,
                requestID: order.requestID,
                status: order.status,
                items: processedItems,
                customizations: order.customizations,
                deliveryDate: order.deliveryDate,
                deliveryAddress: order.deliveryAddress,
                deliveryTimeRange: order.deliveryTimeRange,
                paymentMethod: order.paymentMethod,
                pointPersonID: order.pointPersonID
            };

            res.json(orderDetails);
        } catch (error) {
            console.error('Error fetching order details:', error);
            res.status(500).json({ error: 'Failed to fetch order details' });
        }
    }
);

router.post('/api/message',
    authMiddleware.validateSession,
    authMiddleware.validateRequest,
    chatController.sendMessage
);

// Order management routes (Sales only)
router.put('/api/order/:orderId',
    authMiddleware.validateSession,
    authMiddleware.salesOnly,
    async (req, res) => {
        try {
            const order = await Order.findOne({ OrderID: parseInt(req.params.orderId) });
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            const updates = {
                deliveryDate: req.body.deliveryDate,
                deliveryTimeRange: req.body.deliveryTimeRange,
                status: req.body.status,
                deliveryAddress: req.body.deliveryAddress,
                customizations: req.body.customizations,
                items: req.body.items
            };

            // Check if status is changing to Cancelled
            const isBeingCancelled = order.status !== 'Cancelled' && updates.status === 'Cancelled';

            await Order.findOneAndUpdate(
                { OrderID: parseInt(req.params.orderId) },
                updates
            );

            // Create cancellation alert if status changed to Cancelled
            if (isBeingCancelled) {
                await createAlert({
                    concernType: 'Cancellation',
                    details: `Order #${order.OrderID} cancelled by Sales`,
                    orders: [order.OrderID],
                    userType: 'Sales',
                    byCustomer: false,
                    createdById: req.session.userId
                });
            }

            res.json({ success: true, message: 'Order updated successfully' });
        } catch (error) {
            console.error('Error updating order:', error);
            res.status(500).json({ error: 'Failed to update order' });
        }
    }
);

router.put('/api/request/:requestId/orders',
    authMiddleware.validateSession,
    authMiddleware.salesOnly,
    authMiddleware.validateRequest,
    async (req, res) => {
        try {
            const orders = await Order.find({ requestID: parseInt(req.params.requestId) });
            
            const updates = {
                deliveryDate: req.body.deliveryDate,
                deliveryTimeRange: req.body.deliveryTimeRange,
                status: req.body.status,
                deliveryAddress: req.body.deliveryAddress,
                customizations: req.body.customizations,
                items: req.body.items
            };

            // Check which orders are being cancelled
            const ordersBeingCancelled = orders.filter(order => 
                order.status !== 'Cancelled' && updates.status === 'Cancelled'
            );

            await Promise.all(orders.map(order => 
                Order.findOneAndUpdate(
                    { OrderID: order.OrderID },
                    updates
                )
            ));

            // Create cancellation alert if any orders were cancelled
            if (ordersBeingCancelled.length > 0) {
                await createAlert({
                    concernType: 'Cancellation',
                    details: `Multiple orders cancelled by Sales: ${ordersBeingCancelled.map(o => o.OrderID).join(', ')}`,
                    orders: ordersBeingCancelled.map(o => o.OrderID),
                    userType: 'Sales',
                    byCustomer: false,
                    createdById: req.session.userId
                });
            }

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
    async (req, res) => {
        try {
            const { status } = req.body;
            const requestId = req.params.requestId;

            const request = await Request.findOne({ requestID: requestId });
            if (!request) {
                return res.status(404).json({ error: 'Request not found' });
            }

            const isBeingCancelled = request.status !== 'Cancelled' && status === 'Cancelled';
            const isBeingApproved = request.status !== 'Approved' && status === 'Approved';

            // Update request status
            await Request.findOneAndUpdate(
                { requestID: requestId },
                { status }
            );

            // Get associated orders if being cancelled
            if (isBeingCancelled) {
                const orders = await Order.find({ requestID: requestId });
                
                // Create cancellation alert
                await createAlert({
                    concernType: 'Cancellation',
                    details: `Request #${requestId} and associated orders cancelled by Sales`,
                    orders: orders.map(o => o.OrderID),
                    userType: 'Sales',
                    byCustomer: false,
                    createdById: req.session.userId
                });

                // Update all associated orders to cancelled
                await Order.updateMany(
                    { requestID: requestId },
                    { status: 'Cancelled' }
                );
            }

            // Create approval alert if being approved
            if (isBeingApproved) {
                await createAlert({
                    concernType: 'Reminder',
                    details: `Request #${requestId} approved by Sales`,
                    orders: [],
                    userType: 'Sales',
                    byCustomer: false,
                    createdById: req.session.userId
                });

                // Update all associated orders to approved if they are waiting for approval
                await Order.updateMany(
                    { requestID: requestId, status: 'Waiting Approval' },
                    { status: 'Preparing' }
                );
            }

            res.json({ success: true, status });
        } catch (error) {
            console.error('Error updating request status:', error);
            res.status(500).json({ error: 'Failed to update status' });
        }
    }
);

// Get available items for sales
router.get('/api/items',
    authMiddleware.validateSession,
    async (req, res) => {
        try {
            const items = await Item.find({}).lean();
            res.json(items);
        } catch (error) {
            console.error('Error fetching items:', error);
            res.status(500).json({ error: 'Failed to fetch items' });
        }
    }
);

module.exports = router;