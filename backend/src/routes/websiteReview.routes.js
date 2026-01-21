const express = require('express');
const router = express.Router();
const websiteReviewController = require('../controllers/websiteReviewController');
const authenticateToken = require('../middleware/auth');

// Submit platform feedback (requires auth)
router.post('/', authenticateToken, websiteReviewController.submitReview);

// Get all website reviews with optional filtering (public)
router.get('/', websiteReviewController.getWebsiteReviews);

// Get overall platform statistics (public)
router.get('/stats', websiteReviewController.getWebsiteStats);

// Get all reviews by a specific user (public)
router.get('/user/:userId', websiteReviewController.getUserReviews);

// Update own review (requires auth)
router.put('/:id', authenticateToken, websiteReviewController.updateReview);

// Delete own review (requires auth)
router.delete('/:id', authenticateToken, websiteReviewController.deleteReview);

module.exports = router;
