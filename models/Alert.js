const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
    alertID: { type: Number, required: true },
    concernType: { type: String, required: true }, //Delay, Cancellation, Other
    details: { type: String, required: true },
    cancelRequest: { type: Boolean, default: false }, //If this Alert will cancel the request
    cancelOrder: { type: Boolean, default: false }, //If this Alert will cancel the order
    dateCreated: { type: Date, default: Date.now },
    requestID: { type: Number, required: true },
    orderID: { type: Number, required: true },
    byCustomer: { type: Boolean, default: true }, //If this Alert was created by the customer
});

const Alert = mongoose.model('Alert', AlertSchema);
module.exports = Alert;
