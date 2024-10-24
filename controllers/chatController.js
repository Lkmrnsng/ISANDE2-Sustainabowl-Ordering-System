// 1. First, update chatController.js with proper error handling and session management

const Message = require('../models/Message');
const Request = require('../models/Request');
const Order = require('../models/Order');
const Item = require('../models/Item');
const User = require('../models/User');

// Custom error handler
class ChatError extends Error {
    constructor(message, status = 500) {
        super(message);
        this.status = status;
    }
}

const chatController = {
    async getCustomerChatView(req, res, next) {
        try {
            if (!req.session.userId) {
                throw new ChatError('Unauthorized access', 401);
            }
    
            const customerId = req.session.userId;
            let requests = await Request.find({ customerID: customerId })
                .sort({ requestDate: -1 })
                .lean();
    
            if (!requests.length) {
                return res.render('customer-chat', {
                    requests: [],
                    userType: 'Customer',
                    userId: customerId,
                    layout: 'main',
                    title: 'Customer Chat',
                    css: ['chat.css'],
                    js: ['chat.js'],
                });
            }
    
            // Efficiently fetch all related data in parallel
            const [messages, orders, items] = await Promise.all([
                Message.find({ 
                    requestID: { $in: requests.map(r => r.requestID) }
                }).sort({ date: 1 }).lean(),
                Order.find({ 
                    requestID: { $in: requests.map(r => r.requestID) }
                }).sort({ deliveryDate: 1 }).lean(),
                Item.find({}).lean()
            ]);
    
            // Create items lookup map for efficiency
            const itemsMap = new Map(items.map(item => [item.itemID, item]));
    
            // Process requests with their associated data
            requests = requests.map(request => {
                const requestMessages = messages.filter(m => m.requestID === request.requestID);
                const requestOrders = orders.filter(o => o.requestID === request.requestID)
                    .map(order => {
                        // Process items with prices for each order
                        const processedItems = order.items.map(item => {
                            const itemDetails = itemsMap.get(item.itemID) || {};
                            return {
                                ...item,
                                itemName: itemDetails.itemName || 'Unknown Item',
                                itemPrice: itemDetails.itemPrice || 0,
                                totalPrice: (itemDetails.itemPrice || 0) * item.quantity
                            };
                        });
    
                        // Calculate total order amount
                        const totalAmount = processedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
                        return {
                            ...order,
                            items: processedItems,
                            totalAmount
                        };
                    });
    
                return {
                    ...request,
                    messages: requestMessages,
                    orders: requestOrders
                };
            });
    
            res.render('customer-chat', {
                requests,
                userType: 'Customer',
                userId: customerId,
                layout: 'main',
                title: 'Customer Chat',
                css: ['chat.css'],
                js: ['chat.js'],
                activeRequest: requests.length > 0 ? requests[0] : null
            });
        } catch (error) {
            next(error instanceof ChatError ? error : new ChatError('Server error'));
        }
    },
    
    async getSalesChatView(req, res, next) {
        try {
            if (!req.session.userId) {
                throw new ChatError('Unauthorized access', 401);
            }
    
            const salesId = req.session.userId;
            let requests = await Request.find({ pointPersonID: salesId })
                .sort({ requestDate: -1 })
                .lean();
    
            if (!requests.length) {
                return res.render('sales-chat', {
                    requests: [],
                    userType: 'Sales',
                    userId: salesId,
                    layout: 'main',
                    title: 'Sales Chat',
                    css: ['chat.css'],
                    js: ['chat.js'],
                });
            }
    
            // Efficiently fetch all related data in parallel
            const [messages, orders, items, customers] = await Promise.all([
                Message.find({ 
                    requestID: { $in: requests.map(r => r.requestID) }
                }).sort({ date: 1 }).lean(),
                Order.find({ 
                    requestID: { $in: requests.map(r => r.requestID) }
                }).sort({ deliveryDate: 1 }).lean(),
                Item.find({}).lean(),
                User.find({ 
                    userID: { $in: requests.map(r => r.customerID) }
                }).lean()
            ]);
    
            // Create lookup maps for efficiency
            const itemsMap = new Map(items.map(item => [item.itemID, item]));
            const customersMap = new Map(customers.map(customer => [customer.userID, customer]));
    
            // Process requests with their associated data
            requests = requests.map(request => {
                const customer = customersMap.get(request.customerID) || {};
                const requestMessages = messages.filter(m => m.requestID === request.requestID);
                const requestOrders = orders.filter(o => o.requestID === request.requestID)
                    .map(order => {
                        // Process items with prices for each order
                        const processedItems = order.items.map(item => {
                            const itemDetails = itemsMap.get(item.itemID) || {};
                            return {
                                ...item,
                                itemName: itemDetails.itemName || 'Unknown Item',
                                itemPrice: itemDetails.itemPrice || 0,
                                totalPrice: (itemDetails.itemPrice || 0) * item.quantity
                            };
                        });
    
                        // Calculate total order amount
                        const totalAmount = processedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
                        return {
                            ...order,
                            items: processedItems,
                            totalAmount
                        };
                    });
    
                return {
                    ...request,
                    customerName: customer.name || 'Unknown Customer',
                    messages: requestMessages,
                    orders: requestOrders
                };
            });

    
            res.render('sales-chat', {
                requests,
                userType: 'Sales',
                userId: salesId,
                layout: 'main',
                title: 'Sales Chat',
                css: ['chat.css'],
                js: ['chat.js'],
                activeRequest: requests.length > 0 ? requests[0] : null
            });
        } catch (error) {
            next(error instanceof ChatError ? error : new ChatError('Server error'));
        }
    },

    async sendMessage(req, res, next) {
        try {
            const { requestID, message } = req.body;
            if (!requestID || !message?.trim()) {
                throw new ChatError('Invalid message data', 400);
            }

            const senderID = req.session.userId;
            if (!senderID) {
                throw new ChatError('Unauthorized', 401);
            }

            const request = await Request.findOne({ requestID });
            if (!request) {
                throw new ChatError('Request not found', 404);
            }

            // Verify user has access to this request
            if (req.session.userType === 'Customer' && request.customerID !== senderID) {
                throw new ChatError('Unauthorized access to request', 403);
            }

            const receiverID = req.session.userType === 'Customer' 
                ? request.pointPersonID 
                : request.customerID;

            const newMessage = await Message.create({
                senderID,
                receiverID,
                message: message.trim(),
                requestID,
                date: new Date()
            });

            res.status(201).json(newMessage);
        } catch (error) {
            next(error instanceof ChatError ? error : new ChatError('Server error'));
        }
    },

    async getChatMessages(req, res, next) {
        try {
            const { requestId } = req.params;
            if (!requestId) {
                throw new ChatError('Request ID is required', 400);
            }
    
            // Fetch request, messages, and orders
            const [messages, orders, request] = await Promise.all([
                Message.find({ requestID: requestId }).sort({ date: 1 }).lean(),
                Order.find({ requestID: requestId }).lean(),
                Request.findOne({ requestID: requestId }).lean()
            ]);
    
            if (!request) {
                throw new ChatError('Request not found', 404);
            }
    
            // Enhance orders with item details including prices
            const enhancedOrders = await Promise.all(orders.map(async (order) => {
                const itemsWithDetails = await Promise.all(order.items.map(async (item) => {
                    const itemDetails = await Item.findOne({ itemID: item.itemID });
                    return {
                        ...item,
                        itemName: itemDetails?.itemName || 'Unknown Item',
                        itemPrice: itemDetails?.itemPrice || 0,
                        totalPrice: (itemDetails?.itemPrice || 0) * item.quantity
                    };
                }));
    
                // Calculate total order amount
                const totalAmount = itemsWithDetails.reduce((sum, item) => sum + item.totalPrice, 0);
    
                return {
                    ...order,
                    items: itemsWithDetails,
                    totalAmount
                };
            }));
    
            res.json({ messages, orders: enhancedOrders, request });
        } catch (error) {
            next(error instanceof ChatError ? error : new ChatError('Server error'));
        }
    },

    async updateRequestStatus(req, res) {
        try {
            const { requestId } = req.params;
            const { status } = req.body;
    
            const validStatuses = ['Received', 'Negotiation', 'Approved', 'Cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }
    
            const request = await Request.findOneAndUpdate(
                { requestID: requestId },
                { status },
                { new: true }
            );
    
            if (!request) {
                return res.status(404).json({ error: 'Request not found' });
            }
    
            res.json({ 
                success: true, 
                status: request.status 
            });
        } catch (error) {
            console.error('Error updating request status:', error);
            res.status(500).json({ error: 'Failed to update request status' });
        }
    }
};

module.exports = chatController;



