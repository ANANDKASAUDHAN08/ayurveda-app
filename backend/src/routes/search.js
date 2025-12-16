const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Search products
router.get('/products', searchController.searchProducts);

// Get autocomplete suggestions
router.get('/suggestions', searchController.getSuggestions);

// Get popular searches
router.get('/popular', searchController.getPopularSearches);

// Track search (for analytics)
router.post('/track', searchController.trackSearch);

module.exports = router;