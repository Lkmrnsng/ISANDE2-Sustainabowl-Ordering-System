const mongoose = require('mongoose');

const ProduceSchema = new mongoose.Schema({
    id: String,
    name: String,
    process: String,
    deliverBy: Date,
    quantity: Number,
    status: String
});

const RequestSchema = new mongoose.Schema({
    id: String,
    name: String,
    toProcess: String,
    status: String,
    alertIcon: Boolean,
    produce: [ProduceSchema]
});

const FoodProcess = mongoose.model('FoodProcess', RequestSchema);

module.exports = FoodProcess;
