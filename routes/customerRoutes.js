const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Consolidated auth middleware
const authMiddleware = {
  validateSession: (req, res, next) => {
      if (!req.session.userId) {
          return res.redirect('/login');
      }
      next();
  },

  validateRequest: async (req, res, next) => {
      try {
          const requestId = req.params.requestId || req.body.requestID;
          const request = await Request.findOne({ requestID: requestId });
          
          if (!request) {
              return res.status(404).json({ error: 'Request not found' });
          }

          const userType = req.session.userType;
          const userId = req.session.userId;

          const hasAccess = userType === 'Customer' 
              ? request.customerID === userId
              : request.pointPersonID === userId;

          if (!hasAccess) {
              return res.status(403).json({ error: 'Unauthorized access' });
          }

          req.chatRequest = request;
          next();
      } catch (error) {
          next(error);
      }
  }
};

// Get the customer dashboard
router.get('/dashboard', authMiddleware.validateSession, customerController.getDashboard);
router.get('/dashboard/requests/:requestID/breakdown', authMiddleware.validateSession, customerController.getBreakdown);

// Get the My Orders page
router.get('/orders', customerController.getOrders);

module.exports = router; // Export router so it can be used in app.js
