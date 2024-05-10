const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

// Multer
//when you dont need image processing just use those config below:
// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users');
//     },
//     filename: (req, file, cb) => {
//         // makes sure only one filename
//         const ext = file.mimetype.split('/')[1]; // mimetype: 'image/jpeg', gets jpg
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`) // user-12345-date.jpg
//     }
// });

// keeps the img in memory instead of saving and then reading again for the resizing process
const multerStorage = multer.memoryStorage();

// test if upload file is img
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Please upload a image.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');
// end multer config

// sharp, resizing for nodejs
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el]; // adds each element to the new object
    }
  });
  return newObj; // Object.keys return array with field names, then we use the forEAch
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1 create error if user posts password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. For that use updateMyPassword',
        400,
      ),
    );
  }
  // 2 Filtered out not allowed fields
  const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.file) filteredBody.photo = req.file.filename; //creates .photo property in obj

  // 3 Update user doc
  const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, // set the new option to true to return the document after update was applied.
    runValidators: true,
  });
  // updateUser.name = 'Marcelo C';

  res.status(200).json({
    status: 'success',
    data: {
      user: updateUser,
    },
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  });
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
// Do not update passwords with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
