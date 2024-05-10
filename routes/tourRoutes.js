const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();
// router.param('id', tourController.checkID)

// GET /tour/2345/reviews
// POST /tour/1234fa/reviews

router.use('/:tourId/reviews', reviewRouter)  

// middleware functions passed as arguments
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year')
.get(
  authController.protect,
  authController.restrictTo('admin', 'lead-guide', 'guide'),
  tourController.getMonthlyPlan
  );

router.route('/tours-within/:distance/center/:latlng/unit/:unit')
.get(tourController.getToursWithin);  
// /tours-distance/233/center/-60,65/unit/mi

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances)

// routes
router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect, 
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
    );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(    
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
    )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

module.exports = router;
