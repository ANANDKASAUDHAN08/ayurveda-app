const express = require('express');
const router = express.Router();
const morbidityController = require('../controllers/morbidityController');
const { authGuard } = require('../middleware/authMiddleware');

// Public routes for browsing/searching
router.get('/search', morbidityController.searchCodes);
router.get('/:id', morbidityController.getCodeById);
router.get('/', morbidityController.getAllCodes);

module.exports = router;
