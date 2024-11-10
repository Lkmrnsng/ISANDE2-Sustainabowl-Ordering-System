const User = require('../models/User');
const Request = require('../models/Request');
const Order = require('../models/Order');
const Item = require('../models/Item');
const Review = require('../models/Review');
const { get } = require('express/lib/response');


// Fetch the sales dashboard
async function getDashboard(req, res) {
    try{
        res.render('sales_dashboard', {
            title: 'Dashboard',
            css: ['logisales_dashboard.css'],
            layout: 'sales',
            active: 'dashboard'
        });
        
    }catch(err){
        console.error('Error fetching items:', err);
    }
}

async function getRequests(req, res) {
    try{
        const requests = await Request.find({});

        res.render('sales_requests', {
            title: 'Requests',
            css: ['sales_requests.css'],
            layout: 'sales',
            active: 'requests',
            requests: requests
        });
    }catch(err){
        console.error('Error fetching items:', err);
    }
}

module.exports = {
    getDashboard,
    getRequests
};