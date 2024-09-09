const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  bookingID: { type: Number, required: true }, // Bookings are IDs from 40001 onwards
  rideID: { type: Number}, // Rides are IDs from 30001 onwards
  passengerID: { type: Number}, // Should match with a userID (20001 onwards)
  bookingDate: { type: Date, required: true },
  responseStatus: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  rideStatus: { type: String, enum: ['pending','ongoing', 'completed', 'cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' } 
});

const Booking = mongoose.model('bookings', BookingSchema);
module.exports = Booking;