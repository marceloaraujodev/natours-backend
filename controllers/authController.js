const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPRIES_IN * 24 * 60 * 60 * 1000,
    ),
    // secure: false, // means only sent in encrypted connection, only activati this in prodution bc of https
    httpOnly: true, // cookie cannot be accessed or modified in any way by browser ⚠️
    // for heroku only he add the lines below. Lesson 224 HTTPS Connections
    // secure: req.secure || req.headers('x-forwarded-proto) === 'https
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined; // makes it so the password wont appear in the response

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // this is the line the creates and saves the user in the DB
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangeAt: req.body.passwordChangeAt,
    role: req.body.role,
  });
  

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});

// 1.
exports.login = catchAsync(async (req, res, next) => {
  // 2.
  const { email, password } = req.body;

  // 3. check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please Provide email and password!', 400));
  }

  // 4. Check if user exist && password is correct
  const user = await User.findOne({ email }).select('+password');

  // doing this step both at the same time gives less info to potential attackers, if done by steps he can know if only one field is incorrect
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  // 5. If everything is ok, send token to client
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success'});
}

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1 Get token and check if it exists
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in!', 401));
  }

  // 2 Verify the token
  // promisify(jwt.verify) returns a function. function + (token, process.env.JWT_SECRET);
  //RESULT OF DECODED: { id: 'xxx', iat: xxx, exp: xxx } iat = issue at
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3 Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to the token no longer exists.', 401),
    );
  }
  // 4 Check if user changed password after the token was issued. If so new token needs to be created
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again', 401),
    );
  }
  // Grant access to protected route. & puts user object on req object!⚠️
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );
  
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
  
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
  
      res.locals.user = currentUser;
      return next();
      
    } catch (error) {
      return next();
    }
  }
  next();
};

// on tourRoutes authController.restrictTo('admin', 'lead-guide') we passe this args
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']
    // console.log(req.user)
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1 Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }
  // 2 Generate random token
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });
  // 3 Send it back as an email
  
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to your email!',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again Later!'),
      500,
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1 Get user baased on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2 If token has not expired and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired!'), 400);
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3 Update changePasswordAt property for the user
  //this was done in the userModel.
  // 4 Log the user in. Send JWT to the client
  createSendToken(user, 200, res);
});

// for logged in users only
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1 Get user from collection
  const user = await User.findById(req.user.id).select('+password');
  // 2 Check if posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('You current password is wrong.', 401));
  }
  // 3 If so update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save(); // needs to be save and not saveByIdAndUpdate, because of the userModel.js structure
  // 4 Log user in, send JWT to user.
  createSendToken(user, 200, res);
});

