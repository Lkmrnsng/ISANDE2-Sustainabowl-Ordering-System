const mongoose = require('mongoose');

const DeliverySchema = new mongoose.Schema({
    requestID: { type: Number, required: true },
    weight: { type: Number, required: true },
    deliveryStatus: { 
        type: String, 
        enum: ['Pending', 'Dispatched', 'Delivered'],
        default: 'Pending'
    },
    paymentStatus: {
        type: String,
        enum: ['Paid', 'Unpaid'],
        default: 'Unpaid'
    },
    deliverBy: { type: Date, required: true },
    alertIcon: { type: Boolean, default: false }
});

const Delivery = mongoose.model('Delivery', DeliverySchema);