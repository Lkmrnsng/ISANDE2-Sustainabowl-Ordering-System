//Model Testing

const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    orderID: { type: Number },
    customerID: { type: Number },
    fulfilledStatus: { type: Boolean },
    totalDeliveries: { type: Number },
    fulfilledDeliveries: { type: Number },
    specialInstructions: { type: String },
});

const Order = mongoose.model('orders', OrderSchema);
module.exports = Order;