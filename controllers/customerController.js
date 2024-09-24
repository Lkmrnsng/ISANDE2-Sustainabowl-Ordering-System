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
       
        //const customerId = req.user.id; 
        //test 
        const customerId = 10001


        // Fetch requests for this customer
        const requests = await Request.find({ customerID: customerId }).sort({ requestID: -1 });

        //test print values
        console.log('requests:', requests);

        // Fetch detailed information for each request
        const detailedRequests = await Promise.all(requests.map(async (request) => {
            const order = await Order.findOne({ requestID: request.requestID });
            
            if (!order) {
                return {
                    requestID: request.requestID,
                    status: request.status,
                    date: request.createdAt,
                    items: 'No items yet'
                };
            }

            const itemDetails = await Promise.all(order.items.map(async (item) => {
                const itemInfo = await Item.findOne({ itemID: item.itemID });
                return `${itemInfo.itemName} (${item.quantity})`;
            }));

            return {
                requestID: request.requestID,
                status: request.status,
                date: order.OrderDate,
                items: itemDetails.join(', ')
            };
        }));

        // Fetch details for the first request (you can modify this to fetch based on selection)
        let selectedRequest = null;
        if (detailedRequests.length > 0) {
            const latestOrder = await Order.findOne({ requestID: detailedRequests[0].requestID });
            if (latestOrder) {
                const item = await Item.findOne({ itemID: latestOrder.items[0].itemID });
                selectedRequest = {
                    itemName: item.itemName,
                    quantity: latestOrder.items[0].quantity,
                    price: item.itemPrice * latestOrder.items[0].quantity,
                    total: latestOrder.items.reduce((acc, item) => acc + (item.quantity * item.price), 0),
                    status: latestOrder.status
                };
            }
        }

        //Test print values
        console.log('detailedRequests:', detailedRequests);
        console.log('selectedRequest:', selectedRequest);

        // Render the dashboard view with the fetched data
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