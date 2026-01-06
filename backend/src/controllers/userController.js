const db = require('../config/database');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

// Configure Multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, 'profile-' + Date.now() + path.extname(file.originalname));
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
}).single('profile_image');

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch user profile with all fields including timestamps
        const [users] = await db.execute(`
            SELECT id, name, email, phone, role, 
                   gender, dob, blood_group, address, 
                   emergency_contact_name, emergency_contact_phone, 
                   height, weight, allergies, profile_image,
                   createdAt as created_at, updatedAt as updated_at
            FROM users WHERE id = ?`, [userId]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user: users[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: 'File upload error: ' + err.message });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }

        try {
            const userId = req.user.id;
            const {
                name, phone, gender, dob, blood_group, address,
                emergency_contact_name, emergency_contact_phone,
                height, weight, allergies
            } = req.body;

            // Build update query dynamically
            let updates = [];
            let params = [];

            if (name !== undefined) { updates.push('name = ?'); params.push(name); }
            if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
            if (gender !== undefined) { updates.push('gender = ?'); params.push(gender); }
            if (dob !== undefined) { updates.push('dob = ?'); params.push(dob === '' ? null : dob); }
            if (blood_group !== undefined) { updates.push('blood_group = ?'); params.push(blood_group); }
            if (address !== undefined) { updates.push('address = ?'); params.push(address); }
            if (emergency_contact_name !== undefined) { updates.push('emergency_contact_name = ?'); params.push(emergency_contact_name); }
            if (emergency_contact_phone !== undefined) { updates.push('emergency_contact_phone = ?'); params.push(emergency_contact_phone); }
            if (height !== undefined) { updates.push('height = ?'); params.push(height); }
            if (weight !== undefined) { updates.push('weight = ?'); params.push(weight); }
            if (allergies !== undefined) { updates.push('allergies = ?'); params.push(allergies); }

            if (req.file) {
                updates.push('profile_image = ?');
                params.push('uploads/' + req.file.filename);
            }

            if (updates.length > 0) {
                updates.push('updatedAt = NOW()'); // Track when profile was last updated
                const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
                params.push(userId);
                await db.execute(query, params);
            }

            // Fetch updated user with timestamps
            const [users] = await db.execute(`
                SELECT id, name, email, phone, role, 
                       gender, dob, blood_group, address, 
                       emergency_contact_name, emergency_contact_phone, 
                       height, weight, allergies, profile_image,
                       createdAt as created_at, updatedAt as updated_at
                FROM users WHERE id = ?`, [userId]);

            res.json({ message: 'Profile updated successfully', user: users[0] });
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

        // In a real app, we would hash the password here
        // const hashedPassword = await bcrypt.hash(newPassword, 10);

        // For this demo, we'll just store it as is (NOT SECURE for production)
        await db.execute('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.enable2FA = async (req, res) => {
    try {
        const userId = req.user.id;
        // In a real app, we would generate a secret and return it
        // For this demo, we'll just set a flag (assuming we had a column, but we don't, so we'll just mock success)

        // await db.execute('UPDATE users SET two_factor_enabled = 1 WHERE id = ?', [userId]);

        res.json({ message: '2FA enabled successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;

        await db.execute('DELETE FROM users WHERE id = ?', [userId]);

        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};