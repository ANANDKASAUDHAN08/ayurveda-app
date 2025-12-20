const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');

// Verify email with token
router.get('/verify-email/:token', verificationController.verifyEmail);

module.exports = router;
