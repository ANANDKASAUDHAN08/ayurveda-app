const express = require('express');
const router = express.Router();
const ShareController = require('../controllers/share.controller');
const authMiddleware = require('../middleware/auth');

// Public route - no auth required
router.get('/share/rx/:token', ShareController.accessSharedPrescription);

// Protected routes
router.post('/prescriptions/:id/share', authMiddleware, ShareController.createShareLink);
router.get('/prescriptions/:id/shares', authMiddleware, ShareController.getUserShares);
router.delete('/prescriptions/shares/:shareId', authMiddleware, ShareController.revokeShare);

module.exports = router;
