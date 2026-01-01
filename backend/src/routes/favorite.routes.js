const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const auth = require('../middleware/auth');

// All favorite routes are protected
router.post('/toggle', auth, favoriteController.toggleFavorite);
router.get('/', auth, favoriteController.getFavorites);
router.get('/check/:itemType/:itemId', auth, favoriteController.isFavorite);

module.exports = router;
