const mongoose = require('mongoose');

const DeliverySchema = new mongoose.Schema({
    deliveryID: { type: String }, // 70001
    orderID: { type: String }, // 40001
    isPaid: { type: Boolean, default: false },
    deliveredOn: { type: String }, 
});

const Delivery = mongoose.model('Delivery', DeliverySchema);
module.exports = Delivery;