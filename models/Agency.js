const mongoose = require('mongoose');

const AgencySchema = new mongoose.Schema({
    agencyID: { type: Number }, // 80001
    name: { type: String }, 
    contact: { type: String }, 
    location: { type: String }, 
    price: { type: Number }, 
    maxWeight: { type: Number }, 
});

const Agency = mongoose.model('Agency', AgencySchema);
module.exports = Agency;