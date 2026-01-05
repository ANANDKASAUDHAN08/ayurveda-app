const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

// Public routes
router.post('/subscribe', newsletterController.subscribe);
router.post('/unsubscribe/:token', newsletterController.unsubscribe);

// Admin routes (protected with authentication)
router.get('/subscribers', authenticateToken, authorizeAdmin, newsletterController.getAllSubscribers);

module.exports = router;
