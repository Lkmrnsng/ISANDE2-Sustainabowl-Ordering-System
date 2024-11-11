const User = require('../models/User');
const Request = require('../models/Request');
const Order = require('../models/Order');
const Item = require('../models/Item');
const Review = require('../models/Review');
const { get } = require('express/lib/response');


// Fetch the sales dashboard
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

async function getActivePartners() {
    try {
        const users = await User.find({});
        return users.length;
    } catch (err) {
        console.error('Error in getActivePartners:', err);
        return 0;
    }
}

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

async function getReviewRequests(req, res) {
    try{
        const requests = await Request.find({});

        res.render('sales_requests', {
            title: 'Requests',
            css: ['sales_requests.css'],
            layout: 'sales',
            active: 'requests',
            requests: requests
        });
    }catch(err){
        console.error('Error fetching items:', err);
    }
}

module.exports = {
    getDashboard,
    getReviewRequests,
    getRequests,
    getInventory,
    getWarehouseStats
};