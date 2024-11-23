const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    itemID: { type: Number }, //20001 onwards format
    itemName: { type: String },
    itemCategory: { type: String },
    itemDescription: { type: String },
    itemPrice: { type: Number },
    itemStock: { type: Number },
    itemImage: { type: String }
});

const Item = mongoose.model('items', ItemSchema);
module.exports = Item;