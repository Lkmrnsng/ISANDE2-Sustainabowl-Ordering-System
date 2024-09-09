// luke
/* Import express & define router */
const express = require('express');
const router = express.Router();
module.exports = router; // Export router so it can be used in app.js

/* Import Controllers */
const reviewController = require('../controllers/reviewController.js');

/* Define Routes */
router.post('/reviews', reviewController.leaveReview);
router.get('/reviews/:userId', reviewController.viewReviews);