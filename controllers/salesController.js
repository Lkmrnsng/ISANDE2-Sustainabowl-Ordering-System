const User = require('../models/User');
const Request = require('../models/Request');
const Order = require('../models/Order');
const Item = require('../models/Item');

// Render the sales dashboard
async function getDashboard(req, res) {
    try{
        const stats = (await getStats())[0];
        const requests = await getRequests();
        const inventory = await getInventory();
        // const weekDays = await getWeekDays();
        
        res.render('sales_dashboard', {
            title: 'Dashboard',
            css: ['logisales_dashboard.css'],
            layout: 'sales',
            active: 'dashboard',
            stats: stats, 
            requests: requests,
            inventory: inventory,
            // weekDays: weekDays,
            warehouseStats: await getWarehouseStats() 
        });
    } catch(err) {
        console.error('Error fetching items:', err);
        res.status(500).send('Internal Server Error');
    }
}

// Call the methods to compute the Sales Dashboard statistics
async function getStats() {
    const statsArray = [];
    const monthlyRevenue = await getMonthlyRevenue();
    const monthlyRequests = await getMonthlyRequests();
    const pendingRequests = await getPendingRequests();
    const activePartners = await getActivePartners();

    statsArray.push({
        monthlyRevenue: monthlyRevenue.toString(),
        monthlyRequests: monthlyRequests.toString(),
        pendingRequests: pendingRequests.toString(),
        activePartners: activePartners.toString()
    })

    return statsArray;
}

// Calculate the total amount of sales for the current month
async function getMonthlyRevenue() {
    const currentYear = new Date().getUTCFullYear();
    const currentMonth = new Date().getUTCMonth() + 1;
    let totalRevenue = 0.0;
    
    try {
        const orders = await Order.find({});
        
        const monthOrders = orders.filter(order => 
            order.deliveryDate && 
            order.deliveryDate.getFullYear() === currentYear && 
            order.deliveryDate.getMonth() + 1 === currentMonth
        );
        
        for (const order of monthOrders) {
            if (order.items && Array.isArray(order.items)) {
                for (const orderItem of order.items) {
                    const item = await Item.findOne({ itemID: orderItem.itemID });
                    if (item) {
                        totalRevenue += item.itemPrice * orderItem.quantity;
                    }
                }
            }
        }

        return totalRevenue;

    } catch (err) {
        console.error('Error in getMonthlyRevenue:', err);
        throw err;
    }
}

// Calculate the number of Orders delivered this month
async function getMonthlyRequests() {
    const currentYear = new Date().getUTCFullYear();
    const currentMonth = new Date().getUTCMonth() + 1;
    
    try {
        const orders = await Order.find({
            deliveryDate: {
                $gte: new Date(currentYear, currentMonth - 1, 1),
                $lt: new Date(currentYear, currentMonth, 1)
            },
            status: 'Delivered'
        });
        
        return orders.length;
    } catch (err) {
        console.error('Error in getMonthlyRequests:', err);
        return 0;
    }
}

// Calculate the number of Requests that are pending (Received or Negotiation) for the current month
async function getPendingRequests() {
    const currentYear = new Date().getUTCFullYear();
    const currentMonth = new Date().getUTCMonth() + 1;
    
    try {
        const requests = await Request.find({
            requestDate: {
                $gte: new Date(currentYear, currentMonth - 1, 1),
                $lt: new Date(currentYear, currentMonth, 1)
            },
            status: { $in: ['Received', 'Negotiation'] }
        });
        
        return requests.length;
    } catch (err) {
        console.error('Error in getPendingRequests:', err);
        return 0;
    }
}

// Calculate the total count of Sustainapartners
async function getActivePartners() {
    try {
        const users = await User.find({});
        return users.length;
    } catch (err) {
        console.error('Error in getActivePartners:', err);
        return 0;
    }
}

// Fetch the data needed for the Sales Dashboard - Requests table
async function getRequests() {
    try {
        const requests = await Request.find({})
            .sort({ requestDate: -1 })
            .limit(10);

        // Get all customer IDs from requests
        const customerIDs = requests.map(req => req.customerID);
        const customers = await User.find({
            userID: { $in: customerIDs },
            usertype: 'Customer'
        });

        // Create a map of customerID to restaurantName
        const customerMap = {};
        customers.forEach(customer => {
            customerMap[customer.userID] = customer.restaurantName || customer.name;
        });

        return requests.map(request => ({
            requestID: request.requestID,
            partner: customerMap[request.customerID] || 'Unknown Partner',
            status: request.status || 'Pending',
            date: request.requestDate ? request.requestDate.toLocaleDateString() : 'N/A' // TODO: Consider multi-date requests
        }));
    } catch (err) {
        console.error('Error fetching requests:', err);
        return [];
    }
}

// Fetch the data needed for the Sales Dashboard - Warehouse Inventory table
async function getInventory() {
    try {
        const items = await Item.find({});
        
        const pendingOrders = await Order.find({ 
            status: { $in: ['Waiting Approval', 'Preparing'] } // Based on your status values
        });
        
        const reservedQuantities = {};
        
        pendingOrders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(orderItem => {
                    if (orderItem.itemID != null) {
                        reservedQuantities[orderItem.itemID] = 
                            (reservedQuantities[orderItem.itemID] || 0) + (orderItem.quantity || 0);
                    }
                });
            }
        });
        
        // Map items with calculated reserved quantities
        return items.map(item => {
            const reserved = reservedQuantities[item.itemID] || 0;
            const total = item.itemStock || 0;
            const available = Math.max(0, total - reserved);
            
            return {
                particular: item.itemName || 'Unnamed Item',
                available: available,
                reserved: reserved,
                total: total
            };
        });
    } catch (err) {
        console.error('Error fetching inventory:', err);
        throw err;
    }
}

// Fetch the data needed for the Sales Dashboard warehouse statistics
async function getWarehouseStats() {
    try {
        const items = await Item.find({});
        const totalStock = items.reduce((sum, item) => sum + (item.itemStock || 0), 0);
        const warehouseCapacity = 2000; // I just set a random capacity
        
        // Calculate reserved stock from pending orders
        const pendingOrders = await Order.find({ 
            status: { $in: ['Waiting Approval', 'Preparing'] }
        });
        
        let reservedStock = 0;
        for (const order of pendingOrders) {
            if (order.items && Array.isArray(order.items)) {
                reservedStock += order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
            }
        }

        const reservedPercentage = Math.round((reservedStock / warehouseCapacity) * 100);

        return {
            totalStock: totalStock,
            reservedPercentage: reservedPercentage
        };
    } catch (err) {
        console.error('Error calculating warehouse stats:', err);
        return { totalStock: 0, reservedPercentage: 0 };
    }
}

// Ishi will generate this from the logistics side first
// async function getWeekDays() {
//     try {
//         const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
//         const today = new Date();
//         const weekDays = [];

//         for (let i = 0; i < 7; i++) {
//             const date = new Date(today);
//             date.setDate(today.getDate() - today.getDay() + i);
            
//             // Get deliveries for this date
//             const deliveries = await getDeliveriesForDate(date);
            
//             weekDays.push({
//                 dayName: days[date.getDay()],
//                 dayNumber: date.getDate(),
//                 date: date.toISOString().split('T')[0],
//                 isToday: date.toDateString() === today.toDateString(),
//                 tasks: deliveries // Using deliveries as tasks
//             });
//         }

//         return weekDays;
//     } catch (err) {
//         console.error('Error generating week days:', err);
//         return [];
//     }
// }

// async function getDeliveriesForDate(date) {
//     try {
//         const startOfDay = new Date(date);
//         startOfDay.setHours(0, 0, 0, 0);
        
//         const endOfDay = new Date(date);
//         endOfDay.setHours(23, 59, 59, 999);

//         // Find orders with delivery dates on this day
//         const orders = await Order.find({
//             deliveryDate: {
//                 $gte: startOfDay,
//                 $lte: endOfDay
//             }
//         });

//         // Get customer details for these orders
//         const customerIDs = orders.map(order => order.pointPersonID);
//         const customers = await User.find({ userID: { $in: customerIDs } });
//         const customerMap = {};
//         customers.forEach(customer => {
//             customerMap[customer.userID] = customer.restaurantName || customer.name;
//         });

//         return orders.map(order => ({
//             id: order.OrderID,
//             text: `Delivery to ${customerMap[order.pointPersonID] || 'Unknown'} - ${order.deliveryTimeRange}`,
//             completed: order.status === 'Delivered'
//         }));
//     } catch (err) {
//         console.error('Error fetching deliveries:', err);
//         return [];
//     }
// }

// Render the Review Requests page
async function getReviewRequests(req, res) {
    try {
        const stats = await getRequestStats();
        const requests = await getDetailedRequests();
        const partners = await getPartnersData();
        
        res.render('sales_requests', {
            title: 'Requests',
            css: ['sales_requests.css'],
            layout: 'sales',
            active: 'requests',
            stats: stats,
            requests: requests,
            partners: partners,
            selectedRequest: null // Will be populated when a request is selected
        });
    } catch(err) {
        console.error('Error in getReviewRequests:', err);
        res.status(500).send('Internal Server Error');
    }
}

// Calculate the statistics for the Review Requests page
async function getRequestStats() {
    try {
        const currentDate = new Date();
        const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
        
        // Get delivered orders this week
        const deliveredThisWeek = await Order.countDocuments({
            status: 'Delivered',
            deliveryDate: { $gte: startOfWeek }
        });

        // Get top produce sold
        const topProduce = await Order.aggregate([
            { $unwind: '$items' },
            { $group: { 
                _id: '$items.itemID',
                totalQuantity: { $sum: '$items.quantity' }
            }},
            { $sort: { totalQuantity: -1 }},
            { $limit: 1 }
        ]);

        const topProduceName = topProduce.length > 0 
            ? (await Item.findOne({ itemID: topProduce[0]._id }))?.itemName 
            : 'N/A';

        // Get pending requests
        const pendingRequests = await Request.countDocuments({
            status: { $in: ['Received', 'Negotiation'] }
        });

        // Calculate average order value
        const orders = await Order.find({ status: 'Delivered' });
        let totalValue = 0;
        for (const order of orders) {
            if (order.items && Array.isArray(order.items)) {
                for (const orderItem of order.items) {
                    const item = await Item.findOne({ itemID: orderItem.itemID });
                    if (item) {
                        totalValue += item.itemPrice * orderItem.quantity;
                    }
                }
            }
        }
        const averageOrder = orders.length > 0 ? totalValue / orders.length : 0;

        return {
            delivered: deliveredThisWeek,
            topProduce: topProduceName,
            pendingRequests: pendingRequests,
            averageOrder: averageOrder
        };
    } catch (err) {
        console.error('Error in getRequestStats:', err);
        throw err;
    }
}

// Fetch the data needed for the Review Requests - Requests table
async function getDetailedRequests() {
    try {
        const requests = await Request.find({})
            .sort({ requestDate: -1 });

        const customerIDs = requests.map(req => req.customerID);
        const customers = await User.find({
            userID: { $in: customerIDs },
            usertype: 'Customer'
        });

        const customerMap = {};
        customers.forEach(customer => {
            customerMap[customer.userID] = customer.restaurantName || customer.name;
        });

        return requests.map(request => ({
            requestID: request.requestID,
            partner: customerMap[request.customerID] || 'Unknown Partner',
            status: request.status || 'Pending',
            dates: request.requestDate ? request.requestDate.toLocaleDateString() : 'N/A',
            items: [] // Will be populated when request details are opened
        }));
    } catch (err) {
        console.error('Error in getDetailedRequests:', err);
        return [];
    }
}

// Fetch the data needed for the Review Requests - expanded details sidebar
async function getRequestDetails(requestID) {
    try {
        const request = await Request.findOne({ requestID: requestID });
        if (!request) return null;

        const order = await Order.findOne({ requestID: requestID });
        if (!order) return null;

        const items = [];
        for (const orderItem of order.items) {
            const item = await Item.findOne({ itemID: orderItem.itemID });
            if (item) {
                items.push({
                    name: item.itemName,
                    quantity: orderItem.quantity,
                    price: item.itemPrice * orderItem.quantity
                });
            }
        }

        return {
            items: items,
            total: items.reduce((sum, item) => sum + item.price, 0),
            status: request.status
        };
    } catch (err) {
        console.error('Error in getRequestDetails:', err);
        return null;
    }
}

// Fetch the data needed for the Review Request - Sustainapartners table
async function getPartnersData() {
    try {
        const customers = await User.find({ usertype: 'Customer' });
        const partnerStats = [];

        for (const customer of customers) {
            // Get total requests
            const totalReqs = await Request.countDocuments({ customerID: customer.userID });

            // Calculate weekly average
            const weeklyReqs = await Request.aggregate([
                { $match: { customerID: customer.userID }},
                { $group: {
                    _id: { 
                        year: { $year: '$requestDate' },
                        week: { $week: '$requestDate' }
                    },
                    count: { $sum: 1 }
                }},
                { $group: {
                    _id: null,
                    avgWeeklyReqs: { $avg: '$count' }
                }}
            ]);

            // Calculate cancel rate
            const cancelledReqs = await Request.countDocuments({
                customerID: customer.userID,
                status: 'Cancelled'
            });

            partnerStats.push({
                name: customer.restaurantName || customer.name,
                pointPerson: customer.name,
                location: customer.address || 'N/A',
                totalReqs: totalReqs,
                avgWeeklyReqs: weeklyReqs[0]?.avgWeeklyReqs.toFixed(1) || '0.0',
                cancelRate: totalReqs > 0 ? ((cancelledReqs / totalReqs) * 100).toFixed(1) + '%' : '0%',
                clientSince: customer.createdAt ? customer.createdAt.toLocaleDateString() : 'N/A'
            });
        }

        return partnerStats;
    } catch (err) {
        console.error('Error in getPartnersData:', err);
        return [];
    }
}

module.exports = {
    getDashboard,
    getReviewRequests,
    getRequests,
    getInventory,
    getWarehouseStats,
    getReviewRequests,
    getRequestDetails,
    getPartnersData
};