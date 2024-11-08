//Import Models
const User = require('../models/User');
const Request = require('../models/Request');
const Order = require('../models/Order');
const Item = require('../models/Item');

async function getCatalog(req, res) {
    try {
        const items = await Item.find({});
        
        res.render('marketplace_catalog', {
            title: "Catalog",
            css: ["marketplace_catalog.css", "marketplace.css"],
            layout: "marketplace",
            user: req.user || null,
            items: items
        });
    } catch(err) {
        console.error('Error fetching items:', err);
    }
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