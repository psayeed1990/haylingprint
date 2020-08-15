const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const homeSchema = new Schema(
  {
    link: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      unique: true,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// populate
homeSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'link',
    select: '-__v',
  });

  next();
});
module.exports = Home = mongoose.model('Home', homeSchema);
