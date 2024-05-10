module.exports = fn => {
    return (req, res, next) => {
      fn(req, res, next).catch( error => {
        // console.error('Error caught by catchAsync:', error);
        next(error); // Pass the error to the next middleware (error handler)
      })
    };
  };