const express = require('express');
const router = express.Router();
const allopathyController = require('../controllers/allopathyController');
const auth = require('../middleware/auth');

// Dashboard & Stats
router.get('/stats', auth, allopathyController.getDashboardOverview);

// Medical Records
router.get('/records', auth, allopathyController.getMedicalRecords);

// Diagnostic Packages
router.get('/diagnostic/packages', allopathyController.getHealthPackages);

// Pharmacy Overview
router.get('/pharmacy/overview', allopathyController.getPharmacyData);

// Principles & Clinical Pillars
router.get('/principles', allopathyController.getPrinciplesContent);

module.exports = router;
