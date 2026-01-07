const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: String,
  imageUrl: String,
  isAvailable: Boolean
});

module.exports = mongoose.model('Menu', menuSchema);