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

  SKU: String,
  laminatingPrice: String,
  quantity: {
    type: Number,
    required: true,
  },
  variantName: String,
  variantValue: String,
  price: Number,
  imageCover: {
    type: String,
  },
  ordered: {
    type: Boolean,
    default: false,
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
