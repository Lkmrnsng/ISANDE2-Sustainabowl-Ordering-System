const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    reviewID: { // 50001 onwards format
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
            max: 5,
            validate: {
                validator: Number.isInteger,
                message: '{VALUE} is not an integer rating'
            }
        },
        customerService: { 
            type: Number,
            min: 1, 
            max: 5,
            validate: {
                validator: function(v) {
                    return v === undefined || Number.isInteger(v);
                },
                message: '{VALUE} is not an integer rating'
            }
        },
        delivery: { 
            type: Number,
            min: 1, 
            max: 5,
            validate: {
                validator: function(v) {
                    return v === undefined || Number.isInteger(v);
                },
                message: '{VALUE} is not an integer rating'
            }
        },
        freshness: { 
            type: Number,
            min: 1, 
            max: 5,
            validate: {
                validator: function(v) {
                    return v === undefined || Number.isInteger(v);
                },
                message: '{VALUE} is not an integer rating'
            }
        },
        quality: { 
            type: Number,
            min: 1, 
            max: 5,
            validate: {
                validator: function(v) {
                    return v === undefined || Number.isInteger(v);
                },
                message: '{VALUE} is not an integer rating'
            }
        },
        price: { 
            type: Number,
            min: 1, 
            max: 5,
            validate: {
                validator: function(v) {
                    return v === undefined || Number.isInteger(v);
                },
                message: '{VALUE} is not an integer rating'
            }
        },
        packaging: { 
            type: Number,
            min: 1, 
            max: 5,
            validate: {
                validator: function(v) {
                    return v === undefined || Number.isInteger(v);
                },
                message: '{VALUE} is not an integer rating'
            }
        },
        convenience: { 
            type: Number,
            min: 1, 
            max: 5,
            validate: {
                validator: function(v) {
                    return v === undefined || Number.isInteger(v);
                },
                message: '{VALUE} is not an integer rating'
            }
        },
        customization: { 
            type: Number,
            min: 1, 
            max: 5,
            validate: {
                validator: function(v) {
                    return v === undefined || Number.isInteger(v);
                },
                message: '{VALUE} is not an integer rating'
            }
        }
    },
    comment: { 
        type: String,
        maxLength: [1000, 'Comment cannot exceed 1000 characters'],
        trim: true
    },
    date: { 
        type: Date,
        default: Date.now,
        required: true
    },
    status: {
        type: String,
        enum: {
            values: ['pending', 'approved', 'rejected'],
            message: '{VALUE} is not a valid status'
        },
        default: 'pending'
    },
    response: {
        type: Object,
        default: null
    },
    tags: [{
        type: String,
        enum: {
            values: [
                'High Ratings', 
                'Low Ratings', 
                'Customer Service', 
                'Delivery', 
                'Freshness', 
                'Quality', 
                'Price', 
                'Packaging', 
                'Convenience', 
                'Customization'
            ],
            message: '{VALUE} is not a valid tag'
        }
    }],
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Add timestamps for tracking document changes
ReviewSchema.set('timestamps', true);

// Index for faster queries
ReviewSchema.index({ reviewID: 1 }, { unique: true });
ReviewSchema.index({ orderID: 1 });
ReviewSchema.index({ reviewerID: 1 });
ReviewSchema.index({ 'ratings.overall': 1 });
ReviewSchema.index({ date: -1 });
ReviewSchema.index({ tags: 1 });

// Pre-save middleware for tag generation
ReviewSchema.pre('save', function(next) {
    // Reset tags array
    this.tags = [];
    
    // Add rating-based tags
    if (this.ratings.overall >= 4) {
        this.tags.push('High Ratings');
    } else if (this.ratings.overall <= 2) {
        this.tags.push('Low Ratings');
    }
  
    const tagMap = {
        customerService: 'Customer Service',
        delivery: 'Delivery',
        freshness: 'Freshness',
        quality: 'Quality',
        price: 'Price',
        packaging: 'Packaging',
        convenience: 'Convenience',
        customization: 'Customization'
    };

    Object.entries(this.ratings).forEach(([category, rating]) => {
        if (category !== 'overall' && rating) {  // If the category has any valid rating
            const tagName = tagMap[category];
            if (tagName && !this.tags.includes(tagName)) {
                this.tags.push(tagName);
            }
        }
    });

    this.updatedAt = new Date();
    next();
});

// Static method to calculate average ratings with error handling
ReviewSchema.statics.getAverageRatings = async function() {
    try {
        const aggregation = await this.aggregate([
            {
                $group: {
                    _id: null,
                    averageOverall: { 
                        $avg: { 
                            $cond: [
                                { $and: [
                                    { $gte: ["$ratings.overall", 1] },
                                    { $lte: ["$ratings.overall", 5] }
                                ]},
                                "$ratings.overall",
                                null
                            ]
                        }
                    },
                    averageCustomerService: { 
                        $avg: { 
                            $cond: [
                                { $and: [
                                    { $gte: ["$ratings.customerService", 1] },
                                    { $lte: ["$ratings.customerService", 5] }
                                ]},
                                "$ratings.customerService",
                                null
                            ]
                        }
                    },
                    averageDelivery: { 
                        $avg: { 
                            $cond: [
                                { $and: [
                                    { $gte: ["$ratings.delivery", 1] },
                                    { $lte: ["$ratings.delivery", 5] }
                                ]},
                                "$ratings.delivery",
                                null
                            ]
                        }
                    },
                    averageFreshness: { 
                        $avg: { 
                            $cond: [
                                { $and: [
                                    { $gte: ["$ratings.freshness", 1] },
                                    { $lte: ["$ratings.freshness", 5] }
                                ]},
                                "$ratings.freshness",
                                null
                            ]
                        }
                    },
                    averageQuality: { 
                        $avg: { 
                            $cond: [
                                { $and: [
                                    { $gte: ["$ratings.quality", 1] },
                                    { $lte: ["$ratings.quality", 5] }
                                ]},
                                "$ratings.quality",
                                null
                            ]
                        }
                    },
                    averagePrice: { 
                        $avg: { 
                            $cond: [
                                { $and: [
                                    { $gte: ["$ratings.price", 1] },
                                    { $lte: ["$ratings.price", 5] }
                                ]},
                                "$ratings.price",
                                null
                            ]
                        }
                    },
                    averagePackaging: { 
                        $avg: { 
                            $cond: [
                                { $and: [
                                    { $gte: ["$ratings.packaging", 1] },
                                    { $lte: ["$ratings.packaging", 5] }
                                ]},
                                "$ratings.packaging",
                                null
                            ]
                        }
                    },
                    averageConvenience: { 
                        $avg: { 
                            $cond: [
                                { $and: [
                                    { $gte: ["$ratings.convenience", 1] },
                                    { $lte: ["$ratings.convenience", 5] }
                                ]},
                                "$ratings.convenience",
                                null
                            ]
                        }
                    },
                    averageCustomization: { 
                        $avg: { 
                            $cond: [
                                { $and: [
                                    { $gte: ["$ratings.customization", 1] },
                                    { $lte: ["$ratings.customization", 5] }
                                ]},
                                "$ratings.customization",
                                null
                            ]
                        }
                    },
                    totalReviews: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    averageOverall: { $round: ["$averageOverall", 1] },
                    averageCustomerService: { $round: ["$averageCustomerService", 1] },
                    averageDelivery: { $round: ["$averageDelivery", 1] },
                    averageFreshness: { $round: ["$averageFreshness", 1] },
                    averageQuality: { $round: ["$averageQuality", 1] },
                    averagePrice: { $round: ["$averagePrice", 1] },
                    averagePackaging: { $round: ["$averagePackaging", 1] },
                    averageConvenience: { $round: ["$averageConvenience", 1] },
                    averageCustomization: { $round: ["$averageCustomization", 1] },
                    totalReviews: 1
                }
            }
        ]);

        if (aggregation.length === 0) {
            return {
                averageOverall: 0,
                totalReviews: 0,
                averageCustomerService: 0,
                averageDelivery: 0,
                averageFreshness: 0,
                averageQuality: 0,
                averagePrice: 0,
                averagePackaging: 0,
                averageConvenience: 0,
                averageCustomization: 0
            };
        }

        return aggregation[0];
    } catch (error) {
        console.error('Error calculating average ratings:', error);
        throw error;
    }
};

// Add method to check if review can be edited
ReviewSchema.methods.canBeEdited = function() {
    const daysSinceCreation = (Date.now() - this.date.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation <= 30; // Allow editing within 30 days
};

const Review = mongoose.model('reviews', ReviewSchema);
module.exports = Review;