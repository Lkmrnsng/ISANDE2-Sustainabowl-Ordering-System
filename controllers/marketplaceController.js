//Import Models
const User = require('../models/User');
const Request = require('../models/Request');
const Order = require('../models/Order');
const Item = require('../models/Item');

// Render the marketplace catalog page
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

// Render the marketplace checkout page
async function getCheckout(req, res) {
    const user = await User.findOne({ _id: req.user._id });
    const addresses = await getAddresses(req.user);

    res.render('marketplace_checkout', {
        title: 'Checkout',
        css: ['marketplace_checkout.css', "marketplace.css"],
        layout: 'marketplace',
        user: user || null,
        addresses: addresses
    });
}

// Function to fetch addresses of all the user's order history
async function getAddresses(user) {
    try {
        const userID = user.userID || null;
        const requests = await Request.find({ customerID: userID });
        let orders = [];
        let addresses = [];

        for (const request of requests) {
            const order = await Order.find({ requestID: request.requestID });
            if (order) orders.push(order);
        }

        for (const request of orders) {
            for (const order of request) {
                const address = order.deliveryAddress;

                if (!addresses.includes(address.trim())) {
                    addresses.push(address.trim());
                }
            }
        }

        return addresses;
    } catch (error) {
        console.log(error);
        return [];
    }
}

// Export Functions
module.exports = {
    getCatalog,
    getCheckout
};