const express = require('express');
const router = express.Router();
const {
  registerUser,
  verifyOTP,
  loginUser,
  forgotPassword,
  resetPassword,
  loginEmployee,
  registerEmployee
} = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Employee Auth
router.post('/employee/login', loginEmployee);
router.post('/employee/register', protect, restrictTo('Admin'), registerEmployee);

module.exports = router;
