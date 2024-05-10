// review // rating // createAt / ref to tour / ref user
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty!'],
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
  },
  {
    // options object - this makes a field that is not stored into db show up in the output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

//prevents user from leaving multiple reviews on the same tour.
reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); 

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // points to the model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats);

  if(stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  }else{
        // if no reviews reset the values to default
        await Tour.findByIdAndUpdate(tourId, {
          ratingsQuantity: 0,
          ratingsAverage: 4.5, // default when no reviews yet
        });
  }
};

reviewSchema.post('save', function () {
  // poits to current review
  this.constructor.calcAverageRatings(this.tour);
});


reviewSchema.post(/^findOneAnd/, async function (doc) {
  if(doc){
    await doc.constructor.calcAverageRatings(doc.tour);
  }
});

// reviewSchema.post(/^findOneAnd/, async function () {
//   this.rating.constructor.calcAverageRatings(this.rating.tour);
// })

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
