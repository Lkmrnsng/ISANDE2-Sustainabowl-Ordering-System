const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  reviewerID: { type: Number},
  rating: { type: Number, min: 1, max: 5 },
  comment: { type: String },
  date: { type: Date, default: Date.now }
});

const Review = mongoose.model('reviews', ReviewSchema);
module.exports = Review;