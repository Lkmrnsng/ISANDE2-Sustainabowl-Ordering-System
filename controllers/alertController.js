const Alert = require('../models/Alert');
const Message = require('../models/Message');
const Request = require('../models/Request');
const Order = require('../models/Order');

exports.createAlert = async (data) => {
    try {
        // Map the incoming data to match required fields
        // This handles both direct alert creation and batch creation from the alert page
        const alertData = {
            category: data.concernType || data.category, // Handle both naming conventions
            details: data.details,
            orders: Array.isArray(data.orders) ? data.orders : [data.orderID], // Handle both single and multiple orders
            userType: data.byCustomer ? 'Customer' : req.session.userType, // Use session for Sales/Logistics
        };

        // Validate required fields
        const requiredFields = ['category', 'details', 'orders', 'userType'];
        for (const field of requiredFields) {
            if (!alertData[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        //Get Orders from orders array
        const orders = await Order.find({ OrderID: { $in: alertData.orders } });

        //Get Request IDs from orders
        const requestIds = [...new Set(orders.map(order => order.requestID))];

        //Get Requests from request IDs
        const requests = await Request.find({ requestID: { $in: requestIds } });
        
        const alert = new Alert({
            alertID: await getNextAlertId(),
            category: alertData.category,
            details: alertData.details,
            dateCreated: new Date().toISOString(),
            orders: alertData.orders,
            userType: alertData.userType
        });

        // Handle cancellations - check both data.cancelOrders (from page) and data.cancelOrder (from direct creation)
        if (data.cancelOrder || data.cancelOrders) {
            if (data.cancelRequest) {
                await Request.updateMany(
                    { requestID: { $in: requestIds } },
                    { status: 'Cancelled' }
                );
            }

            await Order.updateMany(
                { OrderID: { $in: alertData.orders } },
                { status: 'Cancelled' }
            );
        }

        // Create system message for each request in requests
        const messagePromises = requests.map(request => {
            const message = new Message({
                senderID: request.pointPersonID,
                receiverID: request.customerID,
                message: `⚠️ System-generated Alert: [${alertData.category} from ${alertData.userType}] Reason: ${alertData.details}`,
                date: new Date(),
                requestID: request.requestID
            });

            return message.save();
        });

        // Save everything
        await Promise.all([
            alert.save(),
            ...messagePromises
        ]);

        return alert;
    } catch (error) {
        console.error('Error creating alert:', error);
        throw error;
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.session.userId;
        const userType = req.session.userType;
        let alerts;

        if (userType === 'Customer') {
            // Get all alerts first
            alerts = await Alert.find().sort({ dateCreated: -1 });

            // Filter alerts based on customer ID
            alerts = await Promise.all(alerts.map(async alert => {
                // Get all orders mentioned in the alert
                const orders = await Order.find({ 
                    OrderID: { $in: alert.orders } 
                });

                // Get all request IDs from these orders
                const requestIds = [...new Set(orders.map(order => order.requestID))];

                // Get all requests with these IDs
                const requests = await Request.find({
                    requestID: { $in: requestIds }
                });

                // Get all customer IDs from these requests
                const customerIds = [...new Set(requests.map(request => request.customerID))];

                // If current user is one of these customers, include the alert
                if (customerIds.includes(userId)) {
                    return alert;
                }
                return null;
            }));

            // Remove null values and limit to 20 alerts
            alerts = alerts.filter(alert => alert !== null).slice(0, 20);

        } else {
            // For Sales and Logistics, get all alerts
            alerts = await Alert.find()
                .sort({ dateCreated: -1 })
                .limit(20);
        }

        // Transform alerts for frontend display
        const transformedAlerts = alerts.map(alert => ({
            alertID: alert.alertID,
            category: alert.category,
            details: alert.details,
            date: alert.dateCreated,
            orders: alert.orders,
            userType: alert.userType
        }));

        res.json({
            success: true,
            notifications: transformedAlerts
        });

    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notifications'
        });
    }
};

async function getNextAlertId() {
    const lastAlert = await Alert.findOne().sort({ alertID: -1 });
    return lastAlert ? lastAlert.alertID + 1 : 90001;
}