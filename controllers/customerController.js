//Import Models
const User = require('../models/User');
const Request = require('../models/Request');
const Order = require('../models/Order');
const Item = require('../models/Item');
const Review = require('../models/Review');

//Define Functions

/**
 * Get the customer dashboard which displays all their requests and its associated deliveries
 */
async function getDashboard(req, res) {
    try {
        const customerId = req.session.userId;

        // Fetch requests for this customer
        const originalRequests = await Request.find({ customerID: customerId }).sort({ requestID: -1 });

        if (originalRequests.length === 0) {
            return res.render('customer_dashboard', {
                title: 'Dashboard',
                css: ['customer.css'],
                layout: 'customer',
                requests: [],
                active: 'requests'
            });
        }

        const orderIDs = originalRequests.map(request => request.requestID);
        const orders = await Order.find({ requestID: { $in: orderIDs } });
        
        // Process the requests
        const processedRequests = await Promise.all(originalRequests.map(async (request) => {
            let deliveryDates = [];
            let deliveriesCount = 0;
            let totalItemsBreakdown = [];
            let itemNames = [];

            const requestOrders = orders.filter(order => order.requestID === request.requestID);

            for (const order of requestOrders) {
                deliveryDates.push(order.deliveryDate);
                deliveriesCount++;

                for (const item of order.items) {
                    const itemDetails = await Item.findOne({ itemID: item.itemID });
                    const itemIndex = totalItemsBreakdown.findIndex(i => i.itemID === item.itemID);
                    if (itemIndex === -1) {
                        totalItemsBreakdown.push({ 
                            itemID: item.itemID, 
                            quantity: item.quantity, 
                            itemName: itemDetails.itemName,
                            itemPrice: itemDetails.itemPrice
                        });
                        itemNames.push(itemDetails.itemName);
                    } else {
                        totalItemsBreakdown[itemIndex].quantity += item.quantity;
                    }
                }
            }

            //get the name of the Sales Rep
            const pointPerson = await User.findOne({ userID: request.pointPersonID });
            
            return {
                ...request.toObject(),
                deliveriesCount,
                deliveryDates,
                totalItemsBreakdown,
                itemNames: itemNames.join(', '),
                pointPersonName: pointPerson.name
            };
        }));

        console.log('Processed requests:', processedRequests);

        res.render('customer_dashboard', {
            title: 'Dashboard',
            css: ['customer.css'],
            layout: 'customer',
            requests: processedRequests,
            active: 'requests'
        });

    } catch (error) {
        console.error('Error in getDashboard:', error);
        res.status(500).send('An error occurred while fetching the dashboard');
    }
}

async function getBreakdown(req, res) {
    try {
        const requestId = req.params.requestId;
        
        // Fetch the request by ID
        const request = await Request.findById(requestId);
        
        // Fetch the associated items using the item IDs from the request
        const items = await Item.find({ _id: { $in: request.items } });
        
        // Map the items to include the breakdown data
        const breakdownData = items.map(item => {
            // Count the number of times this item appears in the request
            const quantity = request.items.filter(id => id.equals(item._id)).length;

            return {
                itemID: item._id,
                itemName: item.name,
                quantity: quantity,  // The quantity of this item
                itemPrice: item.price
            };
        });

        // Send the breakdown data as JSON
        res.json(breakdownData);
    } catch (error) {
        console.error('Error in getBreakdown:', error);
        res.status(500).send('An error occurred while fetching the breakdown data');
    }
}

// GetOrders page
async function getOrders(req, res) {
    try {
        const customerId = req.session.userId;
        
        // Find requests for this customer
        let requests = await Request.find({ customerID: customerId }).sort({ requestID: -1 });
        requests = requests.filter(request => request.status === 'Approved');
        
        // Find orders and reviews
        const [orders, reviews] = await Promise.all([
            Order.find({ 
                requestID: { $in: requests.map(request => request.requestID) }
            }).sort({ OrderID: -1 }),
            Review.find({
                reviewerID: customerId
            }).lean()
        ]);

        // Process the orders
        const processedOrders = await Promise.all(orders.map(async (order) => {
            const request = requests.find(request => request.requestID === order.requestID);
            
            // Process items with details
            const processedItems = await Promise.all(order.items.map(async (item) => {
                const itemDetails = await Item.findOne({ itemID: item.itemID });
                return {
                    ...item,
                    name: itemDetails.itemName,
                    quantity: item.quantity,
                    price: itemDetails.itemPrice,
                    totalPrice: itemDetails.itemPrice * item.quantity
                };
            }));

            // Calculate total amount
            const totalAmount = processedItems.reduce((sum, item) => sum + item.totalPrice, 0);

            // Check if order has been reviewed
            const review = reviews.find(r => r.orderID === order.OrderID);

            return {
                ...order.toObject(),
                items: processedItems,
                totalAmount,
                review: review || null,
                hasBeenReviewed: !!review
            };
        }));

        res.render('customer_orders', {
            title: 'My Orders',
            css: ['customer.css'],
            layout: 'customer',
            orders: processedOrders,
            reviews: reviews,
            active: 'orders'
        });
    } catch (error) {
        console.error('Error in getOrders:', error);
        res.status(500).send('An error occurred while fetching the orders');
    }
}


module.exports = {
    getDashboard,
    getBreakdown,
    getOrders
}; // Export the functions so it can be used in routes/customerRoutes.js