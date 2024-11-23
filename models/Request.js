const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
    requestID: { type: Number }, //30001 onwards format
    customerID: { type: Number },
    status: { type: String }, //Received, Negotiation, Approved, or Cancelled
    pointPersonID: { type: Number }, //Sales Rep
    requestDate: { type: String }, // Date request was made
});

const Request = mongoose.model('requests', RequestSchema);
module.exports = Request;

