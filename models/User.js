const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userID: { type: Number, required: true }, // User IDs start at 20001 onwards
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String }, // Philippine number
  universityID: { type: Number, required: true }, // All users have 10001 University ID
  profilePicture: { type: String, default: "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png" }, //Use the default pfp
  enrollmentProof: { type: String }, //This is to determine if the user is a student.
  isVerifiedPassenger: { type: Boolean, default: false }, //This is to determine if the user is a verified passenger.
  isVerifiedDriver: { type: Boolean, default: false }, //This is to determine if the user is a verified driver.
  balance: {type: Number, default: 0 }, 
  driverLicense: { type: String },
  carMake: { type: String },
  carModel: { type: String },
  carPlate: { type: String }
});

const User = mongoose.model('users', UserSchema);
module.exports = User;