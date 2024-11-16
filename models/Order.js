const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    OrderID: { type: Number },
    requestID: { type: Number }, 
    status: { type: String }, // Waiting Approval, Preparing, Dispatched, Delivered or Cancelled
        items: [{
        itemID: { type: Number },
        quantity: { type: Number }
    }],
    customizations: { type: String },
    deliveryDate: { type: String },
    deliveryAddress: { type: String},
    deliveryTimeRange: { type: String }, //Morning, Afternoon, Evening
    pointPersonID: { type: Number },
    paymentMethod: { type: String }, // Card, Bank Transfer, GCash
});

const Order = mongoose.model('orders', OrderSchema);
module.exports = Order;