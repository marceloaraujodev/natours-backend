/*
1. Constructor method is call each time we create an object out of this class
2. when we extend a parent class we call super() in order to call the parent
 constructor, we do it with message because message its the only parameter that the built in error accepts, 

3. this.isOperational = true; we create the isOperational 
 property for the operational errors the ones we can predict. this will let us test for this property later on and see if the error is operational or programming
4. Error.stack shows us where the error happend, at what file and which line.
 */

class AppError extends Error {
    constructor(message, statusCode){
        super(message)

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor)
    }
};

module.exports = AppError;