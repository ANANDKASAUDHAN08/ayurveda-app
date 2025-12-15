const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');

// Public content endpoints - no authentication required

// Featured doctors for home page
router.get('/featured-doctors', contentController.getFeaturedDoctors);

// Health articles
router.get('/health-articles', contentController.getHealthArticles);
router.get('/health-articles/:id', contentController.getArticleById);

// Hospitals
router.get('/hospitals', contentController.getHospitals);

// Pharmacies
router.get('/pharmacies', contentController.getPharmacies);

// Static pages (policy pages)
router.get('/page/:slug', contentController.getStaticPage);

module.exports = router;
