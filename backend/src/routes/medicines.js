const express = require('express');
const router = express.Router();
const medicinesController = require('../controllers/medicinesController');

// All endpoints relative to /api/medicines
router.get('/', medicinesController.getMedicines);
router.get('/suggestions', medicinesController.getSuggestions);
router.get('/categories', medicinesController.getCategories);
router.get('/manufacturers', medicinesController.getManufacturers);

module.exports = router;
