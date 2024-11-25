const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const Order = require('../models/Order');
const User = require('../models/User');
const Alert = require('../models/Alert');
// Middleware to ensure user is authenticated
const isAuthenticated = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    next();
};

// Middleware to check if user is Sales or Logistics
const isSalesOrLogistics = (req, res, next) => {
    if (!['Sales', 'Logistics'].includes(req.session.userType)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
};

// Get notifications
router.get('/notifications', isAuthenticated, alertController.getNotifications);

// Get my alerts (alerts created by the current user)
router.get('/my-alerts', isAuthenticated, isSalesOrLogistics, async (req, res) => {
    try {
        const alerts = await Alert.find({ createdById: req.session.userId })
            .sort({ dateCreated: -1 });
        res.json({ success: true, alerts });
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch alerts' });
    }
});

// Delete alert
router.delete('/delete/:alertId', isAuthenticated, isSalesOrLogistics, async (req, res) => {
    try {
        await alertController.deleteAlert(
            parseInt(req.params.alertId),
            req.session.userId,
            req.session.userType
        );
        res.json({ success: true, message: 'Alert deleted successfully' });
    } catch (error) {
        console.error('Error deleting alert:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create alert with creator ID
router.post('/create', isAuthenticated, async (req, res) => {
    try {
        const alertData = {
            ...req.body,
            createdById: req.session.userId,
            userType: req.session.userType
        };
        const alert = await alertController.createAlert(alertData);
        res.json({ success: true, alert });
    } catch (error) {
        console.error('Error creating alert:', error);
        res.status(500).json({ success: false, message: 'Failed to create alert' });
    }
});

// Get the send alert page (only for Sales and Logistics)
router.get('/send', isAuthenticated, isSalesOrLogistics, async (req, res) => {
    try {
        // Get all orders with customer details, without status filter
        const orders = await Order.aggregate([
            {
                $lookup: {
                    from: 'users',
                    let: { requestID: '$requestID' },
                    pipeline: [
                        {
                            $lookup: {
                                from: 'requests',
                                let: { userID: '$userID' },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ['$requestID', '$$requestID'] },
                                                    { $eq: ['$customerID', '$$userID'] }
                                                ]
                                            }
                                        }
                                    }
                                ],
                                as: 'request'
                            }
                        },
                        {
                            $unwind: '$request'
                        }
                    ],
                    as: 'customer'
                }
            },
            {
                $unwind: '$customer'
            },
            {
                $project: {
                    OrderID: 1,
                    status: 1,
                    deliveryDate: 1,
                    customerName: '$customer.name',
                    customerId: '$customer.userID'
                }
            },
            {
                $sort: { deliveryDate: -1 }
            }
        ]);

        res.render('sendAlert', {
            title: 'Send Alerts',
            css: ['sendAlert.css'],
            layout: req.session.userType.toLowerCase(),
            orders,
            active: 'sendalert',
            js: ['sendAlert.js']
        });

    } catch (err) {
        console.error('Error loading alert page:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error loading page' 
        });
    }
});

// Create batch alerts
router.post('/create-batch', isAuthenticated, isSalesOrLogistics, async (req, res) => {
    try {
        const { concernType, details, orders, cancelOrders } = req.body;

        if (!orders || !Array.isArray(orders)) {
            throw new Error('Invalid or missing orders array');
        }

        // Get orders with their customer IDs
        const orderDetails = await Order.aggregate([
            {
                $match: {
                    OrderID: { $in: orders.map(id => parseInt(id)) }
                }
            },
            {
                $lookup: {
                    from: 'requests',
                    localField: 'requestID',
                    foreignField: 'requestID',
                    as: 'requestDetails'
                }
            },
            {
                $unwind: '$requestDetails'
            },
            {
                $project: {
                    OrderID: 1,
                    customerID: '$requestDetails.customerID'
                }
            }
        ]);

        // Group orders by customerID
        const ordersByCustomer = orderDetails.reduce((acc, order) => {
            const customerId = order.customerID;
            if (!acc[customerId]) {
                acc[customerId] = [];
            }
            acc[customerId].push(order.OrderID);
            return acc;
        }, {});

        // Create one alert per customer with their respective orders
        const alertPromises = Object.entries(ordersByCustomer).map(([customerId, customerOrders]) => {
            return alertController.createAlert({
                concernType,
                details,
                orders: customerOrders,
                cancelOrders: cancelOrders,
                byCustomer: false,
                userType: req.session.userType,
                createdById: req.session.userId,
                customerId: parseInt(customerId)
            });
        });

        await Promise.all(alertPromises);
        res.json({ success: true, message: 'Alerts sent successfully' });

    } catch (error) {
        console.error('Error creating batch alerts:', error);
        res.status(500).json({ success: false, message: 'Failed to send alerts' });
    }
});

// Get orders for alert page
router.get('/api/orders', isAuthenticated, isSalesOrLogistics, async (req, res) => {
    try {
        const orders = await Order.aggregate([
            {
                $lookup: {
                    from: 'requests',
                    localField: 'requestID',
                    foreignField: 'requestID',
                    as: 'requestDetails'
                }
            },
            {
                $unwind: '$requestDetails'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'requestDetails.customerID',
                    foreignField: 'userID',
                    as: 'customerDetails'
                }
            },
            {
                $unwind: '$customerDetails'
            },
            {
                $project: {
                    OrderID: 1,
                    status: 1,
                    deliveryDate: 1,
                    customerName: '$customerDetails.name',
                    customerId: '$customerDetails.userID'
                }
            },
            {
                $sort: { deliveryDate: -1 }
            }
        ]);

        res.json(orders);

    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch orders'
        });
    }
});

module.exports = router;