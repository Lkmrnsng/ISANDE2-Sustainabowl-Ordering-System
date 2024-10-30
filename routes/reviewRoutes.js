const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const Review = require('../models/Review');

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    // if (!req.session.userId) {
    //     if (req.xhr || req.headers.accept?.includes('json')) {
    //         return res.status(401).json({ error: 'Authentication required' });
    //     }
    //     return res.redirect('/login');
    // }
    // next();

    //No LOGIN YET
    next();
};

// Sales team authorization middleware
const isSalesTeam = (req, res, next) => {
    if (req.session.userType !== 'Sales') {
        if (req.xhr || req.headers.accept?.includes('json')) {
            return res.status(403).json({ error: 'Access denied' });
        }
        return res.status(403).render('error', {
            message: 'Access denied',
            layout: 'main'
        });
    }
    next();
};

// Review ownership middleware
const isReviewOwner = async (req, res, next) => {
    try {
        const reviewId = parseInt(req.params.reviewId);
        const userId = req.session.userId;
        
        const review = await Review.findOne({ 
            reviewID: reviewId 
        });

        if (!review) {
            if (req.xhr || req.headers.accept?.includes('json')) {
                return res.status(404).json({ error: 'Review not found' });
            }
            return res.status(404).render('error', {
                message: 'Review not found',
                layout: 'main'
            });
        }

        if (review.reviewerID !== userId) {
            if (req.xhr || req.headers.accept?.includes('json')) {
                return res.status(403).json({ error: 'Unauthorized access' });
            }
            return res.status(403).render('error', {
                message: 'You do not have permission to modify this review',
                layout: 'main'
            });
        }

        req.review = review;
        next();
    } catch (error) {
        next(error);
    }
};

// Error handling middleware
const handleErrors = (err, req, res, next) => {
    console.error('Review route error:', err);
    
    if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(500).json({ 
            error: 'An unexpected error occurred',
            message: err.message 
        });
    }
    
    res.status(500).render('error', {
        message: 'An unexpected error occurred',
        error: err,
        layout: 'main'
    });
};

// Customer Routes
router.get('/form/:orderId', 
    isAuthenticated, 
    reviewController.getReviewForm
);

router.post('/submit', 
    isAuthenticated, 
    reviewController.submitReview
);

router.get('/my-reviews', 
    isAuthenticated, 
    reviewController.getCustomerReviews
);

router.get('/edit/:reviewId', 
    isAuthenticated, 
    isReviewOwner, 
    reviewController.getEditForm
);

router.post('/edit/:reviewId', 
    isAuthenticated, 
    isReviewOwner, 
    reviewController.updateReview
);

router.delete('/delete/:reviewId', 
    isAuthenticated, 
    isReviewOwner, 
    reviewController.deleteReview
);

// Sales Team Routes
router.get('/dashboard', 
    isAuthenticated, 
    isSalesTeam, 
    reviewController.getAllReviews
);

router.post('/:reviewId/respond', 
    isAuthenticated, 
    isSalesTeam, 
    reviewController.respondToReview
);

// Shared Routes
router.get('/view/:reviewId', 
    isAuthenticated,
    async (req, res, next) => {
        try {
            const reviewId = parseInt(req.params.reviewId);
            const userId = req.session.userId;
            const userType = req.session.userType;
            
            const review = await Review.findOne({ reviewID: reviewId });
            
            if (!review) {
                if (req.xhr || req.headers.accept?.includes('json')) {
                    return res.status(404).json({ error: 'Review not found' });
                }
                return res.status(404).render('error', {
                    message: 'Review not found',
                    layout: 'main'
                });
            }

            // Allow access if user is sales team or the review owner
            if (userType !== 'Sales' && review.reviewerID !== userId) {
                if (req.xhr || req.headers.accept?.includes('json')) {
                    return res.status(403).json({ error: 'Unauthorized access' });
                }
                return res.status(403).render('error', {
                    message: 'You do not have permission to view this review',
                    layout: 'main'
                });
            }

            next();
        } catch (error) {
            next(error);
        }
    },
    reviewController.getReview
);

// Statistics endpoint (protected, available to both customers and sales)
router.get('/statistics', 
    isAuthenticated, 
    reviewController.getReviewStats
);

// Apply error handling middleware
router.use(handleErrors);

module.exports = router;