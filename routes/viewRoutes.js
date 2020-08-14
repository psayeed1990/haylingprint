const express = require('express');
const router = express.Router();
const Category = require('./../models/categoryModel');
const Product = require('./../models/productModel');
const authController = require('./../controllers/authController');

router.get('/', async (req, res) => {
  const products = await Product.find();
  res.render('home', { products });
});

router.get('/register', (req, res) => {
  res.render('auth/register');
});

router.get('/login', (req, res) => {
  res.render('auth/login');
});

router.get('/cart', (req, res) => {
  res.render('cart');
});
router.get('/about', (req, res) => {
  res.render('about');
});

router.get(
  '/account',
  authController.protect,
  authController.restrictTo('user'),
  (req, res) => {
    res.render('user/account');
  }
);
router.get('/add-product', async (req, res) => {
  const categories = await Category.find();
  res.render('addProduct', { categories });
});

router.get('/add-category', async (req, res) => {
  const categories = await Category.find();
  res.render('addCategory', { categories });
});

module.exports = router;
