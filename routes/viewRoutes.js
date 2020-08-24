const express = require('express');
const router = express.Router();
const localstorage = require('node-localstorage');
const Category = require('./../models/categoryModel');
const Product = require('./../models/productModel');
const Home = require('./../models/homePageModel');
const authController = require('./../controllers/authController');
const adminController = require('./../controllers/adminController');
const APIFeatures = require('./../utils/apiFeatures');
const productController = require('./../controllers/productController');
const userController = require('./../controllers/userController');
const Cart = require('./../models/cartModel');
const User = require('./../models/userModel');
const Order = require('./../models/orderModel');
const { route } = require('./userRoutes');
const { findByIdAndUpdate } = require('./../models/categoryModel');
const paypal = require('paypal-rest-sdk');

router.use(authController.isLoggedIn);

//starts paypal
paypal.configure({
  mode: 'sandbox', //sandbox or live
  client_id:
    'AUJoKVGO3q1WA1tGgAKRdY6qx0qQNIQ6vl6D3k7y64T4qh5WozIQ7V3dl3iusw5BwXYg_T5FzLCRguP8',
  client_secret:
    'EOw8LNwDhM7esrQ3nHfzKc7xiWnJc83Eawln4YLfUgivfx1LGzu9Mj0F5wlarilXDqdK9Q5aHVo-VGjJ',
});
//ends paypal

const categoriesFunction = async (req, res, next) => {
  categories = await Category.find();

  topCategories = await Category.find({ parentCategory: { $exists: false } });
  // topCategories.forEach(category, ()=> {
  //   if (!category.parentCategory) {

  //   }
  // })
  next();
};

router.use(categoriesFunction);
router.get('/', async (req, res) => {
  const homeLinks = await Home.find();

  // User.findOneAndUpdate(
  //   { email: 'sayeedmondal1412@gmail.com' },
  //   { role: 'admin', emailVerified: true }
  // );
  const products = await Product.find().sort({ date: -1 }).limit(8);
  res.render('home', { homeLinks, products });
});

router.get('/register', (req, res) => {
  res.render('auth/register');
});

router.get('/login', (req, res) => {
  res.render('auth/login');
});

router.get('/about', (req, res) => {
  res.render('about');
});

//product get all
router.get('/products/', async (req, res) => {
  let filter = {};
  if (req.params.productId) filter = { tour: req.params.productId };

  const features = new APIFeatures(Product.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  // const doc = await features.query.explain();
  const doc = await features.query;

  res.render('products', { doc });
});
router.get('/products/:id', async (req, res) => {
  const id = req.params.id;
  const product = await Product.findById(id);
  res.render('singleProduct', { product });
});
//product
router.get('/categories/:id', async (req, res) => {
  const id = req.params.id;
  const category = await Category.findById(id);

  if (category) {
    const products = await Product.find({ category: category.id });
    return res.render('singleCategory', { category, products });
  }
  if (!category) {
    const category = { name: 'Not found' };
    return res.render('singleCategory', { category });
  }
});

router.get('/contact-us', (req, res) => {
  res.render('contact');
});

//for user only

router.use(authController.protect);

router.get('/account', (req, res) => {
  res.render('user/account');
});
router.get('/account/details', (req, res) => {
  res.render('user/accountDetails');
});

router.post('/account/details', userController.updateMe);

router.get('/cart', async (req, res) => {
  const carts = await Cart.find({ user: req.user.id });

  res.render('cart', { carts });
});
router.get('/add-to-cart', (req, res) => {
  res.render('products', { error: 'Now add to cart' });
});
router.post('/update-cart', async (req, res) => {
  await Cart.findByIdAndDelete(req.body.id);
  res.redirect('/cart');
});
router.post(
  '/add-to-cart',
  productController.uploadProductImages,
  productController.resizeProductImages,
  async (req, res) => {
    if (req.body.quantity > req.body.stock) {
      return res.redirect(`/products/${req.body.product}`);
    }
    const cart = await Cart.findOne({
      user: req.user.id,
      product: req.body.product,
      SKU: req.body.SKU,
    });

    //if not cart
    if (!cart) {
      console.log('not');
      const newCart = await Cart.create({
        user: req.user.id,
        product: req.body.product,
        quantity: req.body.quantity,
        imageCover: req.body.imageCover,
        SKU: req.body.SKU,
      });

      return res.redirect(`/products/${req.body.product}`);
    }

    //if already a cart for that product
    const quantity = Number(req.body.quantity) + cart.quantity;

    if (quantity > cart.product.stock) {
      return res.redirect(`/products/${req.body.product}`);
    }

    const newCart = await Cart.findByIdAndUpdate(
      cart.id,
      {
        quantity,
      },
      { new: true }
    );

    console.log(newCart);
    return res.redirect(`/products/${req.body.product}`);
  }
);

router.get('/checkout', async (req, res) => {
  const carts = await Cart.find({ user: req.user.id });
  res.render('checkout', { carts });
});

router.post('/pay', async (req, res) => {
  const items = await Cart.find({ user: req.user.id });
  const total = req.body.amount.toString();
  var create_payment_json = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal',
    },
    redirect_urls: {
      return_url: 'http://localhost:5000/success',
      cancel_url: 'http://localhost:5000/cancell',
    },
    transactions: [
      {
        item_list: {
          items: JSON.stringify(items),
        },
        amount: {
          currency: 'USD',
          total,
        },
        description: req.body.orderComment.toString(),
      },
    ],
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      res.json({ error });
      throw error;
    } else {
      console.log('rr');
      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === 'approval_url') {
          res.redirect(payment.links[i].href);
        }
      }
    }
  });
});

router.get('/success', async (req, res) => {
  const payerId = req.params.PayerID;
  const paymentId = req.params.PaymentID;

  const execute_payment_json = {
    payer_id: payerId,
    // transactions: [
    //   {
    //     amount: {
    //       currency: 'usd',
    //       total,
    //     },
    //   },
    // ],
  };

  paypal.payment.execute(paymentId, execute_payment_json, async function (
    error,
    payment
  ) {
    if (error) {
      console.log(error.response);
      throw error;
    } else {
      const carts = await Cart.find({ user: req.user.id });

      const newOrder = await Order.create({
        user: req.user.id,
        carts,
        paid: true,
        address: req.user.address,
        amount: payment.transactions[0].amount.total,
      });

      res.redirect('/orders');
    }
  });
});

router.get('/cancell', (req, res) => {
  res.send("didn't happen");
});

router.get('/orders', async (req, res) => {
  const orders = await Order.find({
    user: req.user.id,
    completed: { $ne: true },
  });
  res.render('user/orders', { orders });
});
router.get('/orders:id', async (req, res) => {
  const order = Order.findById(req.params.id);

  res.render('user/singleOrder', { order });
});

router.get('/orders/completed', async (req, res) => {
  const orders = await Order.find({
    user: req.user.id,
    completed: { $ne: false },
  });
  res.render('user/ordersCompleted', { orders });
});

//admin only
router.use(authController.restrictTo('admin'));

//order processing
router.get('/admin/orders', async (req, res) => {
  if (req.params.orderId) filter = { order: req.params.productId };

  const features = new APIFeatures(Order.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  // const doc = await features.query.explain();
  const orders = await features.query;

  res.render('admin/orders', { layout: 'layoutAdmin', orders });
});

//dashboard
router.get('/admin', async (req, res) => {
  res.render('admin/dashboard', { layout: 'layoutAdmin' });
});

router.get('/admin/products', async (req, res) => {
  let filter = {};
  if (req.params.productId) filter = { product: req.params.productId };

  const features = new APIFeatures(Product.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  // const doc = await features.query.explain();
  const doc = await features.query;
  res.render('admin/products', { layout: 'layoutAdmin', doc });
});

router.get('/admin/products/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);

  res.render('admin/singleProduct', { product, layout: 'layoutAdmin' });
});

router.post(
  '/admin/products/:id',
  productController.uploadProductImages,
  productController.resizeProductImages,
  productController.updateProduct
);
router.get('/admin/add-product', async (req, res) => {
  //const categories = await Category.find();
  res.render('addProduct', { layout: 'layoutAdmin' });
});

router.post('/admin/products/delete/:id', productController.deleteProduct);

//variants

router.get('/admin/add-variants', (req, res) => {
  res.render('admin/addVariant', { layout: 'layoutAdmin' });
});

router.post('/admin/add-variants', async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { SKU: req.body.product },
    {
      $push: {
        variants: {
          base: req.body.base,
          name: req.body.name,
          value: req.body.value,
          SKU: req.body.SKU,
          stock: req.body.stock,
          price: req.body.price,
        },
      },
    }
  );
  if (product) {
    return res.redirect(`/admin/products/${product.id}`);
  }
});

router.get('/admin/add-category', async (req, res) => {
  //const categories = await Category.find();
  res.render('addCategory', { layout: 'layoutAdmin' });
});
router.get('/admin/categories', async (req, res) => {
  //const categories = await Category.find();
  res.render('admin/categories', { layout: 'layoutAdmin' });
});

router.get('/admin/home', async (req, res) => {
  const homes = await Home.find();
  const url = `${req.protocol}://${req.get('host')}`;
  res.render('admin/adminHome', { layout: 'layoutAdmin', homes, url });
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
    return res.render('admin/adminHome', { layout: 'layoutAdmin', homes, url });
  }

  const newLink = await Home.create({ link });

  res.redirect('/admin/home');
});

router.get('/admin/home/:id', async (req, res) => {
  const home = await Home.findById(req.params.id);
  res.render('admin/singleHomeLink', { layout: 'layoutAdmin', home });
});

router.post('/admin/home/delete/:id', async (req, res) => {
  const id = req.params.id;
  const doc = await Home.findByIdAndDelete(id);

  res.redirect('/admin/home');
});

module.exports = router;
