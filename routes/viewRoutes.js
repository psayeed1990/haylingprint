const express = require('express');
const router = express.Router();
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

router.get('/account', (req, res) => {
  res.render('user/account');
});

module.exports = router;
