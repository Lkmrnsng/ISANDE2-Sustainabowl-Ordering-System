const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
    alertID: { type: Number }, //90001 onwards format
    category: { type: String }, // Delay, Cancellation, Reminder 
    details: { type: String },
    dateCreated: { type: String },
    orders: { type: Array }, // 1d array of order ids 
    createdById: { type: Number }, // ID of the user who created the alert
});

const Alert = mongoose.model('Alert', AlertSchema);
module.exports = Alert;