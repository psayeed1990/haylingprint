const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const { promisify } = require('util');
const catchAsync = require('./../utils/catchAsync');
const Email = require('./../utils/email');
const AppError = require('./../utils/appError');

//create JWT token
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

//send JWT as cookie
const sendToken = (user, statusCode, req, res, origin) => {
  const token = createToken(user._id);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  // Remove password from output
  user.password = undefined;

  // res.status(statusCode).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user,
  //   },
  // });
  return res.redirect(req.body.origin || '/account');
};

//sign up
exports.signup = catchAsync(async (req, res, next) => {
  //check if email already exist
  const oldUser = await User.findOne({ email: req.body.email });
  if (oldUser) {
    return res.render('auth/login', {
      message: 'Email already exists. Please login',
    });
  }

  //create new user
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    phone: req.body.phone,
    address: req.body.address,
    emailVerified: true,
    expire_at: undefined,
  });

  //generate jwt token to verify email
  //const EmailVerifyToken = await createToken(newUser._id);

  //verification url
  // const url = `${req.protocol}://${req.get(
  //   'host'
  // )}/api/v1/users/email-verify/${EmailVerifyToken}`;

  // await new Email(newUser, url).sendEmailVerify();
  sendToken(newUser, 200, req, res);
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
  const token = req.params.token;

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //see if token expired
  if (decoded.exp * 1000 <= Date.now()) {
    return next(new AppError('Token expired', 401));
  }

  //find user by token
  const currentUser = await User.findById(decoded.id);

  //if user not found
  if (!currentUser) {
    return res.render('404', { message: 'User no longer exists' });
  }

  //if already verifies
  if (currentUser.emailVerified === true) {
    return res.render('user/account', { message: 'Already verified' });
  }

  if (currentUser.expire_at <= Date.now()) {
    return res.render('404', {
      message: 'Time expired. User deleted. Signup Again',
    });
  }

  //set verification to true;
  currentUser.emailVerified = true;
  currentUser.expire_at = undefined;
  await currentUser.save({ validateBeforeSave: false });
  res.render('user/account', { message: 'User verified' });
});

//login
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('auth/login', {
      message: 'Please provide email and password',
    });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.render('auth/login', {
      message: 'No user found with this email. Please register',
    });
  }

  if (!user || !(await user.correctPassword(password, user.password))) {
    return res.render('auth/login', {
      message: 'Email or password incorrect',
    });
  }

  sendToken(user, 200, req, res);
});

//logout
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.redirect('/');
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    //return next(
    //  new AppError('You are not logged in! Please log in to get access.', 401)
    //);

    let login_errors = {};
    login_errors.error = 'Please log in to get access';
    origin = req.originalUrl;
    return res.render('auth/login', { origin, login_errors });
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    let login_errors = {};
    login_errors.error = 'User does not exist. Please register';

    return res.render('auth/register', { login_errors });
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    let login_errors = {};
    login_errors.error = 'You are using a old password.';
    origin = req.originalUrl;
    return res.render('auth/login', { origin, login_errors });
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return res.send('Not your territoty. Only a admin can access this');
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.render('auth/forgetPassword', {
      message: `No user found with this email address: ${req.body.email}`,
    });
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    return res.render('auth/forgetPassword', {
      message: 'A email with reset link sent to your address',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.render('auth/forgetPassword', {
      message: 'Email could not sent. A error occured',
    });
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return res.render('auth/resetPassword', { message: 'Link expired' });
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, req, res);
});
