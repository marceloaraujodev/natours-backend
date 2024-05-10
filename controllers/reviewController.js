const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');

//middleware to set user id or tour id on the body
exports.setTourUserIds = (req, res, next) => {
        // console.log(req.params.tourId)
        if(!req.body.tour) req.body.tour = req.params.tourId;
        if(!req.body.user) req.body.user = req.user.id // user id from protect middleware
        next();
}

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);