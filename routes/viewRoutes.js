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
const Quote = require('./../models/quickQuoteModel');

router.use(authController.isLoggedIn);

//starts paypal
paypal.configure({
  mode: 'live', //sandbox or live
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_SECRET_KEY,
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

//contact form
router.post('/contact', async (req, res) => {
  const newQuote = await Quote.create(req.body);
  res.render('contact', {
    message: 'A message is sent. We will reply in a minute',
  });
});

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

router.get('/forget-password', async (req, res) => {
  res.render('auth/forgetPassword', {
    message: 'Put your email address to get a password reset link',
  });
});

router.post('/forget-password', authController.forgotPassword);
router.get('/resetPassword/:token', (req, res) => {
  res.render('auth/resetPassword', { message: 'Please provide new password' });
});
router.post('/resetPassword', authController.resetPassword);

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

router.get('/account', authController.protect, (req, res) => {
  res.render('user/account');
});
router.get('/account/details', (req, res) => {
  res.render('user/accountDetails');
});

router.post(
  '/account/details',
  authController.protect,
  userController.updateMe
);

router.get('/cart', authController.protect, async (req, res) => {
  const carts = await Cart.find({ user: req.user.id });

  res.render('cart', { carts });
});
router.get('/add-to-cart', authController.protect, (req, res) => {
  res.render('products', { error: 'Now add to cart' });
});
router.post('/update-cart', authController.protect, async (req, res) => {
  await Cart.findByIdAndDelete(req.body.id);
  res.redirect('/cart');
});
router.post(
  '/add-to-cart',
  authController.protect,
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
      const selectedProduct = await Product.findById(req.body.product);

      const selectedVariant = selectedProduct.variants.filter(
        (variant) => variant.SKU === req.body.SKU
      );
      if (req.body.laminatingPrice) {
        const newCart = await Cart.create({
          user: req.user.id,
          product: req.body.product,
          quantity: req.body.quantity,
          imageCover: req.body.imageCover,
          SKU: req.body.SKU,
          price: selectedVariant[0].price + selectedProduct.laminatingPrice,
          variantName: selectedVariant[0].name,
          variantValue: selectedVariant[0].value,
          laminatingPrice: req.body.laminatingPrice,
        });
      }
      if (!req.body.laminatingPrice) {
        const newCart = await Cart.create({
          user: req.user.id,
          product: req.body.product,
          quantity: req.body.quantity,
          imageCover: req.body.imageCover,
          SKU: req.body.SKU,
          price: selectedVariant[0].price,
          variantName: selectedVariant[0].name,
          variantValue: selectedVariant[0].value,
        });
      }

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

router.get('/checkout', authController.protect, async (req, res) => {
  const carts = await Cart.find({ user: req.user.id, ordered: { $ne: true } });
  res.render('checkout', { carts });
});

router.post('/pay', authController.protect, async (req, res) => {
  const carts = await Cart.find({ user: req.user.id, ordered: { $ne: true } });

  if (!carts) {
    return res.redirect('/products');
  }

  let items = [];
  carts.forEach((cart) => {
    let item = {
      name: cart.product.name,
      sku: cart.SKU,
      price: cart.price,
      currency: 'GBP',
      quantity: cart.quantity,
    };
    items.push(item);
  });

  const total = req.body.amount.toString();
  var create_payment_json = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal',
    },
    redirect_urls: {
      return_url: `${req.protocol}://${req.get('host')}/success`,
      cancel_url: `${req.protocol}://${req.get('host')}/cancell`,
    },
    transactions: [
      {
        item_list: {
          items: items,
        },
        amount: {
          currency: 'GBP',
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

router.get('/success', authController.protect, async (req, res) => {
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
      const carts = await Cart.find({
        user: req.user.id,
        ordered: { $ne: true },
      });

      let cartsId = [];
      for (var i = 0; i < carts.length; i++) {
        cartsId.push(carts[i].id);
        await Cart.findByIdAndUpdate(carts[i].id, { ordered: true });
      }

      const newOrder = await Order.create({
        user: req.user.id,
        carts: cartsId,
        paid: true,
        address: req.user.address,
      });

      res.redirect(`/orders/${newOrder.id}`);
    }
  });
});

//test order
// router.post('/test-order', authController.protect, async (req, res) => {
//   const carts = await Cart.find({
//     user: req.user.id,
//     ordered: { $ne: true },
//   });

//   let cartsId = [];
//   for (var i = 0; i < carts.length; i++) {
//     cartsId.push(carts[i].id);
//     await Cart.findByIdAndUpdate(carts[i].id, { ordered: true });
//   }

//   const newOrder = await Order.create({
//     user: req.user.id,
//     carts: cartsId,
//     paid: true,
//     address: req.user.address,
//   });

//   res.redirect(`/orders/${newOrder.id}`);
// });

router.get('/cancell', authController.protect, (req, res) => {
  res.send("didn't happen");
});

//update order design
router.post(
  '/update-order-design',
  authController.protect,
  productController.uploadProductImages,
  productController.resizeProductImages,
  async (req, res) => {
    const newCart = await Cart.findByIdAndUpdate(
      req.body.cartId,
      { imageCover: req.body.imageCover },
      { new: true }
    );

    res.redirect(`/orders/${req.body.orderId}`);
  }
);

router.get('/orders', authController.protect, async (req, res) => {
  const orders = await Order.find({
    user: req.user.id,
    completed: { $ne: true },
  });

  res.render('user/orders', { orders });
});
router.get('/orders/:id', authController.protect, async (req, res) => {
  const order = await Order.findById(req.params.id).populate('carts');

  res.render('user/singleOrder', { order });
});

router.get('/orders/completed', authController.protect, async (req, res) => {
  const orders = await Order.find({
    user: req.user.id,
    completed: true,
  });
  console.log(orders);
  res.render('user/ordersCompleted', { orders });
});

//admin only

//search order
router.post(
  '/admin/search/orders',
  authController.protect,
  authController.restrictTo('admin'),
  async (req, res) => {
    const user = await User.findOne({ phone: req.body.phone });
    if (!user) {
      return res.render('admin/searchOrders', {
        layout: 'layoutAdmin',
        orders,
        phone: req.body.phone,
      });
    }
    const orders = await Order.find({ user: user.id });
    res.render('admin/searchOrders', {
      layout: 'layoutAdmin',
      orders,
      phone: req.body.phone,
    });
  }
);

//order processing
router.get(
  '/admin/orders/:id',
  authController.protect,
  authController.restrictTo('admin'),
  async (req, res) => {
    const order = await Order.findById(req.params.id).populate('carts');

    res.render('admin/singleOrder', { layout: 'layoutAdmin', order });
  }
);

router.post(
  '/admin/orders/:id',
  authController.protect,
  authController.restrictTo('admin'),
  async (req, res) => {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.body.id,
      { completed: true },
      { new: true }
    );

    res.redirect(`/admin/orders/${updatedOrder.id}`);
  }
);

// router.get('/admin/orders/completed', async (req, res) => {
//   const orders = await Order.find();

//   res.render('admin/ordersCompleted', { layout: 'layoutAdmin', orders });
// });

router.get(
  '/admin/orders',
  authController.protect,
  authController.restrictTo('admin'),
  async (req, res) => {
    const orders = await Order.find({
      completed: { $ne: true },
    });

    res.render('admin/orders', { layout: 'layoutAdmin', orders });
  }
);

//dashboard
router.get(
  '/admin',
  authController.protect,
  authController.restrictTo('admin'),
  async (req, res) => {
    const orders = await Order.find({ completed: { $ne: true } });
    res.render('admin/dashboard', { orders, layout: 'layoutAdmin' });
  }
);

router.get(
  '/admin/products',
  authController.protect,
  authController.restrictTo('admin'),
  async (req, res) => {
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
  }
);

router.get(
  '/admin/products/:id',
  authController.protect,
  authController.restrictTo('admin'),
  async (req, res) => {
    const product = await Product.findById(req.params.id);

    res.render('admin/singleProduct', { product, layout: 'layoutAdmin' });
  }
);

router.post(
  '/admin/products/:id',
  authController.protect,
  authController.restrictTo('admin'),
  productController.uploadProductImages,
  productController.resizeProductImages,
  productController.updateProduct
);
router.get(
  '/admin/add-product',
  authController.protect,
  authController.restrictTo('admin'),
  async (req, res) => {
    //const categories = await Category.find();
    res.render('addProduct', { layout: 'layoutAdmin' });
  }
);

router.post(
  '/admin/products/delete/:id',
  authController.protect,
  authController.restrictTo('admin'),
  productController.deleteProduct
);

//variants

router.get(
  '/admin/add-variants',
  authController.protect,
  authController.restrictTo('admin'),
  (req, res) => {
    res.render('admin/addVariant', { layout: 'layoutAdmin' });
  }
);

router.post(
  '/admin/add-variants',
  authController.protect,
  authController.restrictTo('admin'),
  async (req, res) => {
    const product = await Product.findOneAndUpdate(
      { SKU: req.body.product },
      {
        $push: {
          variants: {
            base: req.body.base,
            name: req.body.name,
            value: req.body.value,
            SKU: req.body.SKU,
            price: req.body.price,
          },
        },
      }
    );
    if (product) {
      return res.redirect(`/admin/products/${product.id}`);
    }
  }
);

router.get(
  '/admin/add-category',
  authController.protect,
  authController.restrictTo('admin'),
  async (req, res) => {
    //const categories = await Category.find();
    res.render('addCategory', { layout: 'layoutAdmin' });
  }
);
router.get(
  '/admin/categories',
  authController.protect,
  authController.restrictTo('admin'),
  async (req, res) => {
    //const categories = await Category.find();
    res.render('admin/categories', { layout: 'layoutAdmin' });
  }
);

router.get(
  '/admin/category/:id',
  authController.protect,
  authController.restrictTo('admin'),
  async (req, res) => {
    const category = await Category.findById(req.params.id);

    res.render('admin/singleCategory', { layout: 'layoutAdmin', category });
  }
);

router.post(
  '/admin/category/:id',
  authController.protect,
  authController.restrictTo('admin'),
  async (req, res) => {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        parentCategory: req.body.parentCategory,
        slug: req.body.slug,
      },
      { new: true }
    );

    res.render('admin/singleCategory', { layout: 'layoutAdmin', category });
  }
);

router.post(
  '/admin/category/delete/:id',
  authController.protect,
  authController.restrictTo('admin'),
  async (req, res) => {
    const category = await Category.find();
    await Category.findByIdAndDelete(req.params.id);

    res.render('admin/categories', { message: 'Category deleted' });
  }
);

router.get(
  '/admin/home',
  authController.protect,
  authController.restrictTo('admin'),
  async (req, res) => {
    const homes = await Home.find();
    const url = `${req.protocol}://${req.get('host')}`;
    res.render('admin/adminHome', { layout: 'layoutAdmin', homes, url });
  }
);

router.post(
  '/admin/home',
  authController.protect,
  authController.restrictTo('admin'),
  async (req, res) => {
    const url = `${req.protocol}://${req.get('host')}/products/`;
    const getlink = req.body.link;
    const link = getlink.toString().replace(url, '');

    const product = await Product.findById({ _id: link });

    if (product) {
      //write error message here
      const homes = await Home.find();
      const url = `${req.protocol}://${req.get('host')}`;
      return res.render('admin/adminHome', {
        layout: 'layoutAdmin',
        homes,
        url,
      });
    }

    const newLink = await Home.create({ link });

    res.redirect('/admin/home');
  }
);

router.get(
  '/admin/home/:id',
  authController.protect,
  authController.restrictTo('admin'),
  async (req, res) => {
    const home = await Home.findById(req.params.id);
    res.render('admin/singleHomeLink', { layout: 'layoutAdmin', home });
  }
);

router.post(
  '/admin/home/delete/:id',
  authController.protect,
  authController.restrictTo('admin'),
  async (req, res) => {
    const id = req.params.id;
    const doc = await Home.findByIdAndDelete(id);

    res.redirect('/admin/home');
  }
);

router.get(
  '/client-queries',
  authController.protect,
  authController.restrictTo('admin'),
  async (req, res) => {
    const queries = await Quote.find();

    res.render('admin/clientQueries', { layout: 'layoutAdmin', queries });
  }
);

module.exports = router;
