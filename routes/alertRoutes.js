const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const Order = require('../models/Order');

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

// Get the send alert page (only for Sales and Logistics)
router.get('/send', isAuthenticated, isSalesOrLogistics, async (req, res) => {
    try {
        // Get non-cancelled orders with customer details
        const orders = await Order.aggregate([
            {
                $match: { 
                    status: { 
                        $nin: ['Cancelled', 'Delivered']
                    }
                }
            },
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
            active: 'sendalert'
        });

    } catch (err) {
        console.error('Error loading alert page:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error loading page' 
        });
    }
});

// Create multiple alerts for batch orders
router.post('/create-batch', isAuthenticated, isSalesOrLogistics, async (req, res) => {
    try {
        const { concernType, details, orderIds, cancelOrders } = req.body;

        // Get orders with their customer IDs
        const orders = await Order.aggregate([
            {
                $match: {
                    OrderID: { $in: orderIds.map(id => parseInt(id)) }
                }
            },
            {
                $lookup: {
                    from: 'requests',  // Look up the requests collection
                    localField: 'requestID',
                    foreignField: 'requestID', 
                    as: 'requestDetails'
                }
            },
            {
                $unwind: '$requestDetails'  // Since lookup returns an array
            },
            {
                $project: {
                    OrderID: 1,
                    customerID: '$requestDetails.customerID'  // Get customerID from request
                }
            }
        ]);

        // Group orders by customerID
        const ordersByCustomer = orders.reduce((acc, order) => {
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
                cancelOrder: cancelOrders,
                byCustomer: false,
                customerId: parseInt(customerId)
            });
        });

        await Promise.all(alertPromises);
        res.json({ success: true, message: 'Alerts sent successfully' });

    } catch (error) {
        console.error('Error creating batch alerts:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send alerts' 
        });
    }
});

// Get orders for alert page
router.get('/orders', isAuthenticated, isSalesOrLogistics, async (req, res) => {
    try {
        const orders = await Order.aggregate([
            {
                $match: { 
                    status: { 
                        $nin: ['Cancelled', 'Delivered']
                    }
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