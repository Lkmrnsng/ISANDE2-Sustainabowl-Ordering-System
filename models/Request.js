const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
    requestID: { type: Number },
    customerID: { type: Number },
    fulfilledStatus: { type: Boolean },
    totalDeliveries: { type: Number },
    fulfilledDeliveries: { type: Number }
});

const Request = mongoose.model('requests', RequestSchema);
module.exports = Request;

// Alternative to the above code: We'll be treating requests as unapproved orders, it will only become orders and deliveries once approved by the sales

// const mongoose = require('mongoose');

// const RequestSchema = new mongoose.Schema({
//     requestID: { type: Number },
//     customerID: { type: Number },
//     approvalStatus: { type: Boolean },
//     dates: { type: Date },
//     requestedItems: {
//         itemID: { type: Number },
//         quantity: { type: Number }
//     },
//     specialInstructions: { type: String }
// });

// const Request = mongoose.model('requests', RequestSchema);
// module.exports = Request;