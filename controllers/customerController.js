const User = require('../models/User');
const Request = require('../models/Request');
const Order = require('../models/Order');
const Item = require('../models/Item');
const Review = require('../models/Review');

async function getDashboard(req, res) {
    try {
        console.log('Session user ID:', req.session.userId); // Debug log
        const customerId = parseInt(req.session.userId); // Convert to number since userID is stored as number

        // Fetch requests for this customer
        const originalRequests = await Request.find({ customerID: customerId }).sort({ requestID: -1 });
        
        console.log('Found requests:', originalRequests); // Debug log

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
                if (order.deliveryDate) {
                    deliveryDates.push(order.deliveryDate);
                }
                deliveriesCount++;

                for (const item of order.items) {
                    const itemDetails = await Item.findOne({ itemID: item.itemID });
                    const itemIndex = totalItemsBreakdown.findIndex(i => i.itemID === item.itemID);
                    if (itemIndex === -1) {
                        totalItemsBreakdown.push({ 
                            itemID: item.itemID, 
                            quantity: item.quantity, 
                            itemName: itemDetails ? itemDetails.itemName : 'Unknown Item',
                            itemPrice: itemDetails ? itemDetails.itemPrice : 0
                        });
                        if (itemDetails) {
                            itemNames.push(itemDetails.itemName);
                        }
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
                pointPersonName: pointPerson ? pointPerson.name : 'Unassigned'
            };
        }));

        console.log('Processed requests:', processedRequests); // Debug log

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
                quantity: quantity,
                itemPrice: item.price
            };
        });

        res.json(breakdownData);
    } catch (error) {
        console.error('Error in getBreakdown:', error);
        res.status(500).send('An error occurred while fetching the breakdown data');
    }
}

async function getOrders(req, res) {
    try {
        const customerId = parseInt(req.session.userId);
        
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
                    name: itemDetails ? itemDetails.itemName : 'Unknown Item',
                    quantity: item.quantity,
                    price: itemDetails ? itemDetails.itemPrice : 0,
                    totalPrice: (itemDetails ? itemDetails.itemPrice : 0) * item.quantity
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
};