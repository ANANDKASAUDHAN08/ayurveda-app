const db = require('../config/database');
const { isTokenExpired } = require('../../utils/tokenGenerator');

/**
 * Verify email with token
 */
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const { type } = req.query; // 'user' or 'doctor'

        // Find user by token (both users and doctors use users table for email)
        const [users] = await db.execute(
            `SELECT * FROM users WHERE email_verification_token = ?`,
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification link'
            });
        }

        const user = users[0];

        // Check if already verified
        if (user.email_verified) {
            return res.json({
                success: true,
                message: 'Email already verified!',
                alreadyVerified: true
            });
        }

        // Check if token expired
        if (isTokenExpired(user.token_expires_at)) {
            return res.status(400).json({
                success: false,
                message: 'Verification link has expired. Please request a new one.',
                expired: true
            });
        }

        // Mark as verified
        await db.execute(
            `UPDATE users 
             SET email_verified = ?, 
                 email_verification_token = NULL, 
                 token_expires_at = NULL 
             WHERE id = ?`,
            [true, user.id]
        );

        res.json({
            success: true,
            message: 'Email verified successfully! You can now access all features.',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                emailVerified: true
            }
        });

    } catch (err) {
        console.error('Verification error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
