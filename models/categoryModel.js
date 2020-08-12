const mongoose = require('mongoose');
const { default: slugify } = require('slugify');
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
    slug: String,

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

// Virtual populate
categorySchema.virtual('products', {
  ref: 'Product',
  foreignField: 'category',
  localField: '_id',
});

//slugify
categorySchema.pre('save', (next) => {
  this.slug = slugify(this.name, { lower: true });
  return next();
});

module.exports = Category = mongoose.model('Category', categorySchema);
