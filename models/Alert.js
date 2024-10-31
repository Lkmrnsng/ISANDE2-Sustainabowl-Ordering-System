const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
    alertID: { type: Number, required: true },
    concernType: { type: String, required: true }, //Received, Negotiation, Approved
    details: { type: String, required: true },
    cancelRequest: { type: Boolean, default: false },
    dateCreated: { type: Date, default: Date.now },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'requests', required: true } // Reference to Request model
});

const Alert = mongoose.model('Alert', AlertSchema);
module.exports = Alert;
