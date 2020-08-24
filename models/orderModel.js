const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  carts: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Cart',
      required: [true, 'Cart ID is required'],
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: { type: Boolean, default: false },
  amount: Number,
  address: {
    type: String,
  },
  completed: Boolean,
});

// populate
orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'carts',
    select: '-__v',
    populate: {
      path: 'product',
      select: '-__v',
    },
  });

  next();
});

orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: '-__v',
  });

  next();
});
module.exports = Order = mongoose.model('Order', orderSchema);
