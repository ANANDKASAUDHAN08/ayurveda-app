const express = require('express');
const router = express.Router();
const hospitalReviewController = require('../controllers/hospitalReviewController');
const authenticateToken = require('../middleware/auth');

// Submit a new hospital review (requires auth)
router.post('/', authenticateToken, hospitalReviewController.submitReview);

// Get reviews for a specific hospital (public)
router.get('/:hospitalId/:source', hospitalReviewController.getHospitalReviews);

// Get rating statistics for a hospital (public)
router.get('/stats/:hospitalId/:source', hospitalReviewController.getHospitalStats);

// Get all reviews by a specific user (public)
router.get('/user/:userId', hospitalReviewController.getUserReviews);

// Update own review (requires auth)
router.put('/:id', authenticateToken, hospitalReviewController.updateReview);

// Delete own review (requires auth)
router.delete('/:id', authenticateToken, hospitalReviewController.deleteReview);

module.exports = router;
