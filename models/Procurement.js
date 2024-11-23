const mongoose = require('mongoose');

const ProcurementSchema = new mongoose.Schema({
    procurementID: { type: Number }, // 60001
    agencyID: { type: Number }, // 80001
    bookedItems: { type: Array }, // 2d array: itemid (20001), qty shipping, cost
    receivedItems: { type: Array }, // 2d array: itemid (20001), qty accepted, qty discarded
    incomingDate: { type: String }, // 2024-11-11T00:00:00Z
    receivedDate: { type: String }, // 2024-11-11T00:00:00Z
    status: { type: String, default: "Booked" } // Booked, Cancelled, Completed 
});

const Procurement = mongoose.model('Procurement', ProcurementSchema);
module.exports = Procurement;