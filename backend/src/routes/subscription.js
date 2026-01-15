const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const auth = require('../middleware/auth');

/**
 * Subscription Routes
 * Handle freemium subscription management with Razorpay
 */

// Get pricing plans (public)
router.get('/pricing', subscriptionController.getPricing);

// Create subscription (protected)
router.post('/create', auth, subscriptionController.createSubscription);

// Confirm subscription payment (webhook/callback)
router.post('/confirm', auth, subscriptionController.confirmSubscription);

// Get current subscription (protected)
router.get('/current', auth, subscriptionController.getCurrentSubscription);

// Cancel subscription (protected)
router.post('/cancel', auth, subscriptionController.cancelSubscription);

// Get subscription history (protected)
router.get('/history', auth, subscriptionController.getHistory);

// Invoice routes (protected)
router.get('/invoices', auth, subscriptionController.getInvoices);
router.get('/invoices/:id/download', auth, subscriptionController.downloadInvoice);

module.exports = router;
