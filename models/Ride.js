// models/Ride.js
const mongoose = require('mongoose');

const RideSchema = new mongoose.Schema({
  rideID: { 
    type: Number, 
    required: true,
    unique: true
  },
  driverID: { 
    type: Number, 
    required: true
  },
  rideType: {
    type: String,
    enum: ['toUniversity', 'fromUniversity'],
    required: true
  },
  pickupPoint: {
    type: String,
    required: true
  },
  dropoffPoint: {
    type: String,
    required: true
  },
  route: {
    type: String
  },
  pickupAreas: [{
    type: String
  }],
  availableDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  departureTime: {
    hour: { type: Number, required: true, min: 0, max: 23 },
    minute: { type: Number, required: true, min: 0, max: 59 }
  },

  arrivalTime: {
    hour: { type: Number, required: true, min: 0, max: 23 },
    minute: { type: Number, required: true, min: 0, max: 59 }
  },
  numSeats: { 
    type: Number, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true,
    min: 50,
    max: 1000
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

const Ride = mongoose.model('rides', RideSchema);
module.exports = Ride;