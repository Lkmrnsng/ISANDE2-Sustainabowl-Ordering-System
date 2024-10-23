// controllers/chatController.js
const Message = require('../models/Message');
const Request = require('../models/Request');
const Order = require('../models/Order');

const chatController = {
    // View Controllers
    async getCustomerChatView(req, res) {
        try {
            const customerId = req.session.userId;
            const requests = await Request.find({ customerID: customerId })
                .sort({ requestDate: -1 });

            //Get First Request and set as activeRequest
            const activeRequest = requests[0];

            //Get messages for the active request
            const messages = await Message.find({ requestID: activeRequest.requestID })
                .sort({ date: 1 });

            res.render('customer-chat', {
                requests,
                userType: 'Customer',
                userId: customerId,
                layout: 'main',
                title: 'Customer Chat',
                css: ['chat.css'],
                activeRequest,
                messages,
            });
        } catch (error) {
            console.error('Error loading customer chat view:', error);
            res.status(500).send('Error loading chat view');
        }
    },

    async getSalesChatView(req, res) {
        try {
            const salesId = req.session.userId || 10002;
            const requests = await Request.find({ pointPersonID: salesId })
                .sort({ requestDate: -1 });

            //Get First Request and set as activeRequest
            const activeRequest = requests[0];

            //Get messages for the active request
            const messages = await Message.find({ requestID: activeRequest.requestID })
                .sort({ date: 1 });

            res.render('sales-chat', {
                requests,
                userType: 'Sales',
                userId: salesId,
                layout: 'main',
                title: 'Sales Chat',
                css: ['chat.css'],
                activeRequest,
                messages,
            });
        } catch (error) {
            console.error('Error loading sales chat view:', error);
            res.status(500).send('Error loading chat view');
        }
    },

    // API Controllers
    async getChatMessages(req, res) {
        try {
            const { requestId } = req.params;
            
            // Get messages
            const messages = await Message.find({ requestID: requestId })
                .sort({ date: 1 });

            // Get orders associated with the request
            const orders = await Order.find({ requestID: requestId })
                .sort({ deliveryDate: 1 });

            // Get request details
            const request = await Request.findOne({ requestID });

            res.json({
                messages,
                orders,
                request
            });
        } catch (error) {
            console.error('Error fetching chat data:', error);
            res.status(500).send('Error fetching chat data');
        }
    },

    async sendMessage(req, res) {
        try {
            const { requestID, message } = req.body;
            const senderID = req.session.userId;
            
            // Get request to determine receiver
            const request = await Request.findOne({ requestID });
            if (!request) {
                return res.status(404).send('Request not found');
            }

            // Determine receiver based on sender type
            const receiverID = req.session.userType === 'Customer' 
                ? request.pointPersonID 
                : request.customerID;

            const newMessage = new Message({
                senderID,
                receiverID,
                message,
                requestID,
                date: new Date()
            });

            await newMessage.save();
            res.status(201).json(newMessage);
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).send('Error sending message');
        }
    },

    async getOrderDetails(req, res) {
        try {
            const { orderId } = req.params;
            const order = await Order.findOne({ OrderID: orderId });
            
            if (!order) {
                return res.status(404).send('Order not found');
            }

            res.json(order);
        } catch (error) {
            console.error('Error fetching order details:', error);
            res.status(500).send('Error fetching order details');
        }
    },

    async updateOrder(req, res) {
        try {
            const { orderId } = req.params;
            const updates = req.body;
            const { applyToAll } = updates;
            
            // Remove applyToAll from updates
            delete updates.applyToAll;

            if (applyToAll) {
                // Get the order to find its requestID
                const order = await Order.findOne({ OrderID: orderId });
                if (!order) {
                    return res.status(404).send('Order not found');
                }

                // Update all orders for this request
                await Order.updateMany(
                    { requestID: order.requestID },
                    { $set: updates }
                );
            } else {
                // Update single order
                await Order.findOneAndUpdate(
                    { OrderID: orderId },
                    { $set: updates }
                );
            }

            // Create system message about the update
            const systemMessage = new Message({
                senderID: req.session.userId ,
                receiverID: null, // System message
                message: `Order #${orderId} has been updated`,
                requestID: order.requestID,
                date: new Date()
            });
            await systemMessage.save();

            res.status(200).send('Order updated successfully');
        } catch (error) {
            console.error('Error updating order:', error);
            res.status(500).send('Error updating order');
        }
    },

    async getCustomerRequests(req, res) {
        try {
            const { customerId } = req.params;
            const requests = await Request.find({ customerID: customerId })
                .sort({ requestDate: -1 });
            res.json(requests);
        } catch (error) {
            console.error('Error fetching customer requests:', error);
            res.status(500).send('Error fetching requests');
        }
    },

    async getSalesRequests(req, res) {
        try {
            const { salesId } = req.params || 10002;
            const requests = await Request.find({ pointPersonID: salesId })
                .sort({ requestDate: -1 });
            res.json(requests);
        } catch (error) {
            console.error('Error fetching sales requests:', error);
            res.status(500).send('Error fetching requests');
        }
    }
};

module.exports = chatController;