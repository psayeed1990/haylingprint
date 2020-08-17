const mongoose = require('mongoose');
const slugify = require('slugify');
const Schema = mongoose.Schema;

const categorySchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Product name is required'],
      minlength: [2, 'Product name must be at least 2 characters long'],
      maxlength: [102, 'Product name must be maximum 102 characters long'],
    },
    slug: {
      type: String,
    },

    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    parentCategory: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
    },
    childCategory: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Category',
      },
    ],
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate
categorySchema.virtual('products', {
  ref: 'Product',
  foreignField: 'category',
  localField: '_id',
});

//slugify
categorySchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

categorySchema.pre(/^find/, function (next) {
  this.populate({
    path: 'childCategory',
    select: '-__v',
  });

  next();
});

categorySchema.pre(/^find/, function (next) {
  this.populate({
    path: 'parentCategory',
    select: '-__v',
  });

  next();
});

module.exports = Category = mongoose.model('Category', categorySchema);
