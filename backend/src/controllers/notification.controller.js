const db = require('../config/database');

class NotificationController {
    /**
     * GET /api/notifications
     * Get user notifications with pagination and filters
     */
    static async getUserNotifications(req, res) {
        try {
            const userId = req.user.id;
            const {
                limit = 20,
                offset = 0,
                category = 'all',
                unreadOnly = 'false',
                type = 'all'
            } = req.query;

            let query = `
        SELECT * FROM notifications
        WHERE (user_id = ? OR broadcast = TRUE)
      `;
            const params = [userId];

            // Filter by category
            if (category && category !== 'all') {
                query += ' AND category = ?';
                params.push(category);
            }

            // Filter by type
            if (type && type !== 'all') {
                query += ' AND type = ?';
                params.push(type);
            }

            // Filter by read status
            if (unreadOnly === 'true') {
                query += ' AND is_read = FALSE';
            }

            const parsedLimit = parseInt(limit) || 20;
            const parsedOffset = parseInt(offset) || 0;

            query += ` ORDER BY created_at DESC LIMIT ${parsedLimit} OFFSET ${parsedOffset}`;

            const [notifications] = await db.query(query, params);

            res.json({
                notifications,
                total: notifications.length
            });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            res.status(500).json({ error: 'Failed to fetch notifications' });
        }
    }

    /**
     * GET /api/notifications/unread-count
     * Get count of unread notifications
     */
    static async getUnreadCount(req, res) {
        try {
            const userId = req.user.id;

            const [result] = await db.query(`
        SELECT COUNT(*) as count
        FROM notifications
        WHERE (user_id = ? OR broadcast = TRUE) AND is_read = FALSE
      `, [userId]);

            res.json({ count: result[0].count });
        } catch (error) {
            console.error('Error getting unread count:', error);
            res.status(500).json({ error: 'Failed to get unread count' });
        }
    }

    /**
     * PUT /api/notifications/:id/read
     * Mark notification as read
     */
    static async markAsRead(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            await db.query(`
        UPDATE notifications
        SET is_read = TRUE, read_at = NOW()
        WHERE id = ? AND (user_id = ? OR broadcast = TRUE)
      `, [id, userId]);

            res.json({ message: 'Notification marked as read' });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            res.status(500).json({ error: 'Failed to mark as read' });
        }
    }

    /**
     * PUT /api/notifications/mark-all-read
     * Mark all notifications as read
     */
    static async markAllAsRead(req, res) {
        try {
            const userId = req.user.id;

            await db.query(`
        UPDATE notifications
        SET is_read = TRUE, read_at = NOW()
        WHERE user_id = ? AND is_read = FALSE
      `, [userId]);

            res.json({ message: 'All notifications marked as read' });
        } catch (error) {
            console.error('Error marking all as read:', error);
            res.status(500).json({ error: 'Failed to mark all as read' });
        }
    }

    /**
     * DELETE /api/notifications/:id
     * Delete a notification
     */
    static async deleteNotification(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            await db.query(`
        DELETE FROM notifications
        WHERE id = ? AND user_id = ?
      `, [id, userId]);

            res.json({ message: 'Notification deleted' });
        } catch (error) {
            console.error('Error deleting notification:', error);
            res.status(500).json({ error: 'Failed to delete notification' });
        }
    }

    /**
     * Helper function to create a notification
     * Called internally by other controllers
     */
    static async createNotification(data) {
        try {
            const {
                user_id,
                type,
                category = 'system',
                title,
                message,
                related_id = null,
                related_type = null,
                action_url = null,
                priority = 'normal',
                broadcast = false
            } = data;

            // If broadcast, user_id can be null
            if (!broadcast && !user_id) {
                throw new Error('user_id is required for non-broadcast notifications');
            }

            const query = `
        INSERT INTO notifications 
        (user_id, type, category, title, message, related_id, related_type, action_url, priority, broadcast)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

            const [result] = await db.query(query, [
                user_id || null,
                type,
                category,
                title,
                message,
                related_id,
                related_type,
                action_url,
                priority,
                broadcast
            ]);

            return result.insertId;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }
}

module.exports = NotificationController;
