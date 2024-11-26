const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const Order = require('../models/Order'); // Add this at the top
const Item = require('../models/Item');
const User = require('../models/User');
const Request = require('../models/Request');

router.get('/dashboard', salesController.getDashboardPage);
router.get('/requests', salesController.getRequestsPage);
router.get('/warehouse', salesController.getWarehousePage);
router.get('/calendar', salesController.getCalendarPage); 

router.get('/api/sidebar/:requestID', salesController.getRequestSidebarJson);
router.get('/api/partners', salesController.getPartnerJson);
router.get('/api/requests', salesController.getRequestJson);
router.get('/api/inventory', salesController.getInventoryJson);
router.put('/api/requests/:requestID', salesController.setRequestStatus);
router.put('/api/orders/:orderID', salesController.setOrderStatus);

router.get('/api/orders', async (req, res) => {
    try {
        // Get all orders and related data
        const [orders, items, requests, users] = await Promise.all([
            Order.find({}).lean(),
            Item.find({}).lean(),
            Request.find({}).lean(),
            User.find({}).lean()
        ]);

        // Create lookup maps
        const itemsMap = new Map(items.map(item => [item.itemID, item]));
        const requestsMap = new Map(requests.map(req => [req.requestID, req]));
        const usersMap = new Map(users.map(user => [user.userID, user]));
        
        const formattedOrders = orders.map(order => {
            const request = requestsMap.get(order.requestID);
            const customer = request ? usersMap.get(request.customerID) : null;
            
            return {
                OrderID: order.OrderID,
                items: order.items.map(item => {
                    const itemData = itemsMap.get(item.itemID);
                    return {
                        name: itemData?.itemName || 'Unknown Item',
                        quantity: item.quantity,
                        price: itemData?.itemPrice || 0,
                        category: itemData?.itemCategory
                    };
                }),
                deliveryDate: order.deliveryDate,
                status: order.status,
                customizations: order.customizations || 'None',
                deliveryTimeRange: order.deliveryTimeRange,
                customer: customer?.name || 'Unknown',
                restaurant: customer?.restaurantName || 'Unknown Restaurant',
                deliveryAddress: order.deliveryAddress,
                paymentMethod: order.paymentMethod,
                totalAmount: order.items.reduce((sum, item) => {
                    const itemData = itemsMap.get(item.itemID);
                    return sum + ((itemData?.itemPrice || 0) * item.quantity);
                }, 0).toFixed(2)
            };
        });
        
        res.json(formattedOrders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

module.exports = router;