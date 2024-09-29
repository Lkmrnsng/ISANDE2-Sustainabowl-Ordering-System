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

        // Fetch requests for this customer
        const requests = await Request.find({ customerID: customerId }).sort({ requestID: -1 });

        if (requests.length === 0) {
            return res.render('customer_dashboard', {
                title: 'Dashboard',
                css: ['customer_dashboard.css'],
                layout: 'main',
                requests: [],
                selectedRequest: null
            });
        }

        const orderIDs = requests.map(request => request.requestID);
        const orders = await Order.find({ requestID: { $in: orderIDs } });
        
        // Process the requests
        requests.forEach(request => {
            let deliveryDates = [];
            let deliveriesCount = 0;
            let totalItemsBreakdown = [];
            orders.forEach(order => {
                if (order.requestID === request.requestID) {
                    deliveryDates.push(order.deliveryDate);
                    deliveriesCount++;
                    order.items.forEach(item => {
                        const itemIndex = totalItemsBreakdown.findIndex(i => i.itemID === item.itemID);
                        if (itemIndex === -1) {
                            totalItemsBreakdown.push({ itemID: item.itemID, quantity: item.quantity });
                        } else {
                            totalItemsBreakdown[itemIndex].quantity += item.quantity;
                        }
                    });
                }
            });

            request.deliveriesCount = deliveriesCount;
            request.deliveryDates = deliveryDates;
            request.totalItemsBreakdown = totalItemsBreakdown;
        });

        res.render('customer_dashboard', {
            title: 'Dashboard',
            css: ['customer_dashboard.css'],
            layout: 'main',
            requests: requests
        });

    } catch (error) {
        console.error('Error in getDashboard:', error);
        res.status(500).send('An error occurred while fetching the dashboard');
    }
}


module.exports = {
    getDashboard
}; // Export the functions so it can be used in routes/customerRoutes.js