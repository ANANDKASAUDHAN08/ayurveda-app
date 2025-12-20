const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const orderController = require('../controllers/orderController');

// All routes require authentication
router.use(authenticateToken);

// Place order (checkout)
router.post('/', orderController.placeOrder);

// Get user's orders
router.get('/', orderController.getUserOrders);

// Get single order details
router.get('/:orderId', orderController.getOrderDetails);

// Cancel order
router.put('/:orderId/cancel', orderController.cancelOrder);

// Update order status (admin only - future)
router.put('/:orderId/status', orderController.updateOrderStatus);

// Get order tracking info
router.get('/:orderId/tracking', orderController.getOrderTracking);

// Simulation route
router.post('/:orderId/tracking/simulate', orderController.simulateDriverMovement);

module.exports = router;
