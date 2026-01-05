const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const emailService = require('../services/email.service');
const { generateVerificationToken, getTokenExpiration } = require('../../utils/tokenGenerator');

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

        res.json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account before logging in.',
            emailSent: true,
            user: { id: userId, name, email, role: userRole, emailVerified: false }
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

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'your-random-secret-key-anand-infinityMan', { expiresIn: '1h' });

        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
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
