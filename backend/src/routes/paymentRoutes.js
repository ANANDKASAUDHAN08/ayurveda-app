const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Create payment order
router.post('/order', paymentController.createOrder);

// Verify payment signature
router.post('/verify', paymentController.verifyPayment);

module.exports = router;
