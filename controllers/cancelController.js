const Request = require('../models/Request');
const Order = require('../models/Order');
const { createAlert } = require('./alertController');

const cancelController = {
    async getCancelView(req, res) {
        try {
            const customerId = parseInt(req.session.userId);
            
            const customerRequests = await Request.find({ 
                customerID: customerId 
            }).sort({ requestID: -1 });

            const cancellableRequests = customerRequests.filter(req => 
                ['Received', 'Negotiation'].includes(req.status)
            );

            const approvedRequestIds = customerRequests
                .filter(req => req.status === 'Approved')
                .map(req => req.requestID);

            const cancellableOrders = await Order.find({
                requestID: { $in: approvedRequestIds },
                status: 'Preparing'
            }).sort({ OrderID: -1 });

            res.render('customer-cancel', {
                title: 'Cancel Request/Order',
                css: ['customer.css'],
                layout: 'customer',
                requests: cancellableRequests,
                orders: cancellableOrders,
                active: 'cancel'
            });

        } catch (error) {
            console.error('Error loading cancel view:', error);
            res.status(500).send('Failed to load cancellation page');
        }
    },

    async cancelRequest(req, res) {
        try {
            const customerId = parseInt(req.session.userId);
            const { requestId, reason } = req.body;

            const request = await Request.findOne({ 
                requestID: parseInt(requestId),
                customerID: customerId,
                status: { $in: ['Received', 'Negotiation'] }
            });

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: 'Request not found or cannot be cancelled'
                });
            }

            const orders = await Order.find({ requestID: request.requestID });
            const orderIds = orders.map(order => order.OrderID);

            if (orders.length > 0) {
                await Order.updateMany(
                    { requestID: request.requestID },
                    { status: 'Cancelled' }
                );
            }

            await Promise.all([
                createAlert({
                    category: 'Cancellation',
                    details: reason,
                    orders: orderIds || [],
                    createdById: request.customerID || 0,
                }),
                Request.findOneAndUpdate(
                    { requestID: parseInt(requestId) },
                    { status: 'Cancelled' }
                )
            ]);

            res.json({
                success: true,
                message: 'Request cancelled successfully'
            });

        } catch (error) {
            console.error('Error cancelling request:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to cancel request'
            });
        }
    },

    async cancelOrder(req, res) {
        try {
            const customerId = parseInt(req.session.userId);
            const { orderId, reason } = req.body;

            const order = await Order.findOne({
                OrderID: parseInt(orderId),
                status: 'Preparing'
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found or cannot be cancelled'
                });
            }

            const request = await Request.findOne({
                requestID: order.requestID,
                customerID: customerId
            });

            if (!request) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized to cancel this order'
                });
            }

            await Promise.all([
                createAlert({
                    category: 'Cancellation',
                    details: reason,
                    orders: [order.OrderID],
                    createdById: request.customerID || 0, 
                }),
                Order.findOneAndUpdate(
                    { OrderID: parseInt(orderId) },
                    { status: 'Cancelled' }
                )
            ]);

            res.json({
                success: true,
                message: 'Order cancelled successfully'
            });

        } catch (error) {
            console.error('Error cancelling order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to cancel order'
            });
        }
    }
};

module.exports = cancelController;