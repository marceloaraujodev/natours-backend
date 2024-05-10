const express = require('express');
const userControllers = require('./../controllers/userController');
const authController = require('./../controllers/authController');



const router = express.Router();

// log in sign up
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout)
// Passwords
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// 👇 Authenticated routes - protects all routes after this point - middleware runs in sequence
// Runs like this .protect -> (authController.protect, authController.updatePassword)
router.use(authController.protect);

router.patch('/updateMyPassword',
  authController.updatePassword,
);

// data update
router.get('/me', userControllers.getMe, userControllers.getUser);
router.patch('/updateMe', 
userControllers.uploadUserPhoto, 
userControllers.resizeUserPhoto,
userControllers.updateMe
);
router.delete('/deleteMe', userControllers.deleteMe);

// Only Admin routes ******
router.use(authController.restrictTo('admin'));
router
  .route('/')
  .get(userControllers.getAllUsers)
  .post(userControllers.createUser);

router
  .route('/:id')
  .get(userControllers.getUser)
  .patch(userControllers.updateUser)
  .delete(userControllers.deleteUser);

module.exports = router;
