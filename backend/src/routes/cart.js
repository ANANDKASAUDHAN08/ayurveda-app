const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/auth');

// All cart routes require authentication
router.use(authMiddleware);

// Get user's cart
router.get('/', cartController.getCart);

// Add item to cart
router.post('/add', cartController.addToCart);

// Update cart item quantity
router.put('/item/:id', cartController.updateQuantity);

// Remove item from cart
router.delete('/item/:id', cartController.removeItem);

// Clear entire cart
router.delete('/clear', cartController.clearCart);

// Get cart count
router.get('/count', cartController.getCartCount);

module.exports = router;
