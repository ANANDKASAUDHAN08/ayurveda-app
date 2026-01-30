const express = require('express');
const router = express.Router();
const pharmacyReviewController = require('../controllers/pharmacyReviewController');
const authenticateToken = require('../middleware/auth');

// Submit a new pharmacy review (requires auth)
router.post('/', authenticateToken, pharmacyReviewController.submitReview);

// Get reviews for a specific pharmacy (public)
router.get('/:pharmacyId', pharmacyReviewController.getPharmacyReviews);

// Get rating statistics for a pharmacy (public)
router.get('/stats/:pharmacyId', pharmacyReviewController.getPharmacyStats);

// Update own review (requires auth)
router.put('/:id', authenticateToken, pharmacyReviewController.updateReview);

// Delete own review (requires auth)
router.delete('/:id', authenticateToken, pharmacyReviewController.deleteReview);

module.exports = router;
