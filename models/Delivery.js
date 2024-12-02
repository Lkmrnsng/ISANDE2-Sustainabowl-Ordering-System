const mongoose = require('mongoose');

const DeliverySchema = new mongoose.Schema({
    deliveryID: { type: Number }, // 70001
    orderID: { type: Number }, // 40001
    isPaid: { type: Boolean, default: false },
    deliveredOn: { type: String }, 
});

const Delivery = mongoose.model('Delivery', DeliverySchema);
module.exports = Delivery;