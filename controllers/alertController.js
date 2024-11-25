const Alert = require('../models/Alert');
const Message = require('../models/Message');
const Request = require('../models/Request');
const Order = require('../models/Order');
const User = require('../models/User');

exports.createAlert = async (data) => {
    try {
        // Map the incoming data to match required fields
        const alertData = {
            category: data.concernType || data.category,
            details: data.details,
            orders: Array.isArray(data.orders) ? data.orders : [data.orderID],
            createdById: data.createdById
        };

        // Validate required fields
        const requiredFields = ['category', 'details', 'orders', 'createdById'];
        for (const field of requiredFields) {
            if (!alertData[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Get creator's user type
        const creator = await User.findOne({ userID: alertData.createdById });
        if (!creator) {
            throw new Error('Creator not found');
        }

        // Get Orders from orders array
        const orders = await Order.find({ OrderID: { $in: alertData.orders } });

        // Get Request IDs from orders
        const requestIds = [...new Set(orders.map(order => order.requestID))];

        // Get Requests from request IDs
        const requests = await Request.find({ requestID: { $in: requestIds } });
        
        const alert = new Alert({
            alertID: await getNextAlertId(),
            category: alertData.category,
            details: alertData.details,
            dateCreated: new Date().toISOString(),
            orders: alertData.orders,
            createdById: alertData.createdById
        });

        // Handle cancellations
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
                message: `⚠️ System-generated Alert: [${alertData.category} from ${creator.usertype}] Reason: ${alertData.details}`,
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

// Add delete alert functionality
exports.deleteAlert = async (alertId, userId, userType) => {
    try {
        const alert = await Alert.findOne({ alertID: alertId });
        
        if (!alert) {
            throw new Error('Alert not found');
        }

        // Check if the user has permission to delete this alert
        if (alert.createdById !== userId && userType !== 'Sales') {
            throw new Error('Unauthorized to delete this alert');
        }

        await Alert.deleteOne({ alertID: alertId });
        return true;
    } catch (error) {
        console.error('Error deleting alert:', error);
        throw error;
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.session.userId;
        const userType = req.session.userType;
        let alerts = await Alert.find().sort({ dateCreated: -1 });

        // Populate creator information for each alert
        const alertsWithCreator = await Promise.all(alerts.map(async alert => {
            const creator = await User.findOne({ userID: alert.createdById });
            return {
                ...alert.toObject(),
                creatorType: creator ? creator.usertype : 'Unknown'
            };
        }));

        if (userType === 'Customer') {
            // Filter alerts for customer
            const filteredAlerts = [];
            for (const alert of alertsWithCreator) {
                const orders = await Order.find({ OrderID: { $in: alert.orders } });
                const requestIds = [...new Set(orders.map(order => order.requestID))];
                const requests = await Request.find({ requestID: { $in: requestIds } });
                const customerIds = [...new Set(requests.map(request => request.customerID))];

                if (customerIds.includes(userId)) {
                    filteredAlerts.push(alert);
                }
            }
            alerts = filteredAlerts.slice(0, 20);
        } else {
            alerts = alertsWithCreator.slice(0, 20);
        }

        res.json({
            success: true,
            notifications: alerts
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