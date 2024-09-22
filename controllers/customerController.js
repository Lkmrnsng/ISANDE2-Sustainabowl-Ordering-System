//Import Models
const User = require('../models/User');
const Request = require('../models/Request');
const Delivery = require('../models/Delivery');
const Item = require('../models/Item');

//Define Functions

/**
 * Get the customer dashboard which displays all their requests and its associated deliveries
 */
async function getDashboard(req, res) {}


module.exports = {
    getDashboard
}; // Export the functions so it can be used in routes/customerRoutes.js