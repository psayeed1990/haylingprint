const Product = require('./../models/productModel');
const Home = require('./../models/homePageModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlers/factory');
const AppError = require('./../utils/appError');

exports.getAlllinks = factory.getAll(Home);
exports.getLink = factory.getOne(Home);
exports.createLink = factory.createOne(Home);
exports.updateLink = factory.updateOne(Home);
exports.deleteLink = factory.deleteOne(Home);
