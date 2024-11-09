const Delivery = require('../models/Delivery');
const Request = require('../models/Request');
const Alert = require('../models/Alert');

const deliveryController = {
    // Get all delivery tasks with pagination
    getAllDeliveries: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            
            const deliveries = await Delivery.find()
                .skip((page - 1) * limit)
                .limit(limit);
            
            const total = await Delivery.countDocuments();
            
            res.json({
                deliveries,
                currentPage: page,
                totalPages: Math.ceil(total / limit)
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Book a delivery
    bookDelivery: async (req, res) => {
        try {
            const { requestId } = req.params;
            const { pickupLocation, dropOffLocation, totalWeight } = req.body;

            // Update delivery status
            const delivery = await Delivery.findOneAndUpdate(
                { requestID: requestId },
                { deliveryStatus: 'Dispatched' },
                { new: true }
            );

            // Haven't linked a delivery service yet
            
            res.json({ 
                message: 'Delivery booked successfully',
                delivery 
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Complete a delivery
    completeDelivery: async (req, res) => {
        try {
            const { requestId } = req.params;

            // Update delivery status
            const delivery = await Delivery.findOneAndUpdate(
                { requestID: requestId },
                { 
                    deliveryStatus: 'Delivered',
                    paymentStatus: 'Paid'
                },
                { new: true }
            );

            // Update request status
            await Request.findOneAndUpdate(
                { requestID: requestId },
                { status: 'Approved' }
            );

            res.json({ 
                message: 'Delivery completed successfully',
                delivery 
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Delete a delivery
    deleteDelivery: async (req, res) => {
        try {
            const { requestId } = req.params;
            
            await Delivery.findOneAndDelete({ requestID: requestId });
            
            res.json({ message: 'Delivery deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};