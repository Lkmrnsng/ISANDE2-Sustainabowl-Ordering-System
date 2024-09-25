//Import Models
const User = require('../models/User');
const Request = require('../models/Request');
const Order = require('../models/Order');
const Item = require('../models/Item');

//Define Functions

/**
 * Get the customer dashboard which displays all their requests and its associated deliveries
 */
async function getDashboard(req, res) {
    try {
        const customerId = 10001; // Test ID
        console.log('Fetching dashboard for customer:', customerId);

        // Fetch requests for this customer
        const requests = await Request.find({ customerID: customerId }).sort({ requestID: -1 });
        console.log('Requests found:', requests.length);

        if (requests.length === 0) {
            console.log('No requests found for customer:', customerId);
            return res.render('customer_dashboard', {
                title: 'Dashboard',
                css: ['customer_dashboard.css'],
                layout: 'main',
                requests: [],
                selectedRequest: null
            });
        }

        // Fetch detailed information for each request
        const detailedRequests = await Promise.all(requests.map(async (request) => {
            console.log('Processing request:', request.requestID);
            const order = await Order.findOne({ requestID: request.requestID });
            
            if (!order) {
                console.log('No order found for request:', request.requestID);
                return {
                    requestID: request.requestID,
                    status: request.status,
                    date: request.createdAt,
                    items: 'No items yet'
                };
            }

            console.log('Order found:', order);

            let itemDetails = 'No items';
            if (order.items && Array.isArray(order.items)) {
                itemDetails = await Promise.all(order.items.map(async (item) => {
                    if (item && item.itemID) {
                        const itemInfo = await Item.findOne({ itemID: item.itemID });
                        return itemInfo ? `${itemInfo.itemName} (${item.quantity})` : `Unknown item (${item.quantity})`;
                    }
                    return 'Invalid item';
                }));
                itemDetails = itemDetails.join(', ');
            } else {
                console.log('Order items is not an array:', order.items);
            }

            return {
                requestID: request.requestID,
                status: request.status,
                date: order.OrderDate,
                items: itemDetails
            };
        }));

        console.log('Detailed requests:', detailedRequests);

        // Fetch details for the first request
        let selectedRequest = null;
        if (detailedRequests.length > 0) {
            const latestOrder = await Order.findOne({ requestID: detailedRequests[0].requestID });
            if (latestOrder) {
                console.log('Latest order:', latestOrder);
                if (latestOrder.items && Array.isArray(latestOrder.items) && latestOrder.items.length > 0) {
                    const item = await Item.findOne({ itemID: latestOrder.items[0].itemID });
                    selectedRequest = {
                        itemName: item ? item.itemName : 'Unknown item',
                        quantity: latestOrder.items[0].quantity,
                        price: item ? item.itemPrice * latestOrder.items[0].quantity : 0,
                        total: latestOrder.items.reduce((acc, item) => acc + (item.quantity * (item.price || 0)), 0),
                        status: latestOrder.status
                    };
                } else {
                    console.log('Latest order has no valid items');
                    selectedRequest = {
                        itemName: 'No items',
                        quantity: 0,
                        price: 0,
                        total: 0,
                        status: latestOrder.status
                    };
                }
            }
        }

        console.log('Selected request:', selectedRequest);

        res.render('customer_dashboard', {
            title: 'Dashboard',
            css: ['customer_dashboard.css'],
            layout: 'main',
            requests: detailedRequests,
            selectedRequest: selectedRequest
        });

    } catch (error) {
        console.error('Error in getDashboard:', error);
        res.status(500).send('An error occurred while fetching the dashboard');
    }
}


module.exports = {
    getDashboard
}; // Export the functions so it can be used in routes/customerRoutes.js