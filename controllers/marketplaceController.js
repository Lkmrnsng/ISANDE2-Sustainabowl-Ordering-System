//Import Models
const User = require('../models/User');
const Request = require('../models/Request');
const Order = require('../models/Order');
const Item = require('../models/Item');

async function getCatalog(req, res) {
    res.render('marketplace_catalog', {
        title: "Catalog",
        css: ["marketplace_catalog.css", "marketplace.css"],
        layout: "marketplace",
        user: user || null
    });
}

async function getCheckout(req, res) {
    res.render('marketplace_checkout', {
        title: 'Checkout',
        css: ['marketplace_checkout.css', "marketplace.css"],
        layout: 'marketplace'
    });
}

// Export Functions
module.exports = {
    getCatalog,
    getCheckout
};