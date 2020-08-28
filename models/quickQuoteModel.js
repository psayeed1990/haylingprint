const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const quickQuoteSchema = new Schema({
  name: String,
  email: String,
  phone: Number,
  address: String,
  description: String,
});

module.exports = Order = mongoose.model('Quote', quickQuoteSchema);
