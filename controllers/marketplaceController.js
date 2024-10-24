//Import Models
const User = require('../models/User');
const Request = require('../models/Request');
const Order = require('../models/Order');
const Item = require('../models/Item');


async function getCheckout(req, res) {
    res.render('marketplace_checkout', {
        title: 'Checkout',
        css: ['marketplace_checkout.css', "marketplace.css"],
        layout: 'marketplace',

    });
}


// Export Functions
module.exports = {
    getCheckout
};