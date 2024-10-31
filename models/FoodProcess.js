const mongoose = require('mongoose');

// Define Produce Schema
const ProduceSchema = new mongoose.Schema({
    id: { type: String }, // Unique ID for produce
    name: { type: String },
    process: { type: String },
    deliverBy: { type: Date },
    quantity: { type: Number },
    status: { type: String },
});

// Define Request Schema with embedded ProduceSchema
const RequestSchema = new mongoose.Schema({
    requestID: { type: String },
    customerID: { type: Number },
    status: { type: String },
    pointPersonID: { type: Number }, 
    requestDate: { type: Date }, 
    name: { type: String }, // Name of the source, e.g., 'Farm A'
    toProcess: { type: String },
    alertIcon: { type: Boolean, default: false },
    produce: [ProduceSchema]  // Embedding produce items in each request
});

// Export the FoodProcess model based on RequestSchema
const FoodProcess = mongoose.model('FoodProcess', RequestSchema);

module.exports = FoodProcess;
