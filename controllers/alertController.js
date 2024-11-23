const Alert = require('../models/Alert');
const Message = require('../models/Message');
const Request = require('../models/Request');
const Order = require('../models/Order');

exports.createAlert = async (data) => {
    try {
        // Validate required fields
        const requiredFields = ['category', 'details', 'orders', 'userType'];
        for (const field of requiredFields) {
            if (!data[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        //Get Orders from orders array
        const orders = await Order.find({ OrderID: { $in: data.orders } });

        //Get Request IDs from orders
        const requestIds = [...new Set(orders.map(order => order.requestID))];

        //Get Requests from request IDs
        const requests = await Request.find({ requestID: { $in: requestIds } });
        
        const alert = new Alert({
            alertID: await getNextAlertId(),
            category: data.category,
            details: data.details,
            dateCreated: new Date().toISOString(),
            orders: data.orders,
            userType: data.userType
        });

        // Handle cancellations
        if (data.cancelRequest) {
            await Request.findManyAndUpdate(
                { requestID: { $in: requestIds } },
                { status: 'Cancelled' }
            );
        }

        if (data.cancelOrder && orders.length > 0) {
            await Order.findManyAndUpdate(
                { OrderID: { $in: data.orders } },
                { status: 'Cancelled' }
            );
        }

        // Create system message for each request in requests
        for (const request of requests) {
            const message = new Message({
                senderID: request.pointPersonID,
                recipientID: request.customerID,
                message: `⚠️ System-generated Alert: [${data.category} from ${data.userType}] Reason: ${data.details}`,
                dateSent: new Date().toISOString(),
                requestID: request.requestID
            });

            await message.save(); // Save message
        }

        await Promise.all([
            alert.save()
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