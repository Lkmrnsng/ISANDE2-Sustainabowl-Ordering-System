const Request = require('../models/Request');
const Order = require('../models/Order');
const { createAlert } = require('./alertController');

const cancelController = {
  async getCancelView(req, res) {
    try {
        const customerId = parseInt(req.session.userId);
        
        // First, get all requests for this customer
        const customerRequests = await Request.find({ 
            customerID: customerId 
        });

        // Get cancellable requests and their IDs
        const cancellableRequests = customerRequests.filter(req => 
            ['Received', 'Negotiation'].includes(req.status)
        ).sort((a, b) => b.requestDate - a.requestDate);

        // Get request IDs for approved requests (to find cancellable orders)
        const approvedRequestIds = customerRequests
            .filter(req => req.status === 'Approved')
            .map(req => req.requestID);

        // Get cancellable orders from approved requests
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

            // Find and verify the request
            const request = await Request.findOne({ 
                requestID: requestId,
                customerID: customerId,
                status: { $in: ['Received', 'Negotiation'] }
            });

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: 'Request not found or cannot be cancelled'
                });
            }

            // Create alert and update request status
            await Promise.all([
                createAlert({
                    concernType: 'Request Cancelled by Customer',
                    details: reason,
                    cancelRequest: true,
                    requestID: request.requestID,
                    byCustomer: true,
                    customerId: customerId
                }),
                Request.findOneAndUpdate(
                    { requestID: requestId },
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

            // Find and verify the order
            const order = await Order.findOne({
                OrderID: orderId,
                customerID: customerId,
                status: 'Preparing'
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found or cannot be cancelled'
                });
            }

            // Create alert and update order status
            await Promise.all([
                createAlert({
                    concernType: 'Order Cancelled by Customer',
                    details: reason,
                    cancelOrder: true,
                    requestID: order.requestID,
                    orderID: order.OrderID,
                    byCustomer: true,
                    customerId: customerId
                }),
                Order.findOneAndUpdate(
                    { OrderID: orderId },
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