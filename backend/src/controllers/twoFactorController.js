const { authenticator } = require('otplib');
const qrcode = require('qrcode');
const db = require('../config/database');
const jwt = require('jsonwebtoken');

exports.setup2FA = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role; // 'user' or 'doctor'
        const table = role === 'doctor' ? 'doctors' : 'users';

        // Get user details for label
        const [users] = await db.execute(`SELECT email FROM ${table} WHERE id = ?`, [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userEmail = users[0].email;

        // Generate a new secret
        const secret = authenticator.generateSecret();

        // Save temporary secret to database
        await db.execute(`UPDATE ${table} SET two_factor_temp_secret = ? WHERE id = ?`, [secret, userId]);

        // Generate QR code URL
        const serviceName = 'HealthConnect';
        const otpauth = authenticator.keyuri(userEmail, serviceName, secret);
        const qrCodeUrl = await qrcode.toDataURL(otpauth);

        res.json({
            secret,
            qrCodeUrl,
            message: 'Scan this QR code with your authenticator app'
        });
    } catch (err) {
        console.error('2FA Setup Error:', err);
        res.status(500).json({ message: 'Server error during 2FA setup' });
    }
};

exports.verify2FASetup = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const { code } = req.body;
        const table = role === 'doctor' ? 'doctors' : 'users';

        if (!code) {
            return res.status(400).json({ message: 'Verification code is required' });
        }

        // Get temporary secret
        const [users] = await db.execute(`SELECT two_factor_temp_secret FROM ${table} WHERE id = ?`, [userId]);
        if (users.length === 0 || !users[0].two_factor_temp_secret) {
            return res.status(400).json({ message: '2FA setup not initiated' });
        }

        const tempSecret = users[0].two_factor_temp_secret;

        // Verify code
        const isValid = authenticator.check(code, tempSecret);
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        // Enable 2FA: move temp secret to permanent secret
        await db.execute(
            `UPDATE ${table} SET two_factor_secret = ?, two_factor_enabled = 1, two_factor_temp_secret = NULL WHERE id = ?`,
            [tempSecret, userId]
        );

        res.json({ success: true, message: '2FA enabled successfully' });
    } catch (err) {
        console.error('2FA Verify Setup Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.disable2FA = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const table = role === 'doctor' ? 'doctors' : 'users';

        await db.execute(
            `UPDATE ${table} SET two_factor_secret = NULL, two_factor_enabled = 0, two_factor_temp_secret = NULL WHERE id = ?`,
            [userId]
        );

        res.json({ success: true, message: '2FA disabled successfully' });
    } catch (err) {
        console.error('2FA Disable Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.verify2FALogin = async (req, res) => {
    try {
        const { userId, role, code } = req.body;
        const table = role === 'doctor' ? 'doctors' : 'users';

        if (!userId || !role || !code) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Get user details
        const [users] = await db.execute(`SELECT * FROM ${table} WHERE id = ?`, [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];
        if (!user.two_factor_enabled || !user.two_factor_secret) {
            return res.status(400).json({ message: '2FA is not enabled for this account' });
        }

        // Verify code
        const isValid = authenticator.check(code, user.two_factor_secret);
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        // If valid, generate full token
        const token = jwt.sign(
            { id: user.id, role: user.role || role },
            process.env.JWT_SECRET || 'your-random-secret-key-anand-infinityMan',
            { expiresIn: '1h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role || role,
                hasPassword: !!user.password,
                oauth_provider: user.oauth_provider
            }
        });
    } catch (err) {
        console.error('2FA Login Verification Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
