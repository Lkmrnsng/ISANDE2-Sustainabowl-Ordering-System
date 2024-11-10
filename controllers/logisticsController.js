const User = require('../models/User');
const Request = require('../models/Request');
const Order = require('../models/Order');
const Item = require('../models/Item');
const Review = require('../models/Review');


// Fetch the logistics dashboard
async function getDashboardView(req, res) {
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
                layout: 'logistics',
                requests: [],
                active: 'dashboard'
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
            layout: 'logistics',
            requests: processedRequests,
            active: 'dashboard'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error fetching logistics dashboard.");
    }
}

async function getCalendarView (req, res) {
    try {
        res.render('logistics_calendar', {
            title: 'Calendar',
            css: ['logistics_calendar.css'],
            layout: 'logistics',
            active: 'calendar'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error fetching calendar.");
    }
}

//getFoodProcessView
async function getFoodProcessView (req, res) {
    try {
        res.render('logistics_foodprocess', {
            title: 'Food Process',
            css: ['logistics_foodprocess.css'],
            layout: 'logistics',
            active: 'foodprocess'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error fetching food process.");
    }
}

//getDeliveryView
async function getDeliveryView (req, res) {
    try {
        res.render('logistics_delivery', {
            title: 'Delivery',
            css: ['logistics_delivery.css'],
            layout: 'logistics',
            active: 'delivery'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error fetching delivery.");
    }
}

//getWarehouseView
async function getWarehouseView (req, res) {
    try {
        res.render('logistics_warehouse', {
            title: 'Warehouse',
            css: ['logistics_warehouse.css'],
            layout: 'logistics',
            active: 'warehouse'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error fetching warehouse.");
    }
}

//getPartnersView
async function getPartnersView (req, res) {
    try {
        res.render('logistics_partners', {
            title: 'Partners',
            css: ['logistics_partners.css'],
            layout: 'logistics',
            active: 'partners'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error fetching partners.");
    }
}

//getProcurementView
async function getProcurementView (req, res) {
    try {
        res.render('logistics_procurement', {
            title: 'Procurement',
            css: ['logistics_procurement.css'],
            layout: 'logistics',
            active: 'procurement'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error fetching procurement.");
    }
}

//getSendAlertView
async function getSendAlertView (req, res) {
    try {
        res.render('logistics_sendalert', {
            title: 'Send Alert',
            css: ['logistics_sendalert.css'],
            layout: 'logistics',
            active: 'sendalert'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error fetching send alert.");
    }
}

module.exports = {
    getDashboardView,
    getCalendarView,
    getFoodProcessView,
    getDeliveryView,
    getWarehouseView,
    getPartnersView,
    getProcurementView,
    getSendAlertView
};