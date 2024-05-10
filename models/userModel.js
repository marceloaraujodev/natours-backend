const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');


// schema with name, email, photo, password, passwordConfirm

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'], 
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email'] // just calls the function isEmail
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role:{
        type: String,
        enum: ['user', 'guide', 'lead', 'admin'],
        default: 'user',
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, "Password needs to be at least 6 characters"],
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            validator: function(value){
                // This only works on CREATE AND SAVE!! 
                // if updating password this validator wont work.
                return value === this.password
            },
            message: "Passwords do not match"
        }
    },
    passwordChangeAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

//// runs before new doc is saved
//// pre save middleware for encription
userSchema.pre('save', async function(next) {
    // Only run if password was modified, or on signup since is saved first time
    if(!this.isModified('password')) return next();

    // Encrypts the password with the cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    // Deletes passwordConfirm Field not need it in DB! Only required for client
    this.passwordConfirm = undefined; 
    next();
});

/* in theory this should work however, sometimes saving to the database
  is a bit slower than issuing the JWT making it so that the changed password timeStamp is sometimes set after the JWT has been created. That would make it so that the user would not be able to log in using the new token. To fix this just subtract 1 second from it.*/
  userSchema.pre('save', function (next) {
    // if we did not manipulate this field do not change it
    if(!this.isModified('password') || this.isNew) return next();

    this.passwordChangeAt = Date.now() - 1000; // - 1 sec

    next();
})
 


userSchema.pre(/^find/, function(next){
    // this points to the current query, this adds the middleware to the getAllUsers since it uses the User.find() method. It will be activated before the getAllUsers is executed. And here we will set that we only want to find documents that have the type property active is not equals to false, if false wont show.

    this.find({ active: { $ne: false } });
    next();
});



// Instance methods
userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    // this.password not available because we used type property select: false in the userModel.js
    return await bcrypt.compare(candidatePassword, userPassword)
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp){
    // lets say token was issued at time 100. but then we changed the password, lets say at time 200. Means we change the password after the token was issued. so 100 < 200 = true. Because if it returns false, means we havent change the password. (change password after token issued)
    if(this.passwordChangeAt){
        const changedTimestamp = parseInt(this.passwordChangeAt.getTime() / 1000, 10);
        return JWTTimeStamp < changedTimestamp; 
    }
    // false means not changed
    return false;
}

userSchema.methods.createPasswordResetToken = function () {

    const resetToken = crypto.randomBytes(32).toString('hex'); // not encrypted
    
    this.passwordResetToken = crypto // encrypted with basic encription
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

    console.log('From userModel Reset Token, NOT ENCRYPTED:-----', { resetToken })
    console.log('this.passwordResetToken, ENCRYPTED:-----', this.passwordResetToken)

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 min.

    return resetToken;
}

// END INSTACE METHODS

const User = mongoose.model('User', userSchema);

module.exports = User;