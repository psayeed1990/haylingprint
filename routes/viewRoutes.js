const express = require('express');
const router = express.Router();

const authController = require('./../controllers/authController');

router.get('/', (req, res) => {
  res.render('home');
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

module.exports = router;
