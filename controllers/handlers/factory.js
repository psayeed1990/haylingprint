const catchAsync = require('./../../utils/catchAsync');
const AppError = require('./../../utils/appError');
const APIFeatures = require('./../../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    if (Model == Product) {
      return res.redirect('/admin/products');
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    if (Model == Product) {
      req.body.variants = {
        name: req.body.variantsName,
        value: req.body.variantsValue,
        SKU: req.body.SKU,
        price: req.body.price,
      };
    }
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    console.log(Model == Product);
    if (Model == Product) {
      return res.render('admin/singleProduct', {
        layout: 'layoutAdmin',
        product: doc,
      });
    }
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    if (Model == Product) {
      req.body.variants = {
        name: req.body.variantsName,
        value: req.body.variantsValue,
        SKU: req.body.SKU,
        price: req.body.price,
        stock: req.body.stock,
      };
    }

    const doc = await Model.create(req.body);

    if (Model === Product) {
      return res.render('admin/products', {
        message: 'New product created',
        layout: 'layoutAdmin',
      });
    }
    if (Model === Category) {
      return res.render('admin/categories', {
        message: 'New category created',
        layout: 'layoutAdmin',
      });
    }
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on product (hack)
    let filter = {};
    if (req.params.productId) filter = { tour: req.params.productId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // const doc = await features.query.explain();
    const doc = await features.query;

    // SEND RESPONSE
    next();
  });
