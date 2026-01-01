const express = require('express');
const router = express.Router();
const medicineTypeController = require('../controllers/medicineTypeController');
const auth = require('../middleware/auth');

// Get all medicine types (static information)
router.get('/', medicineTypeController.getAllTypes);

// Get statistics for all medicine types
router.get('/stats', medicineTypeController.getStats);

// User preference routes (require authentication)
router.get('/preference', auth, medicineTypeController.getUserPreference);
router.post('/preference', auth, medicineTypeController.setUserPreference);

// Get type-specific content
// Example: GET /api/medicine-types/ayurveda/content?featured=true&limit=5
router.get('/:type/content', medicineTypeController.getContent);

// Increment content view count
router.post('/content/:id/view', medicineTypeController.incrementContentView);

module.exports = router;
