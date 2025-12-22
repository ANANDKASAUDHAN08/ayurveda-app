const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authenticateToken = require('../middleware/auth');

// All settings routes require authentication
router.use(authenticateToken);

// Get user settings
router.get('/', settingsController.getUserSettings);

// Update user settings
router.put('/', settingsController.updateUserSettings);

module.exports = router;