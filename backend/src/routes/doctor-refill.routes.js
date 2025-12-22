const express = require('express');
const router = express.Router();
const DoctorRefillController = require('../controllers/doctor-refill.controller');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.get('/refills', authMiddleware, DoctorRefillController.getDoctorRefills);
router.get('/refills/stats', authMiddleware, DoctorRefillController.getRefillStats);
router.get('/refills/:id/details', authMiddleware, DoctorRefillController.getRefillDetails);
router.post('/refills/bulk-approve', authMiddleware, DoctorRefillController.bulkApproveRefills);
router.post('/refills/bulk-reject', authMiddleware, DoctorRefillController.bulkRejectRefills);

module.exports = router;
