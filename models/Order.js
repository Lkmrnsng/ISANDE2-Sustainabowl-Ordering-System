const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    OrderID: { type: Number },
    requestID: { type: Number }, 
    status: { type: String }, // Waiting Approval, Preparing, Dispatched, Delivered or Cancelled
    OrderDate: { type: Date },
    items: [{
        itemID: { type: Number },
        quantity: { type: Number }
    }],
    customizations: { type: String }
});

const Order = mongoose.model('orders', OrderSchema);
module.exports = Order;