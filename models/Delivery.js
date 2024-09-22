const mongoose = require('mongoose');

const DeliverySchema = new mongoose.Schema({
    deliveryID: { type: Number },
    requestID: { type: Number },
    status: { type: String },
    deliveryDate: { type: Date },
    items: {
        itemID: { type: Number },
        quantity: { type: Number }
    }
});

const Delivery = mongoose.model('deliveries', DeliverySchema);
module.exports = Delivery;