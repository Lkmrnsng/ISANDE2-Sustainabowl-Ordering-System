const mongoose = require('mongoose');

const UniversitySchema = new mongoose.Schema({
  universityID: { type: Number, required: true }, // We only have university 10001
  name: { type: String, required: true }
});

const University = mongoose.model('universities', UniversitySchema);
module.exports = University;