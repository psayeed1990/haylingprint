const express = require('express');
const router = express.Router();
const Category = require('./../models/categoryModel');
const Product = require('./../models/productModel');
const Home = require('./../models/homePageModel');
const authController = require('./../controllers/authController');
const adminController = require('./../controllers/adminController');
const factory = require('./../controllers/handlers/factory');

const categoriesFunction = async (req, res, next) => {
  categories = await Category.find();
  next();
};
router.use(categoriesFunction);
router.get('/', async (req, res) => {
  const homeLinks = await Home.find();

  res.render('home', { homeLinks, categories });
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

router.get('/account', authController.protect, (req, res) => {
  res.render('user/account');
});

//product
router.get('/products/:id', async (req, res) => {
  const id = req.params.id;
  const product = await Product.findById(id);
  res.render('singleProduct', { product });
});
//product
router.get('/categories/:id', async (req, res) => {
  const id = req.params.id;
  const category = await Category.findById(id);
  res.render('singleCategory', { category });
});

//admin only
//for admin only
router.use(authController.protect, authController.restrictTo('admin'));

router.get('/admin/add-product', async (req, res) => {
  //const categories = await Category.find();
  res.render('addProduct');
});

router.get('/admin/add-category', async (req, res) => {
  //const categories = await Category.find();
  res.render('addCategory');
});

//dashboard
router.get('/admin', async (req, res) => {
  res.render('admin/dashboard');
});

router.get('/admin/home', async (req, res) => {
  const homes = await Home.find();
  const url = `${req.protocol}://${req.get('host')}`;
  res.render('admin/adminHome', { homes, url });
});

router.post('/admin/home', async (req, res) => {
  const url = `${req.protocol}://${req.get('host')}/products/`;
  const getlink = req.body.link;
  const link = getlink.toString().replace(url, '');

  const product = await Product.findById({ _id: link });

  if (product) {
    //write error message here
    const homes = await Home.find();
    const url = `${req.protocol}://${req.get('host')}`;
    return res.render('admin/adminHome', { homes, url });
  }

  const newLink = await Home.create({ link });

  res.redirect('/admin/home');
});

router.get('/admin/home/:id', async (req, res) => {
  const home = await Home.findById(req.params.id);
  res.render('admin/singleHomeLink', { home });
});

router.post('/admin/home/update/:id', async (req, res) => {
  const id = req.params.id;
  console.log(req.body);
  const doc = await Home.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  res.redirect('/admin/home');
});

router.post('/admin/home/delete/:id', async (req, res) => {
  const id = req.params.id;
  const doc = await Home.findByIdAndDelete(id);

  res.redirect('/admin/home');
});

module.exports = router;
