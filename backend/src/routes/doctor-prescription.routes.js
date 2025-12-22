const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const doctorPrescriptionController = require('../controllers/doctor-prescription.controller');

// All routes require authentication
router.use(authMiddleware);

// Get unverified prescriptions
router.get('/prescriptions/unverified', doctorPrescriptionController.getUnverifiedPrescriptions);

// Get prescription details for verification
router.get('/prescriptions/:id/verify-details', doctorPrescriptionController.getPrescriptionDetails);

// Verify prescription
router.post('/prescriptions/:id/verify', doctorPrescriptionController.verifyPrescription);

// Reject prescription verification
router.post('/prescriptions/:id/reject-verification', doctorPrescriptionController.rejectVerification);

module.exports = router;
