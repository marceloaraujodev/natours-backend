const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
    // Get tour data from collection
    const tours = await Tour.find();
    // build template

    // render template using tour data from step 1
    res.status(200).render('overview', {
      title: 'All tours',
      tours
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const {slug} = req.params
  const tour = await Tour.findOne({slug}).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  if(!tour){
    return next(new AppError('There is no tour with that name.', 404))
  }
  
    res.status(200).render('tour', {
      title: `${tour.name} Tour`,
      tour
    });
});

// no need to query for the user since we already did it in the .protect route
exports.getLoginForm =  (req, res) => {
  res.status(200).render('login', {
    title: 'Log in'
  });
}

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Account'
  });
};

exports.getMyTours = catchAsync(async (req, res) => {
  // find all bookings
  const bookings = await Booking.find({ user: req.user.id });

    // find tours with ids of bookings
    const tourIds = bookings.map(el => el.tour);
    console.log(tourIds);
    const tours = await Tour.find({ _id: {$in: tourIds } });

    res.status(200).render('overview', {
      title: 'My Tours', 
      tours
    })
});

exports.updateUserData = async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(req.user.id, {
    name: req.body.name,
    email: req.body.email
  },
  {
    new: true,
    runValidators: true
  }
  );

  res.status(200).render('account', {
    title: 'Account',
    user: updatedUser
  });
};
