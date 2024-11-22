const Alert = require('../models/Alert');
const Message = require('../models/Message');
const Request = require('../models/Request');
const Order = require('../models/Order');

exports.createAlert = async (data) => {
    try {
        // Validate required fields
        const requiredFields = ['concernType', 'details', 'requestID'];
        for (const field of requiredFields) {
            if (!data[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Find the request to get pointPersonID for messaging
        const request = await Request.findOne({ requestID: data.requestID });
        if (!request) {
            throw new Error('Associated request not found');
        }

        // Create alert with defaults
        const alert = new Alert({
            alertID: Math.floor(Math.random() * 1000000),
            category: data.concernType,
            details: data.details,
            dateCreated: new Date(),
            orders: data.orders || [], // Array of order IDs
            userType: request.pointPersonID ? 'Sales' : 'Logistics' // Default to Sales if there's a point person
        });

        // If this is a cancellation alert, cancel all associated orders
        if (data.concernType === 'Cancellation' && data.orders && data.orders.length > 0) {
            const cancelPromises = data.orders.map(orderData => 
                Order.findOneAndUpdate(
                    { OrderID: orderData.OrderID },
                    { status: 'Cancelled' }
                )
            );
            await Promise.all(cancelPromises);
        }

        // Create system message for chat notification
        let messageText = `⚠️ System Alert: ${data.concernType}\n${data.details}`;
        if (data.orders && data.orders.length > 0) {
            const orderIds = data.orders.map(o => `#${o.OrderID}`).join(', ');
            messageText += `\nAffected Orders: ${orderIds}`;
        }

        const message = new Message({
            senderID: data.byCustomer ? data.customerId : request.pointPersonID,
            receiverID: data.byCustomer ? request.pointPersonID : request.customerID,
            message: messageText,
            date: new Date(),
            requestID: data.requestID
        });

        // Save both alert and message
        await Promise.all([
            alert.save(),
            message.save()
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
            // For customers, find alerts related to their requests
            const requests = await Request.find({ customerID: userId });
            const requestIds = requests.map(req => req.requestID);
            
            alerts = await Alert.find({
                orders: { 
                    $elemMatch: { 
                        requestID: { $in: requestIds }
                    }
                }
            })
            .sort({ dateCreated: -1 })
            .limit(20);
        } else {
            // For Sales and Logistics users, show relevant alerts for their department
            alerts = await Alert.find({
                userType: userType
            })
            .sort({ dateCreated: -1 })
            .limit(20);
        }

        // Transform alerts for frontend display
        const transformedAlerts = alerts.map(alert => ({
            alertID: alert.alertID,
            category: alert.category,
            details: alert.details,
            dateCreated: alert.dateCreated,
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
            message: 'Error fetching notifications',
            error: error.message
        });
    }
};