const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    products: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required'],
      },
    ],
    SKUs: [],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    paid: { type: Boolean, default: false },
    amount: Number,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// populate
orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'products',
    select: '-__v',
  });

  next();
});
module.exports = Order = mongoose.model('Order', orderSchema);
