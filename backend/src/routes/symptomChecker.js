const express = require('express');
const router = express.Router();
const symptomCheckerController = require('../controllers/symptomCheckerController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.get('/symptoms', symptomCheckerController.getAvailableSymptoms);

// Protected routes (require authentication)
router.post('/check-symptoms', authenticateToken, symptomCheckerController.checkSymptoms);
router.post('/get-treatment', authenticateToken, symptomCheckerController.getTreatment);
router.post('/full-diagnosis', authenticateToken, symptomCheckerController.getDiagnosisAndTreatment);
router.get('/history', authenticateToken, symptomCheckerController.getHistory);
router.get('/history/:id', authenticateToken, symptomCheckerController.getHistoryDetail);

module.exports = router;
