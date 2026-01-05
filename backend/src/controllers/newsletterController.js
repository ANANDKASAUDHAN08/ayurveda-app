const db = require('../config/database');
const crypto = require('crypto');

/**
 * Subscribe to newsletter
 */
exports.subscribe = async (req, res) => {
    try {
        const { email, name } = req.body;

        // Validate email
        if (!email || !isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address.'
            });
        }

        // Validate name
        if (!name || name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Please provide your full name.'
            });
        }

        // Generate unique unsubscribe token
        const unsubscribeToken = crypto.randomBytes(32).toString('hex');

        // Check if email already exists
        const [existingSubscriber] = await db.execute(
            'SELECT * FROM newsletters WHERE email = ?',
            [email]
        );

        if (existingSubscriber.length > 0) {
            // Check if already active
            if (existingSubscriber[0].status === 'active') {
                return res.status(400).json({
                    success: false,
                    message: 'This email is already subscribed to our newsletter.'
                });
            } else {
                // Reactivate subscription
                await db.execute(
                    'UPDATE newsletters SET status = ?, name = ?, subscribed_at = NOW() WHERE email = ?',
                    ['active', name.trim(), email]
                );

                return res.status(200).json({
                    success: true,
                    message: 'Welcome back! Your subscription has been reactivated.'
                });
            }
        }

        // Insert new subscription
        await db.execute(
            'INSERT INTO newsletters (email, name, unsubscribe_token) VALUES (?, ?, ?)',
            [email, name.trim(), unsubscribeToken]
        );

        // Send welcome email (non-blocking)
        try {
            const emailService = require('../services/email.service');
            await emailService.sendNewsletterWelcome(email, name.trim(), unsubscribeToken);
            console.log(`✅ Newsletter welcome email sent to ${email}`);
        } catch (emailError) {
            console.error(`❌ Failed to send newsletter welcome email:`, emailError.message);
            // Don't fail the subscription if email fails
        }

        return res.status(201).json({
            success: true,
            message: `Thank you, ${name.split(' ')[0]}! You've successfully subscribed to our newsletter.`
        });

    } catch (error) {
        console.error('Error subscribing to newsletter:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while subscribing. Please try again later.'
        });
    }
};

/**
 * Unsubscribe from newsletter
 */
exports.unsubscribe = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Invalid unsubscribe token.'
            });
        }

        const [result] = await db.execute(
            'UPDATE newsletters SET status = ? WHERE unsubscribe_token = ? AND status = ?',
            ['unsubscribed', token, 'active']
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found or already unsubscribed.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'You have been successfully unsubscribed from our newsletter.'
        });

    } catch (error) {
        console.error('Error unsubscribing from newsletter:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while unsubscribing. Please try again later.'
        });
    }
};

/**
 * Get all newsletter subscribers (admin only)
 */
exports.getAllSubscribers = async (req, res) => {
    try {
        const { status } = req.query;

        let query = 'SELECT id, email, name, subscribed_at, status FROM newsletters';
        const params = [];

        if (status) {
            query += ' WHERE status = ?';
            params.push(status);
        }

        query += ' ORDER BY subscribed_at DESC';

        const [subscribers] = await db.execute(query, params);

        return res.status(200).json({
            success: true,
            count: subscribers.length,
            data: subscribers
        });

    } catch (error) {
        console.error('Error fetching newsletter subscribers:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching subscribers.'
        });
    }
};

/**
 * Email validation helper
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
