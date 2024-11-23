const mongoose = require('mongoose');

const DeliverySchema = new mongoose.Schema({
    deliveryID: { type: String }, // 70001
    orderID: { type: String }, // 40001
    isComplete: { type: Boolean, default: false },
    isPaid: { type: Boolean, default: false },
    deliveryDate: { type: String }, 
});

const Delivery = mongoose.model('Delivery', DeliverySchema);
module.exports = Delivery;