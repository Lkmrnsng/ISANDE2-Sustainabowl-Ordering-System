const mongoose = require('mongoose');

const DeliverySchema = new mongoose.Schema({
    deliveryID: { type: String },
    requestID: { type: String },
    weight: { type: Number },
    isComplete: { type: Boolean },
    isPaid: { type: Boolean, default: false },
    deliveryDate: { type: String },
});

const Delivery = mongoose.model('Delivery', DeliverySchema);
module.exports = Delivery;