const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userID: { type: Number, required: true }, // User IDs start at 10001 onwards
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  usertype: { type: String, required: true }, // Customer or Sales or Logistics
  restaurantName: { type: String },
});

const User = mongoose.model('users', UserSchema);
module.exports = User;