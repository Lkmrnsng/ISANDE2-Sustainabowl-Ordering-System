const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
    requestID: { type: Number },
    customerID: { type: Number },
    status: { type: String }, // Received, Negotiation, Approved, Prepared, Dispatched, Delivered [1-6] or Cancelled
});

const Request = mongoose.model('requests', RequestSchema);
module.exports = Request;

