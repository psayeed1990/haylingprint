const mongoose = require('mongoose');
const { default: slugify } = require('slugify');
const Schema = mongoose.Schema;

const productSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Product name is required'],
      minlength: [2, 'Product name must be at least 2 characters long'],
      maxlength: [102, 'Product name must be maximum 102 characters long'],
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    originalPrice: {
      type: Number,
      trim: true,
      maxlength: 6,
      minlength: 1,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      trim: true,
      maxlength: 6,
      minlength: 1,
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A product must have a description'],
    },
    summary: {
      type: String,
      trim: true,
    },
    slug: String,
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, // 4.666666, 46.6666, 47, 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    imageCover: {
      type: String,
      required: [true, 'A product must have a cover image'],
    },
    images: [String],
    soldTimes: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      default: 0,
    },

    variants: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
      },
    ],

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

// tourSchema.index({ price: 1 });
productSchema.index({ price: 1, ratingsAverage: -1 });
productSchema.index({ slug: 1 });
productSchema.index({ startLocation: '2dsphere' });

// Virtual populate
productSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'product',
  localField: '_id',
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
productSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// QUERY MIDDLEWARE
// productSchema.pre('find', function(next) {
productSchema.pre(/^find/, function (next) {
  this.find({ stock: { $ne: 0 } });

  this.start = Date.now();
  next();
});

productSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'category',
    select: '-__v',
  });

  next();
});

module.exports = Product = mongoose.model('Product', productSchema);
