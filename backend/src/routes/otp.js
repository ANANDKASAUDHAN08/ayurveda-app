const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');

// Send OTP to phone number
router.post('/send-otp', otpController.sendOTP);

// Verify OTP code
router.post('/verify-otp', otpController.verifyOTP);

module.exports = router;
