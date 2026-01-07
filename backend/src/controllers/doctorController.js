const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const emailService = require('../services/email.service');
const { generateVerificationToken, getTokenExpiration } = require('../../utils/tokenGenerator');

// Configure Multer for image upload (Same as userController)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, 'doctor-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
}).single('profile_image'); // Frontend sends 'profile_image' key

exports.registerDoctor = async (req, res) => {
    try {
        const { name, email, password } = req.body;

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

        // Generate verification token
        const verificationToken = generateVerificationToken();
        const tokenExpiry = getTokenExpiration();

        // Create User with verification token
        const [userResult] = await db.execute(
            `INSERT INTO users (name, email, password, role, email_verified, email_verification_token, token_expires_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, email, hashedPassword, 'doctor', false, verificationToken, tokenExpiry]
        );
        const userId = userResult.insertId;

        // Create Doctor Profile
        const [doctorResult] = await db.execute(
            `INSERT INTO doctors (userId, name, specialization, mode, experience, about, qualifications, consultationFee, languages, image) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, name, null, 'both', 0, null, null, 500, 'English, Hindi', null]
        );
        const doctorId = doctorResult.insertId;

        // Generate Token
        const token = jwt.sign({ id: userId, role: 'doctor' }, process.env.JWT_SECRET || 'your-random-secret-key-anand-infinityMan', { expiresIn: '1h' });

        // Send welcome email (non-blocking)
        try {
            await emailService.sendWelcomeEmail(email, name, 'doctor');
        } catch (emailError) {
            console.error(`❌ Welcome email failed for ${email}:`, emailError.message);
        }

        // Send verification email (non-blocking)
        try {
            await emailService.sendVerificationEmail(email, name, verificationToken, 'doctor');
        } catch (emailError) {
            console.error(`❌ Verification email failed for ${email}:`, emailError.message);
        }

        res.json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account before logging in.',
            emailSent: true,
            user: { id: userId, name, email, role: 'doctor', emailVerified: false, hasPassword: true, oauth_provider: null },
            doctor: { id: doctorId, userId, name }
        });

    } catch (err) {
        console.error('Doctor registration error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getDoctors = async (req, res) => {
    try {
        const { specialization, mode, search, maxFee, minExperience, medicine_type } = req.query;

        let query = 'SELECT * FROM doctors WHERE 1=1';
        const params = [];

        // NEW: Medicine Type Filter (optional, backward compatible)
        if (medicine_type && ['ayurveda', 'homeopathy', 'allopathy'].includes(medicine_type)) {
            query += ' AND medicine_type = ?';
            params.push(medicine_type);
        }

        if (specialization) {
            // Handle both string and array for specialization
            const specialties = Array.isArray(specialization) ? specialization : specialization.split(',');
            if (specialties.length > 0) {
                const placeholders = specialties.map(() => '?').join(',');
                query += ` AND specialization IN (${placeholders})`;
                params.push(...specialties);
            }
        }

        if (mode && mode !== 'both') {
            query += ' AND (mode = ? OR mode = "both")';
            params.push(mode);
        }

        if (search) {
            query += ' AND name LIKE ?';
            params.push(`%${search}%`);
        }

        if (maxFee) {
            query += ' AND consultationFee <= ?';
            params.push(parseInt(maxFee, 10));
        }

        if (minExperience) {
            query += ' AND experience >= ?';
            params.push(parseInt(minExperience, 10));
        }

        const [doctors] = await db.execute(query, params);
        res.json(doctors);
    } catch (err) {
        console.error('getDoctors error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getDoctorById = async (req, res) => {
    try {
        const [doctors] = await db.execute('SELECT * FROM doctors WHERE id = ?', [req.params.id]);

        if (doctors.length === 0) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        res.json(doctors[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch doctor profile joined with user data
        const [doctors] = await db.execute(`
            SELECT d.*, u.email, u.role, u.oauth_provider, u.two_factor_enabled,
                   (u.password IS NOT NULL AND u.password != '') as hasPassword,
                   u.createdAt as user_created_at
            FROM doctors d
            JOIN users u ON d.userId = u.id
            WHERE d.userId = ?`, [userId]);

        if (doctors.length === 0) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        res.json({ doctor: doctors[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateDoctorProfile = async (req, res) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: 'File upload error: ' + err.message });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }

        try {
            const userId = req.user.id;

            const {
                specialization, mode, experience,
                about, qualifications, consultationFee, languages, phone,
                registration_number, title, awards, clinic_name, clinic_address,
                clinic_timings, website, linkedin
            } = req.body;

            // Check if doctor exists
            const [doctors] = await db.execute('SELECT * FROM doctors WHERE userId = ?', [userId]);

            if (doctors.length === 0) {
                return res.status(404).json({ message: 'Doctor profile not found' });
            }

            const doctorId = doctors[0].id;

            // Build update query dynamically
            let updates = [];
            let params = [];

            if (specialization !== undefined) { updates.push('specialization = ?'); params.push(specialization); }
            if (mode !== undefined) { updates.push('mode = ?'); params.push(mode); }
            if (experience !== undefined) { updates.push('experience = ?'); params.push(experience); }
            if (about !== undefined) { updates.push('about = ?'); params.push(about); }
            if (qualifications !== undefined) { updates.push('qualifications = ?'); params.push(qualifications); }
            if (consultationFee !== undefined) { updates.push('consultationFee = ?'); params.push(consultationFee); }
            if (languages !== undefined) { updates.push('languages = ?'); params.push(languages); }
            if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }

            // New fields
            if (registration_number !== undefined) { updates.push('registration_number = ?'); params.push(registration_number); }
            if (title !== undefined) { updates.push('title = ?'); params.push(title); }
            if (awards !== undefined) { updates.push('awards = ?'); params.push(awards); }
            if (clinic_name !== undefined) { updates.push('clinic_name = ?'); params.push(clinic_name); }
            if (clinic_address !== undefined) { updates.push('clinic_address = ?'); params.push(clinic_address); }
            if (clinic_timings !== undefined) { updates.push('clinic_timings = ?'); params.push(clinic_timings); }
            if (website !== undefined) { updates.push('website = ?'); params.push(website); }
            if (linkedin !== undefined) { updates.push('linkedin = ?'); params.push(linkedin); }

            if (req.file) {
                updates.push('image = ?');
                params.push('uploads/' + req.file.filename);
            }

            if (updates.length > 0) {
                const query = `UPDATE doctors SET ${updates.join(', ')} WHERE id = ?`;
                params.push(doctorId);
                await db.execute(query, params);
            }

            // Fetch updated doctor profile joined with user data
            const [updatedDoctors] = await db.execute(`
                SELECT d.*, u.email, u.role, u.oauth_provider, u.two_factor_enabled,
                       (u.password IS NOT NULL AND u.password != '') as hasPassword,
                       u.createdAt as user_created_at
                FROM doctors d
                JOIN users u ON d.userId = u.id
                WHERE d.id = ?`, [doctorId]);

            const doctor = updatedDoctors[0];

            // Auto-verify if profile is complete (required fields filled)
            const isProfileComplete =
                doctor.specialization &&
                doctor.experience !== null &&
                doctor.qualifications &&
                doctor.consultationFee &&
                doctor.languages;

            if (isProfileComplete && !doctor.isVerified) {
                await db.execute('UPDATE doctors SET isVerified = TRUE WHERE id = ?', [doctorId]);
                // Fetch again to get updated verification status
                const [verifiedDoctors] = await db.execute(`
                    SELECT d.*, u.email, u.role, u.oauth_provider, u.two_factor_enabled,
                           (u.password IS NOT NULL AND u.password != '') as hasPassword,
                           u.createdAt as user_created_at
                    FROM doctors d
                    JOIN users u ON d.userId = u.id
                    WHERE d.id = ?`, [doctorId]);
                res.json({
                    message: 'Profile updated and verified successfully!',
                    doctor: verifiedDoctors[0]
                });
            } else {
                res.json({ message: 'Profile updated successfully', doctor: doctor });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    });
};

exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Properly hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.enable2FA = async (req, res) => {
    try {
        // Mock 2FA enable
        res.json({ message: '2FA enabled successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;

        // Delete from doctors table first (foreign key constraint)
        await db.execute('DELETE FROM doctors WHERE userId = ?', [userId]);

        // Delete from users table
        await db.execute('DELETE FROM users WHERE id = ?', [userId]);

        res.json({ message: 'Doctor account deleted successfully' });
    } catch (err) {
        console.error(err);
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
        const [users] = await db.execute('SELECT * FROM users WHERE email = ? AND role = ?', [email, 'doctor']);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Doctor not found' });
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
            await emailService.sendVerificationEmail(email, user.name, verificationToken, 'doctor');
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

// ... (keeping all existing doctor controller code)

// Forgot Password - Request password reset
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !emailService.validateEmail(email)) {
            return res.status(400).json({ message: 'Valid email is required' });
        }

        // Find doctor (users with role='doctor')
        const [users] = await db.execute('SELECT * FROM users WHERE email = ? AND role = ?', [email, 'doctor']);

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
            await emailService.sendPasswordResetEmail(email, user.name, resetToken, 'doctor');
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

        // Find doctor with valid token
        const [users] = await db.execute(
            'SELECT * FROM users WHERE reset_password_token = ? AND reset_token_expires_at > NOW() AND role = ?',
            [token, 'doctor']
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

        // Check if token exists and hasn't expired for a doctor
        const [users] = await db.execute(
            'SELECT id, name, email FROM users WHERE reset_password_token = ? AND reset_token_expires_at > NOW() AND role = ?',
            [token, 'doctor']
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
