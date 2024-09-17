const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userID: { type: Number, required: true }, // User IDs start at 20001 onwards
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('users', UserSchema);
module.exports = User;