const mongoose = require('mongoose');

const ProcurementSchema = new mongoose.Schema({
    procurementID: { type: Number },
    deliveryAgencyID: { type: Number },
    bookedItems: { type: Array }, // 2d array: itemid, qty shipping
    receivedItems: { type: Array }, // 2d array: itemid, qty accepted, qty discarded
    incomingDate: { type: String }, 
    receivedDate: { type: String },
    status: { type: String, default: "Booked" } // Booked, Cancelled, Completed 
});

const Procurement = mongoose.model('Procurement', ProcurementSchema);
module.exports = Procurement;