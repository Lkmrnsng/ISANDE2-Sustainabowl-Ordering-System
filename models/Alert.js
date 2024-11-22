const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
    alertID: { type: Number }, //90001 onwards format
    category: { type: String }, // Delay, Cancellation, Reminder 
    details: { type: String },
    dateCreated: { type: String },
    orders: { type: Array }, // 1d array of order ids 
    userType: { type: String }, // Customer, Sales, Logistics
});

const Alert = mongoose.model('Alert', AlertSchema);
module.exports = Alert;
