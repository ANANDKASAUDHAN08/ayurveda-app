const db = require('../config/database');
const { generateOTP, getOTPExpiration, isOTPExpired } = require('../../utils/otpGenerator');
const { validatePhone } = require('../../utils/phoneValidator');
const { sendOTP: sendSMS } = require('../../services/sms.service');

/**
 * Send OTP to phone number
 */
exports.sendOTP = async (req, res) => {
    try {
        const { phone, userId, name } = req.body;

        if (!phone || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and user ID are required'
            });
        }

        // Validate phone number
        const validation = validatePhone(phone);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.error || 'Invalid phone number format'
            });
        }

        // Check if phone already verified
        const [users] = await db.execute(
            'SELECT phone_verified FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (users[0]?.phone_verified) {
            return res.json({
                success: true,
                message: 'Phone number already verified',
                alreadyVerified: true
            });
        }

        // Rate limiting: Check if OTP was sent recently (within last 60 seconds)
        const [recent] = await db.execute(
            `SELECT otp_expires_at FROM users 
       WHERE id = ? AND otp_expires_at > NOW()`,
            [userId]
        );

        if (recent.length > 0) {
            const expiresAt = new Date(recent[0].otp_expires_at);
            const timeLeft = Math.ceil((expiresAt - new Date()) / 1000);

            // If more than 4 minutes left, it was sent less than 1 minute ago
            if (timeLeft > 240) {
                const waitTime = 300 - timeLeft;
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${60 - waitTime} seconds before requesting a new OTP`,
                    retryAfter: 60 - waitTime
                });
            }
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpiry = getOTPExpiration();

        // Store OTP in database
        await db.execute(
            `UPDATE users 
       SET phone = ?, otp_code = ?, otp_expires_at = ?, otp_attempts = 0 
       WHERE id = ?`,
            [validation.formatted, otp, otpExpiry, userId]
        );

        // Send SMS (mock version logs to console)
        try {
            const smsResult = await sendSMS(validation.formatted, otp, name || 'User');

            res.json({
                success: true,
                message: 'OTP sent successfully',
                phone: validation.formatted,
                // For development: include OTP in response (REMOVE in production!)
                developmentOTP: process.env.NODE_ENV === 'development' ? otp : undefined
            });
        } catch (smsError) {
            console.error('SMS sending failed:', smsError);
            res.status(500).json({
                success: false,
                message: 'Failed to send OTP. Please try again.'
            });
        }

    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * Verify OTP code
 */
exports.verifyOTP = async (req, res) => {
    try {
        const { userId, otp } = req.body;

        if (!userId || !otp) {
            return res.status(400).json({
                success: false,
                message: 'User ID and OTP code are required'
            });
        }

        // Get user OTP data
        const [users] = await db.execute(
            'SELECT otp_code, otp_expires_at, otp_attempts, phone FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        // Check if OTP exists
        if (!user.otp_code) {
            return res.status(400).json({
                success: false,
                message: 'No OTP found. Please request a new one.'
            });
        }

        // Check if OTP expired
        if (isOTPExpired(user.otp_expires_at)) {
            // Clear expired OTP
            await db.execute(
                'UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE id = ?',
                [userId]
            );

            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one.',
                expired: true
            });
        }

        // Check attempt limit
        if (user.otp_attempts >= 3) {
            // Clear OTP after too many attempts
            await db.execute(
                'UPDATE users SET otp_code = NULL, otp_expires_at = NULL, otp_attempts = 0 WHERE id = ?',
                [userId]
            );

            return res.status(400).json({
                success: false,
                message: 'Too many failed attempts. Please request a new OTP.',
                tooManyAttempts: true
            });
        }

        // Verify OTP
        if (user.otp_code !== otp.trim()) {
            // Increment attempts
            await db.execute(
                'UPDATE users SET otp_attempts = otp_attempts + 1 WHERE id = ?',
                [userId]
            );

            const attemptsLeft = 2 - user.otp_attempts;
            return res.status(400).json({
                success: false,
                message: `Invalid OTP code. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`,
                attemptsLeft: attemptsLeft
            });
        }

        // OTP is valid - mark phone as verified and clear OTP
        await db.execute(
            `UPDATE users 
       SET phone_verified = ?, 
           otp_code = NULL, 
           otp_expires_at = NULL,
           otp_attempts = 0 
       WHERE id = ?`,
            [true, userId]
        );

        res.json({
            success: true,
            message: 'Phone number verified successfully!',
            phone: user.phone
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
