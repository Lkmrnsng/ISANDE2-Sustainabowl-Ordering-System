const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');

const reviewController = {
    // Get review form for a specific order
    async getReviewForm(req, res) {
        try {
            const orderId = req.params.orderId;
            const order = await Order.findOne({ OrderID: orderId });
            
            if (!order) {
                return res.status(404).render('error', {
                    message: 'Order not found',
                    layout: 'main'
                });
            }

            // Check if review already exists
            const existingReview = await Review.findOne({ 
                orderID: orderId,
                reviewerID: req.session.userId 
            });

            if (existingReview) {
                return res.redirect(`/review/view/${existingReview.reviewID}`);
            }

            res.render('review/review-form', {
                title: 'Leave a Review',
                css: ['review.css'],
                layout: 'main',
                order: order,
                js: ['review.js']
            });
        } catch (error) {
            console.error('Error in getReviewForm:', error);
            res.status(500).send('An error occurred while loading the review form');
        }
    },

    // Submit a new review
    async submitReview(req, res) {
        try {
            const {
                orderId,
                overallRating,
                customerServiceRating,
                deliveryRating,
                freshnessRating,
                qualityRating,
                priceRating,
                packagingRating,
                convenienceRating,
                customizationRating,
                comment
            } = req.body;

            // Get the order to reference its requestID
            const order = await Order.findOne({ OrderID: orderId });
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            // Generate next review ID (you might want to implement a more robust ID generation system)
            const lastReview = await Review.findOne().sort({ reviewID: -1 });
            const nextReviewId = lastReview ? lastReview.reviewID + 1 : 50001;

            // Create review object with only the provided ratings
            const ratings = {
                overall: parseFloat(overallRating) // Required
            };

            // Only add optional ratings if they were provided
            if (customerServiceRating) ratings.customerService = parseFloat(customerServiceRating);
            if (deliveryRating) ratings.delivery = parseFloat(deliveryRating);
            if (freshnessRating) ratings.freshness = parseFloat(freshnessRating);
            if (qualityRating) ratings.quality = parseFloat(qualityRating);
            if (priceRating) ratings.price = parseFloat(priceRating);
            if (packagingRating) ratings.packaging = parseFloat(packagingRating);
            if (convenienceRating) ratings.convenience = parseFloat(convenienceRating);
            if (customizationRating) ratings.customization = parseFloat(customizationRating);

            const review = new Review({
                reviewID: nextReviewId,
                reviewerID: req.session.userId,
                orderID: orderId,
                requestID: order.requestID,
                ratings: ratings,
                comment: comment,
                date: new Date(),
                status: 'pending'
            });

            await review.save();

            res.redirect(`/review/view/${review.reviewID}`);
        } catch (error) {
            console.error('Error in submitReview:', error);
            res.status(500).json({ error: 'Failed to submit review' });
        }
    },

    // Get all reviews (with filtering options) - for sales view
// In reviewController.js, update the getAllReviews function
async getAllReviews(req, res) {
    try {
        const filters = {};
        const { category, rating, startDate, endDate } = req.query;

       // Category filter
       if (category) {
        if (category === 'High Ratings') {
            filters['ratings.overall'] = { $gte: 4 };
        } else if (category === 'Low Ratings') {
            filters['ratings.overall'] = { $lte: 2 };
        } else {
            // Map the category filter to the rating field
            const categoryToField = {
                'Customer Service': 'customerService',
                'Delivery': 'delivery',
                'Freshness': 'freshness',
                'Quality': 'quality',
                'Price': 'price',
                'Packaging': 'packaging',
                'Convenience': 'convenience',
                'Customization': 'customization'
            };
            
            const ratingField = `ratings.${categoryToField[category]}`;
            filters[ratingField] = { $exists: true, $gte: 4 };
        }
    }
        
        // Rating filter
        if (rating) {
            filters['ratings.overall'] = { $gte: parseFloat(rating) };
        }

        // Date range filter
        if (startDate && endDate) {
            filters.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        console.log('Applied filters:', filters); // For debugging

        const reviews = await Review.find(filters)
            .sort({ date: -1 })
            .lean();

        console.log('Found reviews:', reviews.length); // For debugging

        // Get average ratings
        const averageRatings = await Review.getAverageRatings();

        res.render('review/review-dashboard', {
            title: 'Review Dashboard',
            css: ['review.css'],
            layout: 'main',
            reviews: reviews,
            averageRatings: averageRatings,
            activeFilters: {
                category,
                rating,
                startDate,
                endDate
            }
        });
    } catch (error) {
        console.error('Error in getAllReviews:', error);
        res.status(500).send('An error occurred while loading reviews');
    }
},

    // View a single review
    async getReview(req, res) {
        try {
            const review = await Review.findOne({ reviewID: req.params.reviewId }).lean();
            
            if (!review) {
                return res.status(404).render('error', {
                    message: 'Review not found',
                    layout: 'main'
                });
            }

            // Get reviewer and order details
            const [reviewer, order] = await Promise.all([
                User.findOne({ userID: review.reviewerID }).lean(),
                Order.findOne({ OrderID: review.orderID }).lean()
            ]);

            res.render('review/review-detail', {
                title: 'Review Details',
                css: ['review.css'],
                layout: 'main',
                review: review,
                reviewer: reviewer,
                order: order,
                js: ['review.js']
            });
        } catch (error) {
            console.error('Error in getReview:', error);
            res.status(500).send('An error occurred while loading the review');
        }
    },

    // Respond to a review (sales team only)
    async respondToReview(req, res) {
        try {
            const { reviewId } = req.params;
            const { response } = req.body;

            const review = await Review.findOne({ reviewID: reviewId });
            
            if (!review) {
                return res.status(404).json({ error: 'Review not found' });
            }

            review.response = {
                text: response,
                respondedBy: req.session.userId,
                responseDate: new Date()
            };

            await review.save();

            res.json({ success: true });
        } catch (error) {
            console.error('Error in respondToReview:', error);
            res.status(500).json({ error: 'Failed to respond to review' });
        }
    },

    // Get customer's reviews
    async getCustomerReviews(req, res) {
        try {
            const customerId = req.session.userId;
            const reviews = await Review.find({ reviewerID: customerId })
                .sort({ date: -1 })
                .lean();

            res.render('review/customer-reviews', {
                title: 'My Reviews',
                css: ['review.css'],
                layout: 'main',
                reviews: reviews,
                js: ['review.js']
            });
        } catch (error) {
            console.error('Error in getCustomerReviews:', error);
            res.status(500).send('An error occurred while loading your reviews');
        }
    },

        // Get edit form
        async getEditForm(req, res) {
            try {
                const review = await Review.findOne({ 
                    reviewID: req.params.reviewId,
                    reviewerID: req.session.userId // Ensure user owns this review
                });
    
                if (!review) {
                    return res.status(404).render('error', {
                        message: 'Review not found or unauthorized',
                        layout: 'main'
                    });
                }
    
                // Get order details for context
                const order = await Order.findOne({ OrderID: review.orderID });
    
                // Render the same form but with existing data
                res.render('review/review-form', {
                    title: 'Edit Review',
                    css: ['review.css'],
                    layout: 'main',
                    order: order,
                    review: review, // Pass existing review data
                    isEditing: true // Flag to indicate edit mode
                });
    
            } catch (error) {
                console.error('Error in getEditForm:', error);
                res.status(500).send('An error occurred while loading the edit form');
            }
        },
    
        // Update existing review
        async updateReview(req, res) {
            try {
                const review = await Review.findOne({ 
                    reviewID: req.params.reviewId,
                    reviewerID: req.session.userId
                });
    
                if (!review) {
                    return res.status(404).json({ error: 'Review not found or unauthorized' });
                }
    
                const {
                    overallRating,
                    customerServiceRating,
                    deliveryRating,
                    freshnessRating,
                    qualityRating,
                    priceRating,
                    packagingRating,
                    convenienceRating,
                    customizationRating,
                    comment
                } = req.body;
    
                // Update ratings object
                const ratings = {
                    overall: parseFloat(overallRating) // Required
                };
    
                // Only update optional ratings if provided
                if (customerServiceRating) ratings.customerService = parseFloat(customerServiceRating);
                if (deliveryRating) ratings.delivery = parseFloat(deliveryRating);
                if (freshnessRating) ratings.freshness = parseFloat(freshnessRating);
                if (qualityRating) ratings.quality = parseFloat(qualityRating);
                if (priceRating) ratings.price = parseFloat(priceRating);
                if (packagingRating) ratings.packaging = parseFloat(packagingRating);
                if (convenienceRating) ratings.convenience = parseFloat(convenienceRating);
                if (customizationRating) ratings.customization = parseFloat(customizationRating);
    
                // Update the review
                review.ratings = ratings;
                review.comment = comment;
                review.status = 'pending'; // Optionally reset status for re-approval
                
                await review.save();
    
                // Redirect to the review detail page
                res.redirect(`/reviews/view/${review.reviewID}`);
    
            } catch (error) {
                console.error('Error in updateReview:', error);
                res.status(500).json({ error: 'Failed to update review' });
            }
        },
    
        // Optional: Add a method to handle review deletion
        async deleteReview(req, res) {
            try {
                const review = await Review.findOne({ 
                    reviewID: req.params.reviewId,
                    reviewerID: req.session.userId
                });
    
                if (!review) {
                    return res.status(404).json({ error: 'Review not found or unauthorized' });
                }
    
                await review.remove();
                res.redirect('/reviews/my-reviews');
    
            } catch (error) {
                console.error('Error in deleteReview:', error);
                res.status(500).json({ error: 'Failed to delete review' });
            }
        }
};

module.exports = reviewController;