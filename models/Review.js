const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    reviewID: { 
        type: Number,
        required: true,
        unique: true 
    },
    reviewerID: { 
        type: Number,
        required: true,
        ref: 'User' 
    },
    orderID: { 
        type: Number,
        required: true,
        ref: 'Order'
    },
    requestID: {
        type: Number,
        required: true,
        ref: 'Request'
    },
    ratings: {
        overall: { 
            type: Number, 
            required: true,
            min: 1, 
            max: 5 
        },
        customerService: { 
            type: Number,
            min: 1, 
            max: 5 
        },
        delivery: { 
            type: Number,
            min: 1, 
            max: 5 
        },
        freshness: { 
            type: Number,
            min: 1, 
            max: 5 
        },
        quality: { 
            type: Number,
            min: 1, 
            max: 5 
        },
        price: { 
            type: Number,
            min: 1, 
            max: 5 
        },
        packaging: { 
            type: Number,
            min: 1, 
            max: 5 
        },
        convenience: { 
            type: Number,
            min: 1, 
            max: 5 
        },
        customization: { 
            type: Number,
            min: 1, 
            max: 5 
        }
    },
    comment: { 
        type: String,
        maxLength: 1000 
    },
    date: { 
        type: Date,
        default: Date.now 
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    response: {
        text: String,
        respondedBy: Number,
        responseDate: Date
    },
    tags: [{
        type: String,
        enum: ['High Ratings', 'Low Ratings', 'Customer Service', 'Delivery', 
               'Freshness', 'Quality', 'Price', 'Packaging', 'Convenience', 
               'Customization']
    }]
});

// Middleware to auto-generate tags based on ratings
ReviewSchema.pre('save', function(next) {
    this.tags = [];
    
    // Add rating-based tags
    if (this.ratings.overall >= 4) {
        this.tags.push('High Ratings');
    } else if (this.ratings.overall <= 2) {
        this.tags.push('Low Ratings');
    }
    
    // Add category tags for notably good or bad ratings
    Object.entries(this.ratings).forEach(([category, rating]) => {
        if (category !== 'overall' && rating) {
            if (rating >= 4) {
                this.tags.push(category.charAt(0).toUpperCase() + category.slice(1));
            }
        }
    });
    
    next();
});

// Static method to calculate average ratings
ReviewSchema.statics.getAverageRatings = async function() {
    const aggregation = await this.aggregate([
        {
            $group: {
                _id: null,
                averageOverall: { $avg: '$ratings.overall' },
                averageCustomerService: { $avg: '$ratings.customerService' },
                averageDelivery: { $avg: '$ratings.delivery' },
                averageFreshness: { $avg: '$ratings.freshness' },
                averageQuality: { $avg: '$ratings.quality' },
                averagePrice: { $avg: '$ratings.price' },
                averagePackaging: { $avg: '$ratings.packaging' },
                averageConvenience: { $avg: '$ratings.convenience' },
                averageCustomization: { $avg: '$ratings.customization' },
                totalReviews: { $sum: 1 }
            }
        }
    ]);
    
    return aggregation[0] || null;
};

const Review = mongoose.model('reviews', ReviewSchema);
module.exports = Review;