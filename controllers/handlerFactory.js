const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // new: true means it will return the new updated document on the mongoose docs
    // [options.new=false] «Boolean» if true, return the modified document rather than the original
    // run validators if you type a string into price will throw erros since is expected number!
    // 🚩 patch updates the fields put updates the entire object

    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) => catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    // console.log(Model);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
});

exports.getOne = (Model, populateOptions) => catchAsync(async (req, res, next) => {

  let query = Model.findById(req.params.id)
  if(populateOptions) query = query.populate(populateOptions)
  const doc = await query;

  if(!doc){
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: doc,
    },
  });
});

exports.getAll = (Model) => catchAsync(async (req, res, next) => {
  let filter = {}
  if(req.params.tourId) filter = { tour: req.params.tourId } 
  // two lines above are only needed for get all reviews! Nested routes ⚠️ 
  // {{URL}}api/v1/tours/65ba68f76f103990887ff72a/reviews

  const features = new APIFeatures(Model.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const doc = await features.query;

  res.status(200).json({
    status: 'success',
    results: doc.length,
    data: {
      data: doc,
    },
  });
});
