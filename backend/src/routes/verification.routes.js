const express = require('express');
const router = express.Router();
const VerificationController = require('../controllers/verification.controller');
const authMiddleware = require('../middleware/auth');

// Public routes - no authentication required
router.get('/verify/:verificationCode', VerificationController.verifyPrescription);
router.post('/verify/:verificationCode/dispense', VerificationController.dispensePrescription);

// Protected routes - authentication required
router.get('/:id/verification-history', authMiddleware, VerificationController.getVerificationHistory);

module.exports = router;
