const express = require('express');
const router = express.Router();
const RefillController = require('../controllers/refill.controller');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.post('/prescriptions/:id/refills', authMiddleware, RefillController.requestRefill);
router.get('/refills', authMiddleware, RefillController.getRefills);
router.get('/refills/:id', authMiddleware, RefillController.getRefillById);
router.post('/refills/:id/approve', authMiddleware, RefillController.approveRefill);
router.post('/refills/:id/reject', authMiddleware, RefillController.rejectRefill);

module.exports = router;
