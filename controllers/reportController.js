const User = require('../models/User');
const Request = require('../models/Request');
const Order = require('../models/Order');
const Item = require('../models/Item');
const Delivery = require('../models/Delivery');

const reportController = {
    async getCustomerReport(req, res) {
        try {
            const customerId = parseInt(req.session.userId);
            const month = req.params.month || new Date().toLocaleString('en-US', { month: 'short' });
            const year = new Date().getFullYear();
            
            // Get customer details
            const customer = await User.findOne({ userID: customerId });
            
            // First get all requests for this customer
            const requests = await Request.find({ customerID: customerId });
            
            // Get the start and end date for the selected month
            const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);
            const startDate = new Date(year, monthIndex, 1);
            const endDate = new Date(year, monthIndex + 1, 0);
    
            // Then get all orders linked to these requests for this month
            const orders = await Order.find({
                requestID: { $in: requests.map(req => req.requestID) },
                deliveryDate: {
                    $gte: startDate.toISOString(),
                    $lte: endDate.toISOString()
                }
            }).sort({ deliveryDate: 1 });
            
            
            const summary = {
                totalDeliveries: 0,
                cancelledDeliveries: 0,
                averageOrderCost: 0,
                averageWeeklyDeliveries: 0,
            };
            
            // Process order statuses
            for (const order of orders) {
                const status = await getOrderStatus(order);
                if (status.isDelivered) {
                    summary.totalDeliveries++;
                } else if (order.status === 'Cancelled') {
                    summary.cancelledDeliveries++;
                }
            }

            
            
            summary.averageWeeklyDeliveries = Math.ceil(summary.totalDeliveries / 4);
            
            // Calculate average order cost
            if (orders.length > 0) {
                const orderTotals = await Promise.all(orders.map(order => calculateOrderTotal(order)));
                const totalCost = orderTotals.reduce((sum, total) => sum + total, 0);
                summary.averageOrderCost = totalCost / orders.length;
            }
    
            // Get commonly bought items for this month
            const itemCounts = {};
            for (const order of orders) {
                for (const item of order.items) {
                    itemCounts[item.itemID] = (itemCounts[item.itemID] || 0) + item.quantity;
                }
            }
    
            // Get item details and sort by quantity
            const commonItems = await Promise.all(
                Object.entries(itemCounts)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(async ([itemId]) => {
                        const item = await Item.findOne({ itemID: parseInt(itemId) });
                        return item ? item.itemName : 'Unknown Item';
                    })
            );
    
            // Calculate order summary
            const orderSummary = await Promise.all(orders.map(async order => {
                const items = await Promise.all(order.items.map(async item => {
                    const itemDetails = await Item.findOne({ itemID: item.itemID });
                    return {
                        name: itemDetails ? itemDetails.itemName : 'Unknown Item',
                        quantity: item.quantity,
                        cost: item.quantity * (itemDetails ? itemDetails.itemPrice : 0)
                    };
                }));
            
                // Find the corresponding request to get info if needed
                const request = requests.find(req => req.requestID === order.requestID);
                const orderStatus = await getOrderStatus(order);
            
                return {
                    orderId: order.OrderID,
                    requestDate: request ? request.requestDate : null,
                    deliveryDate: orderStatus.deliveryDate || null,
                    schedule: order.deliveryTimeRange,
                    items: items.map(i => i.name).join(', '),
                    payment: order.paymentMethod,
                    total: items.reduce((sum, item) => sum + item.cost, 0)
                };
            }));
    
            // Calculate produce summary
            const produceSummary = [];
            for (const [itemId, quantity] of Object.entries(itemCounts)) {
                const itemDetails = await Item.findOne({ itemID: parseInt(itemId) });
                if (itemDetails) {
                    produceSummary.push({
                        name: itemDetails.itemName,
                        quantity,
                        cost: quantity * itemDetails.itemPrice
                    });
                }
            }
    
            res.render('reports/customer-report', {
                title: 'Monthly Order Report',
                css: ['report.css'],
                layout: 'report',
                month,
                year,
                customer,
                summary,
                commonItems: commonItems.join(', '),
                commonSchedule: getCommonSchedule(orders),
                orderSummary,
                produceSummary,
                totalAmount: produceSummary.reduce((sum, item) => sum + item.cost, 0),
                generatedDate: new Date().toLocaleDateString(),
                downloadUrl: `/reports/customer/${month}/download/tool`,
                
            });
    
        } catch (error) {
            console.error('Error generating report:', error);
            res.status(500).send('Error generating report');
        }
    },

    async downloadCustomerReportUsingTool(req, res) {
        try {
            const customerId = parseInt(req.session.userId);
            const month = req.params.month || new Date().toLocaleString('en-US', { month: 'short' });
            const year = new Date().getFullYear();
    
            // Get customer details
            const customer = await User.findOne({ userID: customerId });
            
            // Get all requests for this customer
            const requests = await Request.find({ customerID: customerId });
            
            // Get the start and end date for the selected month
            const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);
            const startDate = new Date(year, monthIndex, 1);
            const endDate = new Date(year, monthIndex + 1, 0);
    
            // Get all orders for the month
            const orders = await Order.find({
                requestID: { $in: requests.map(req => req.requestID) },
                deliveryDate: {
                    $gte: startDate.toISOString(),
                    $lte: endDate.toISOString()
                }
            }).sort({ deliveryDate: 1 });
            
            
            const summary = {
                totalDeliveries: 0,
                cancelledDeliveries: 0,
                averageOrderCost: 0,
                averageWeeklyDeliveries: 0,
            };
            
            // Process order statuses
            for (const order of orders) {
                const status = await getOrderStatus(order);
                if (status.isDelivered) {
                    summary.totalDeliveries++;
                } else if (order.status === 'Cancelled') {
                    summary.cancelledDeliveries++;
                }
            }
            
            summary.averageWeeklyDeliveries = Math.ceil(summary.totalDeliveries / 4);
            
            // Calculate average order cost
            if (orders.length > 0) {
                const orderTotals = await Promise.all(orders.map(order => calculateOrderTotal(order)));
                const totalCost = orderTotals.reduce((sum, total) => sum + total, 0);
                summary.averageOrderCost = totalCost / orders.length;
            }
    
            // Get commonly bought items
            const itemCounts = {};
            for (const order of orders) {
                for (const item of order.items) {
                    itemCounts[item.itemID] = (itemCounts[item.itemID] || 0) + item.quantity;
                }
            }
    
            // Get item details and sort by quantity
            const commonItems = await Promise.all(
                Object.entries(itemCounts)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(async ([itemId]) => {
                        const item = await Item.findOne({ itemID: parseInt(itemId) });
                        return item ? item.itemName : 'Unknown Item';
                    })
            );

            // Calculate order summary
            const orderSummary = await Promise.all(orders.map(async order => {
                const items = await Promise.all(order.items.map(async item => {
                    const itemDetails = await Item.findOne({ itemID: item.itemID });
                    return {
                        name: itemDetails ? itemDetails.itemName : 'Unknown Item',
                        quantity: item.quantity,
                        cost: item.quantity * (itemDetails ? itemDetails.itemPrice : 0)
                    };
                }));
            
                // Find the corresponding request to get info if needed
                const request = requests.find(req => req.requestID === order.requestID);
                const orderStatus = await getOrderStatus(order);
            
                return {
                    orderId: order.OrderID,
                    requestDate: request ? request.requestDate : null,
                    deliveryDate: orderStatus.deliveryDate || null,
                    schedule: order.deliveryTimeRange,
                    items: items.map(i => i.name).join(', '),
                    payment: order.paymentMethod,
                    total: items.reduce((sum, item) => sum + item.cost, 0)
                };
            }));
    
            // Calculate produce summary
            const produceSummary = [];
            for (const [itemId, quantity] of Object.entries(itemCounts)) {
                const itemDetails = await Item.findOne({ itemID: parseInt(itemId) });
                if (itemDetails) {
                    produceSummary.push({
                        name: itemDetails.itemName,
                        quantity,
                        cost: quantity * itemDetails.itemPrice
                    });
                }
            }
    
            const totalAmount = produceSummary.reduce((sum, item) => sum + item.cost, 0);
            const commonSchedule = getCommonSchedule(orders);
    
            // Render the report page first
            res.render('reports/customer-report', {
                title: 'Monthly Order Report',
                css: ['report.css'],
                layout: 'report',
                month,
                year,
                customer,
                summary,
                commonItems: commonItems.join(', '),
                commonSchedule,
                orderSummary,
                produceSummary,
                totalAmount,
                generatedDate: new Date().toLocaleDateString(),
                isDownload: true, // Add this flag to indicate download mode
                
            });
    
        } catch (error) {
            console.error('Error downloading report:', error);
            res.status(500).send('Error downloading report');
        }
    },
    async getLogisticsReport(req, res) {
        try {
            const month = req.params.month || new Date().toLocaleString('en-US', { month: 'short' });
            const year = new Date().getFullYear();

            // Get the start and end date for the selected month
            const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);
            const startDate = new Date(year, monthIndex, 1);
            const endDate = new Date(year, monthIndex + 1, 0);

            // Get all orders for the month
            const orders = await Order.find({
                deliveryDate: {
                    $gte: startDate.toISOString(),
                    $lte: endDate.toISOString()
                }
            }).sort({ deliveryDate: 1 });

            // Group orders by week
            const weeks = {};
            for (const order of orders) {
                const orderDate = new Date(order.deliveryDate);
                const weekNum = getWeekNumber(orderDate);
                //console.log(`Order ID: ${order.OrderID} - Order Date: ${orderDate.toISOString()} - Week Number: ${weekNum}`);

                if (!weeks[weekNum]) {
                    weeks[weekNum] = {
                        noOfOrders: 0,
                        fulfilledOnTime: 0,
                        fulfilledLate: 0,
                        cancelled: 0,
                        alertsIssued: 0,
                        fulfillmentRate: 0
                    };
                }
                weeks[weekNum].noOfOrders++;

                // Check delivery status
                if (order.status === 'Delivered') {
                    const delivery = await Delivery.findOne({ orderID: order.OrderID.toString() })
                        .sort({ deliveredOn: -1 });
                
                    if (delivery) {
                        const scheduledDate = new Date(order.deliveryDate);
                        const actualDeliveryDate = new Date(delivery.deliveredOn);
                        
                        // Compare dates without time
                        scheduledDate.setHours(0, 0, 0, 0);
                        actualDeliveryDate.setHours(0, 0, 0, 0);
                        
                        if (actualDeliveryDate <= scheduledDate) {
                            weeks[weekNum].fulfilledOnTime++;
                        } else {
                            weeks[weekNum].fulfilledLate++;
                        }
                    }
                } else if (order.status === 'Cancelled') {
                    weeks[weekNum].cancelled++;
                }
            }

            // Calculate fulfillment rates and format weeks data
            const weeklyData = Object.entries(weeks)
                .sort(([a], [b]) => parseInt(a) - parseInt(b)) // Sort by week number
                .map(([weekNum, data]) => {
                    const total = data.noOfOrders;
                    const fulfilled = data.fulfilledOnTime + data.fulfilledLate;
                    const fulfillmentRate = total > 0
                        ? ((fulfilled / total) * 100).toFixed(2)
                        : '0.00';

                    return {
                        week: `WEEK ${weekNum}`,
                        ...data,
                        fulfillmentRate: `${fulfillmentRate}%`
                    };
                });

            // Calculate monthly totals
            const monthlyTotals = {
                noOfOrders: 0,
                fulfilledOnTime: 0,
                fulfilledLate: 0,
                cancelled: 0,
                alertsIssued: 0,
                fulfillmentRate: '0.00%'
            };

            for (const week of weeklyData) {
                monthlyTotals.noOfOrders += week.noOfOrders;
                monthlyTotals.fulfilledOnTime += week.fulfilledOnTime;
                monthlyTotals.fulfilledLate += week.fulfilledLate;
                monthlyTotals.cancelled += week.cancelled;
                monthlyTotals.alertsIssued += week.alertsIssued;
            }

            // Calculate monthly fulfillment rate
            const monthlyTotal = monthlyTotals.noOfOrders;
            const monthlyFulfilled = monthlyTotals.fulfilledOnTime + monthlyTotals.fulfilledLate;
            monthlyTotals.fulfillmentRate = monthlyTotal > 0
                ? `${((monthlyFulfilled / monthlyTotal) * 100).toFixed(2)}%`
                : '0.00%';

            res.render('reports/logistics-report', {
                title: 'Order Fulfillment Report',
                css: ['report_landscape.css'],
                layout: 'report-landscape',
                month,
                year,
                weeklyData,
                monthlyTotals,
                generatedDate: new Date().toLocaleDateString(),
                downloadUrl: `/reports/logistics/${month}/download/tool`,
                user: await User.findOne({ userID: req.session.userId })
            });
        } catch (error) {
            console.error('Error generating logistics report:', error);
            res.status(500).send('Error generating logistics report');
        }
    },

    async downloadLogisticsReportUsingTool(req, res) {
        try {
            const month = req.params.month || new Date().toLocaleString('en-US', { month: 'short' });
            const year = new Date().getFullYear();

            // Get the start and end date for the selected month
            const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);
            const startDate = new Date(year, monthIndex, 1);
            const endDate = new Date(year, monthIndex + 1, 0);

            // Get all orders for the month
            const orders = await Order.find({
                deliveryDate: {
                    $gte: startDate.toISOString(),
                    $lte: endDate.toISOString()
                }
            }).sort({ deliveryDate: 1 });

            // Group orders by week
            const weeks = {};
            for (const order of orders) {
                const orderDate = new Date(order.deliveryDate);
                const weekNum = getWeekNumber(orderDate);

                if (!weeks[weekNum]) {
                    weeks[weekNum] = {
                        noOfOrders: 0,
                        fulfilledOnTime: 0,
                        fulfilledLate: 0,
                        cancelled: 0,
                        alertsIssued: 0,
                        fulfillmentRate: 0
                    };
                }
                weeks[weekNum].noOfOrders++;

                // Check delivery status
                if (order.status === 'Delivered') {
                    const delivery = await Delivery.findOne({ orderID: order.OrderID.toString() })
                        .sort({ deliveredOn: -1 });
                
                    if (delivery) {
                        const scheduledDate = new Date(order.deliveryDate);
                        const actualDeliveryDate = new Date(delivery.deliveredOn);
                        
                        // Compare dates without time
                        scheduledDate.setHours(0, 0, 0, 0);
                        actualDeliveryDate.setHours(0, 0, 0, 0);
                        
                        if (actualDeliveryDate <= scheduledDate) {
                            weeks[weekNum].fulfilledOnTime++;
                        } else {
                            weeks[weekNum].fulfilledLate++;
                        }
                    }
                } else if (order.status === 'Cancelled') {
                    weeks[weekNum].cancelled++;
                }
            }

            // Calculate fulfillment rates and format weeks data
            const weeklyData = Object.entries(weeks)
                .sort(([a], [b]) => parseInt(a) - parseInt(b)) // Sort by week number
                .map(([weekNum, data]) => {
                    const total = data.noOfOrders;
                    const fulfilled = data.fulfilledOnTime + data.fulfilledLate;
                    const fulfillmentRate = total > 0
                        ? ((fulfilled / total) * 100).toFixed(2)
                        : '0.00';

                    return {
                        week: `WEEK ${weekNum}`,
                        ...data,
                        fulfillmentRate: `${fulfillmentRate}%`
                    };
                });

            // Calculate monthly totals
            const monthlyTotals = {
                noOfOrders: 0,
                fulfilledOnTime: 0,
                fulfilledLate: 0,
                cancelled: 0,
                alertsIssued: 0,
                fulfillmentRate: '0.00%'
            };

            for (const week of weeklyData) {
                monthlyTotals.noOfOrders += week.noOfOrders;
                monthlyTotals.fulfilledOnTime += week.fulfilledOnTime;
                monthlyTotals.fulfilledLate += week.fulfilledLate;
                monthlyTotals.cancelled += week.cancelled;
                monthlyTotals.alertsIssued += week.alertsIssued;
            }

            // Calculate monthly fulfillment rate
            const monthlyTotal = monthlyTotals.noOfOrders;
            const monthlyFulfilled = monthlyTotals.fulfilledOnTime + monthlyTotals.fulfilledLate;
            monthlyTotals.fulfillmentRate = monthlyTotal > 0
                ? `${((monthlyFulfilled / monthlyTotal) * 100).toFixed(2)}%`
                : '0.00%';

            res.render('reports/logistics-report', {
                title: 'Order Fulfillment Report',
                css: ['report_landscape.css'],
                layout: 'report-landscape',
                month,
                year,
                weeklyData,
                monthlyTotals,
                generatedDate: new Date().toLocaleDateString(),
                isDownload: true, // This flag triggers the PDF download in the template
                user: await User.findOne({ userID: req.session.userId })
            });
        } catch (error) {
            console.error('Error downloading logistics report:', error);
            res.status(500).send('Error downloading logistics report');
        }
    }

};

// Helper functions
async function calculateOrderTotal(order) {
  let total = 0;
  for (const orderItem of order.items) {
      const itemDetails = await Item.findOne({ itemID: orderItem.itemID });
      if (itemDetails) {
          total += orderItem.quantity * itemDetails.itemPrice;
      }
  }
  return total;
}

function getCommonSchedule(orders) {
    const schedules = {};
    orders.forEach(order => {
        schedules[order.deliveryTimeRange] = (schedules[order.deliveryTimeRange] || 0) + 1;
    });
    return Object.entries(schedules)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
}

function getWeekNumber(date) {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOffset = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday, etc.
    
    // Adjust date to account for partial first week
    const adjustedDate = date.getDate() + dayOffset - 1;
    return Math.ceil(adjustedDate / 7);
    
}


async function getOrderStatus(order) {
    // Check for any delivery regardless of order status
    const delivery = await Delivery.findOne({ orderID: order.OrderID.toString() })
        .sort({ deliveredOn: -1 });
    
    if (delivery && delivery.deliveredOn) {  // Only consider it delivered if deliveredOn has a value
        const scheduledDate = new Date(order.deliveryDate);
        const actualDeliveryDate = new Date(delivery.deliveredOn);
        
        // Compare dates without time
        scheduledDate.setHours(0, 0, 0, 0);
        actualDeliveryDate.setHours(0, 0, 0, 0);
        
        return {
            isDelivered: true,
            isLate: actualDeliveryDate > scheduledDate,
            deliveryDate: delivery.deliveredOn
        };
    }

    return {
        isDelivered: false,
        isLate: false,
        deliveryDate: null
    };
}


module.exports = reportController;