const mongoose = require('mongoose');

const AgencySchema = new mongoose.Schema({
    agencyID: { type: Number },
    name: { type: String },
    contact: { type: String }, 
    location: { type: String },
    price: { type: Number },
    maxWeight: { type: Number },
});

const Agency = mongoose.model('DeliveryAgency', AgencySchema);
module.exports = Agency;