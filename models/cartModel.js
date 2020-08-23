const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartSchema = new Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },

  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true,
  },

  quantity: {
    type: Number,
    required: true,
  },
  imageCover: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
});

cartSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: '-__v',
  });

  next();
});

cartSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'product',
    select: '-__v',
  });

  next();
});

module.exports = Cart = mongoose.model('Cart', cartSchema);
