const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

// Middleware to check if user is sales team
const isSalesTeam = (req, res, next) => {
    if (req.session.userType !== 'Sales') {
        return res.status(403).send('Access denied');
    }
    next();
};

// Customer routes
router.get('/form/:orderId', isAuthenticated, reviewController.getReviewForm);
router.post('/submit', isAuthenticated, reviewController.submitReview);
router.get('/my-reviews', isAuthenticated, reviewController.getCustomerReviews);

router.get('/edit/:reviewId', isAuthenticated, reviewController.getEditForm);
router.post('/edit/:reviewId', isAuthenticated, reviewController.updateReview);

// Sales team routes
router.get('/dashboard', isAuthenticated, isSalesTeam, reviewController.getAllReviews);
router.post('/:reviewId/respond', isAuthenticated, isSalesTeam, reviewController.respondToReview);

// Shared routes
router.get('/view/:reviewId', isAuthenticated, reviewController.getReview);

module.exports = router;