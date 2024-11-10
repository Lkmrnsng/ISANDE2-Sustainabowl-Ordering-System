const User = require('../models/User');
const Request = require('../models/Request');
const Order = require('../models/Order');
const Item = require('../models/Item');
const Review = require('../models/Review');


// Fetch the logistics dashboard
async function getDashboard(req, res) {
    try {
        console.log('Session user ID:', req.session.userId); // Debug log
        const logisticsId = parseInt(req.session.userId); // Convert to number since userID is stored as number

        // Fetch requests for this logistics
        const originalRequests = await Request.find({ logisticsID: logisticsId }).sort({ requestID: -1 });
        
        console.log('Found requests:', originalRequests); // Debug log

        if (originalRequests.length === 0) {
            return res.render('logistics_dashboard', {
                title: 'Dashboard',
                css: ['logistics_dashboard.css'],
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

            return {
                requestID: request.requestID,
                requestDate: request.requestDate,
                deliveryDates,
                deliveriesCount,
                totalItemsBreakdown,
                itemNames
            };
        }));

        res.render('logistics_dashboard', {
            title: 'Dashboard',
            css: ['logistics_dashboard.css'],
            layout: 'customer',
            requests: processedRequests,
            active: 'requests'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error fetching logistics dashboard.");
    }
}

module.exports = {
    getDashboard
};