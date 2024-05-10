const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('./userModel')
// const validator = require('validator');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true,
    trim: true,
    maxlength: [40, 'A Tour name must have less or equal than 40 characters'],
    minlength: [10, 'A Tour name must have more or equal than 10 characters']
  },
  slug: String,
  duration: {
    type: Number,
    required: [true, 'A tour must have a duration'],
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a group size'],
  },
  difficulty: {
    type: String,
    required: [true, 'A tour must have a difficulty'],
    enum: {
      values: ['easy', 'medium', 'difficult'],
      message: 'Difficulty is either: easy, medium, difficult'
    }
    
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'Rating must be above 1.0'],
    max: [5, 'Rating must be below 5.0'],
    set: val => Math.round(val * 10) / 10 // it is kept as a number .toFixed(1) turns to string
  },
  ratingsQuantity: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price'],
  },
  priceDiscount: {
    type: Number,
    validate: { 
      validator:     function(val){
        return val < this.price; // 100 < 200 true, no errors
      },
      // message has access to val mongoose syntax
      message: 'Discount price ({VALUE}) should be below regular price' 
    },
  }, 
  summary: {
    type: String,
    trim: true,
    required: [true, 'A tour must have a description'],
  },
  description: {
    type: String,
    trim: true,
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have a cover image'],
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false
  },
  startDates: [Date],
  secretTour: {
    type: Boolean,
    default: false
  },
  startLocation: {
    // GeoJSON a embedded object not for schemaType
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number], // expects an array of numbers
    address: String,
    description: String
  },
  locations: [
    {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number
    },
  ],
  guides: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
  ], 
}, {
    // options object - this makes a field that is not stored into db show up in the output
  toJSON: { virtuals: true},
  toObject: { virtuals: true},
});

// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({slug: 1});

tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});


// Virtual Populate
tourSchema.virtual('reviews', {
  ref: 'Review', // reviewModel -> const Review = mongoose.model('Review', reviewSchema);
  localField: '_id', // tourModel doc _id
  foreignField: 'tour' // the property tour in the reviewModel
})

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, {lower: true});
  next();
});

tourSchema.pre('save', async function(next) {
  const guidesPromises = this.guides.map(async id => await User.findById(id))
  this.guides = await Promise.all(guidesPromises) // overwrites the array of id with array of documents
  next();
})

// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function(next){ // regex means all strings that starts with find
// tourSchema.pre('find', function(next){
  this.find({secretTour: {$ne: true}}) // ne not equals shows all that arent secret
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (){
    this.populate({
      path: 'guides',
      select: '-__v -passwordChangeAt'
    })
});

tourSchema.post(/^find/, function(docs, next){
  console.log(`Query took ${Date.now() - this.start} milliseconds`) // this here refers to query obj
  next();
});

// This was turn off because it conflicted with the geoNear. 
// ⚠️(geoNear needs to be the first stage in the pipeline order)

// // AGGREGATION MIDDLEWARE // unshift add at beggining of array
// tourSchema.pre('aggregate', function(next){
//   this.pipeline().unshift( { $match: { secretTour: { $ne: true } } } );
//   console.log('Pipeline order of events:', this.pipeline());
//   next();
// })

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
