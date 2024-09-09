// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Function to check if user is a verified driver
function isAuthenticatedDriver(req, res, next) {
  if (req.user && req.user.isVerifiedDriver) {
    return next();
  } else {
    res.redirect('/login');
    req.flash('error', 'You must be a verified driver to access that page, please login first');
  }
}

// Function to check if user is a verified passenger 
function isAuthenticatedPassenger(req, res, next) {
  if (req.user && req.user.isVerifiedPassenger) {
    return next();
  } else {
    res.redirect('/login');
    req.flash('error', 'You must be a verified user to access that page, please login first');
  }
}

// Get chat history between two users
router.get('/:userId', isAuthenticatedPassenger, chatController.getChatHistory);

// Send a new message
router.post('/send', isAuthenticatedPassenger, chatController.sendMessage);

module.exports = router;