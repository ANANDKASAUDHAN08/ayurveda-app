const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const NotificationController = require('../controllers/notification.controller');

// All routes require authentication
router.use(authMiddleware);

// Get user notifications
router.get('/', NotificationController.getUserNotifications);

// Get unread count
router.get('/unread-count', NotificationController.getUnreadCount);

// Mark as read
router.put('/:id/read', NotificationController.markAsRead);

// Mark all as read
router.put('/mark-all-read', NotificationController.markAllAsRead);

// Delete notification
router.delete('/:id', NotificationController.deleteNotification);

module.exports = router;
