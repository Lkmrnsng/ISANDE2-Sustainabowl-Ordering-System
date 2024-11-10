const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    OrderID: { type: Number },
    requestID: { type: Number }, 
    status: { type: String }, // Waiting Approval, Preparing, Dispatched, Delivered or Cancelled
    deliveryDate: { type: Date },
    deliveryAddress: { type: String},
    deliveryTimeRange: { type: String }, //Morning, Afternoon, Evening
    items: [{
        itemID: { type: Number },
        quantity: { type: Number }
    }],
    customizations: { type: String },
    pointPersonID: { type: Number },
    paymentMethod: { type: String }, // Card, Bank Transfer, GCash
});

const Order = mongoose.model('orders', OrderSchema);
module.exports = Order;