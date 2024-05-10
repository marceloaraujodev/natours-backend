const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');
// const tourController = require('../controllers/tourController');

const router = express.Router({mergeParams: true});
// GET /tour/1234fa/reviews
// POST /tour/1234fa/reviews
// POST /reviews 
// any of those will be redirecte to 

// Autenticated routes below
router.use(authController.protect);

router.route('/')
.get(reviewController.getAllReviews)
.post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
);


router.route('/:id')
.get(reviewController.getReview)
.delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview)
.patch(authController.restrictTo('user', 'admin'), reviewController.updateReview);

module.exports = router;