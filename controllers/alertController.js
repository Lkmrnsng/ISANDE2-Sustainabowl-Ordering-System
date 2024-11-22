const Alert = require('../models/Alert');
const Message = require('../models/Message');
const Request = require('../models/Request');

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
            concernType: data.concernType,
            details: data.details,
            cancelRequest: data.cancelRequest || false,
            cancelOrder: data.cancelOrder || false,
            requestID: data.requestID,
            orderID: data.orderID || 0,
            byCustomer: data.byCustomer || false
        });

        // Create system message for chat notification
        let messageText = `>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>⚠️ System-generated Alert: ${data.concernType} \n Details:${data.details} <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`;
        if (data.orderID) {
            messageText = `⚠️ System-generated Alert: ${data.concernType} - Order #${data.orderID}\n${data.details}`;
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