const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },

    products: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
    },

    count: [
      {
        id: String,
        quantity: Number,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

cartSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: '-__v',
  });

  next();
});

cartSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'products',
    select: '-__v',
  });

  next();
});

module.exports = Cart = mongoose.model('Cart', cartSchema);
