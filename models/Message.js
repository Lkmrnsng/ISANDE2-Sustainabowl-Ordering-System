const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  senderID: { type: Number}, // Should match a userID (20001 onwards)
  receiverID: { type: Number}, // Should also match a userID 
  message: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const Message = mongoose.model('messages', MessageSchema);
module.exports = Message;