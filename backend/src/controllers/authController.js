const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const emailService = require('../services/email.service');
const { generateVerificationToken, getTokenExpiration } = require('../../utils/tokenGenerator');
const NotificationController = require('./notification.controller');

exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validate email format
        if (!emailService.validateEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Check if user exists
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const userRole = role || 'user';

        // Generate verification token
        const verificationToken = generateVerificationToken();
        const tokenExpiry = getTokenExpiration();

        // Create User with verification token
        const [result] = await db.execute(
            `INSERT INTO users (name, email, password, role, email_verified, email_verification_token, token_expires_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, email, hashedPassword, userRole, false, verificationToken, tokenExpiry]
        );

        const userId = result.insertId;
        const token = jwt.sign({ id: userId, role: userRole }, process.env.JWT_SECRET || 'your-random-secret-key-anand-infinityMan', { expiresIn: '1h' });

        // Send welcome email (non-blocking)
        try {
            await emailService.sendWelcomeEmail(email, name, 'user');
        } catch (emailError) {
            console.error(`❌ Welcome email failed for ${email}:`, emailError.message);
        }

        // Send verification email (non-blocking)
        try {
            await emailService.sendVerificationEmail(email, name, verificationToken, 'user');
        } catch (emailError) {
            console.error(`❌ Verification email failed for ${email}:`, emailError.message);
        }

        // Create welcome notification
        try {
            await NotificationController.createNotification({
                user_id: userId,
                type: 'account_created',
                category: 'security',
                title: 'Welcome to HealthConnect!',
                message: `Hi ${name}, welcome to HealthConnect! We're excited to have you on board. Explore our services and start your health journey with us.`,
                priority: 'normal'
            });
        } catch (notifError) {
            console.error('Failed to create welcome notification:', notifError.message);
        }

        res.json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account before logging in.',
            emailSent: true,
            user: { id: userId, name, email, role: userRole, emailVerified: false, hasPassword: true, oauth_provider: null }
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        // Check if email is verified
        if (!user.email_verified) {
            return res.status(403).json({
                message: 'Please verify your email before logging in. Check your inbox for the verification link.',
                emailVerified: false
            });
        }

        if (!user.password) {
            return res.status(400).json({ message: 'Account is connected via Google. Please login with Google or reset your password to create one.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Check if 2FA is enabled
        if (user.two_factor_enabled) {
            return res.json({
                require2FA: true,
                userId: user.id,
                role: user.role,
                message: 'Two-factor authentication required'
            });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'your-random-secret-key-anand-infinityMan', { expiresIn: '1h' });

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                hasPassword: !!user.password,
                oauth_provider: user.oauth_provider
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !emailService.validateEmail(email)) {
            return res.status(400).json({ message: 'Valid email is required' });
        }

        // Find user
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];

        // Check if already verified
        if (user.email_verified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        // Generate new verification token
        const verificationToken = generateVerificationToken();
        const tokenExpiration = getTokenExpiration();

        // Update user with new token
        await db.execute(
            'UPDATE users SET email_verification_token = ?, token_expires_at = ? WHERE id = ?',
            [verificationToken, tokenExpiration, user.id]
        );

        // Send verification email
        try {
            await emailService.sendVerificationEmail(email, user.name, verificationToken, 'user');
            res.json({ message: 'Verification email sent successfully' });
        } catch (emailError) {
            console.error(`❌ Failed to send verification email:`, emailError.message);
            res.status(500).json({ message: 'Failed to send verification email. Please try again later.' });
        }
    } catch (err) {
        console.error('Resend verification error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Forgot Password - Request password reset
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !emailService.validateEmail(email)) {
            return res.status(400).json({ message: 'Valid email is required' });
        }

        // Find user
        const [users] = await db.execute('SELECT * FROM users WHERE email = ? AND role = ?', [email, 'user']);

        // For security, don't reveal if email exists
        if (users.length === 0) {
            return res.json({ message: 'If an account exists with that email, you will receive a password reset link shortly.' });
        }

        const user = users[0];

        // Generate secure reset token using crypto
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiration = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        // Save reset token to database
        await db.execute(
            'UPDATE users SET reset_password_token = ?, reset_token_expires_at = ? WHERE id = ?',
            [resetToken, tokenExpiration, user.id]
        );

        // Send password reset email
        try {
            await emailService.sendPasswordResetEmail(email, user.name, resetToken, 'user');
        } catch (emailError) {
            console.error(`❌ Failed to send password reset email:`, emailError.message);
        }

        res.json({ message: 'If an account exists with that email, you will receive a password reset link shortly.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Reset Password - Update password with valid token
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Find user with valid token
        const [users] = await db.execute(
            'SELECT * FROM users WHERE reset_password_token = ? AND reset_token_expires_at > NOW()',
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired password reset token' });
        }

        const user = users[0];

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear reset token
        await db.execute(
            'UPDATE users SET password = ?, reset_password_token = NULL, reset_token_expires_at = NULL WHERE id = ?',
            [hashedPassword, user.id]
        );

        // Create password change notification
        try {
            await NotificationController.createNotification({
                user_id: user.id,
                type: 'password_changed',
                category: 'security',
                title: 'Password Changed Successfully',
                message: 'Your password has been changed successfully. If you did not make this change, please contact support immediately.',
                priority: 'high'
            });
        } catch (notifError) {
            console.error('Failed to create password change notification:', notifError.message);
        }

        res.json({ message: 'Password reset successful! You can now login with your new password.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Verify Reset Token - Check if token is valid
exports.verifyResetToken = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ valid: false, message: 'Token is required' });
        }

        // Check if token exists and hasn't expired
        const [users] = await db.execute(
            'SELECT id, name, email FROM users WHERE reset_password_token = ? AND reset_token_expires_at > NOW()',
            [token]
        );

        if (users.length === 0) {
            return res.json({ valid: false, message: 'Invalid or expired token' });
        }

        res.json({ valid: true, user: { name: users[0].name, email: users[0].email } });
    } catch (err) {
        console.error('Verify reset token error:', err);
        res.status(500).json({ valid: false, message: 'Server error' });
    }
};
