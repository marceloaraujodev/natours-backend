const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes')

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// if (process.env.NODE_ENV === 'production') {
//   console.log('Application is running in production environment');
// } else {
//   console.log('Application is running in development or another environment');
// }

// Global Middlewares

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));
// Set Security HTTP headers
app.use(helmet());

// Set Security HTTP headers including CSP // only for the map
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://unpkg.com", "https://cdnjs.cloudflare.com","https://js.stripe.com"],
    styleSrc: ["'self'", "https://unpkg.com", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
    imgSrc: ["'self'","https://cdnjs.cloudflare.com" , "data:", "https://a.tile.openstreetmap.org", "https://b.tile.openstreetmap.org", "https://c.tile.openstreetmap.org"],
    connectSrc: ["'self'", "ws://localhost:63504/", "ws://localhost:51660/", "ws://localhost:51510", "ws://localhost:52046", "ws://localhost:52918", "ws://localhost:53262", "ws://localhost:50317/"], 
    fontSrc: ["'self'", "https://fonts.gstatic.com"], // Add font source
    objectSrc: ["'none'"], // Disallow <object> URIs
    upgradeInsecureRequests: [], // Upgrade HTTP to HTTPS
    blockAllMixedContent: [], // Block mixed content
    baseUri: ["'self'"], // Restrict base URIs
    formAction: ["'self'"], // Allow form submissions to same origin
    frameAncestors: ["'none'"], // Disallow framing by other sites
    frameSrc: ["'self'", "https://js.stripe.com"], // Allow frames only from same origin
    manifestSrc: ["'self'"], // Restrict manifest files to same origin
    mediaSrc: ["'self'"], // Allow media from same origin
    workerSrc: ["'self'"], // Allow web workers from same origin
    childSrc: ["'self'"], // Allow child sources from same origin
    // Add other directives as needed
  }
}));

// Development looging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same api
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 1hr
  message: 'Too many requests from this IP, please try again in one hour!',
});
app.use('/api', limiter);

// Bodyparser reads data from body to req.body
app.use(express.json({ limit: '10kb' })); // express.json is a middleware
app.use(express.urlencoded({ extended: true, limit: '10kb'}))
app.use(cookieParser()); // parses data from cookies

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());
// Data sanitization against XSS
app.use(xss());

// prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

app.use(compression()); // compresses json

// Testing middleware Adds requested time to getAllTours on tourController
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log('This is req.headers from app.js:', req.headers)
  // console.log("COOKIES", req.cookies);
  next();
});

// Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//Middleware for routes that dont exist
app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on this server`)
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on this server`));
});

app.use(globalErrorHandler);

module.exports = app;
