const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    OrderID: { type: Number },
    requestID: { type: Number },
    // Received, Negotiation, Approved, Prepared, Dispatched, Delivered [1-6] or Cancelled
    status: { type: String }, 
    OrderDate: { type: Date },
    items: {
        itemID: { type: Number },
        quantity: { type: Number }
    },
    customizations: { type: String }
});

const Order = mongoose.model('orders', OrderSchema);
module.exports = Order;