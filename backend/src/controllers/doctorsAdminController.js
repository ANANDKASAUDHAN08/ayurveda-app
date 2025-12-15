const pool = require('../config/database');

// Add new doctor
exports.addDoctor = async (req, res) => {
    try {
        const {
            name, specialization, experience, mode, location, about,
            qualifications, consultationFee, languages, image, phone,
            registration_number, title, clinic_name, clinic_address, clinic_timings
        } = req.body;

        const [result] = await pool.query(`
            INSERT INTO doctors (
                userId, name, specialization, experience, mode, location, about,
                qualifications, consultationFee, languages, image, phone,
                registration_number, title, clinic_name, clinic_address, clinic_timings
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            0, // userId - set to 0 for admin-created doctors
            name, specialization, experience || 0, mode || 'online', location || '',
            about || '', qualifications || '', consultationFee || 0, languages || 'English',
            image || '/assets/images/default-doctor.png', phone || '', registration_number || '',
            title || 'Dr.', clinic_name || '', clinic_address || '', clinic_timings || '9 AM - 5 PM'
        ]);

        res.status(201).json({
            message: 'Doctor added successfully',
            doctorId: result.insertId
        });
    } catch (error) {
        console.error('Error adding doctor:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update doctor
exports.updateDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, specialization, experience, mode, location, about,
            qualifications, consultationFee, languages, image, phone,
            registration_number, title, clinic_name, clinic_address, clinic_timings
        } = req.body;

        await pool.query(`
            UPDATE doctors
            SET name = ?, specialization = ?, experience = ?, mode = ?, location = ?,
                about = ?, qualifications = ?, consultationFee = ?, languages = ?,
                image = ?, phone = ?, registration_number = ?, title = ?,
                clinic_name = ?, clinic_address = ?, clinic_timings = ?, updatedAt = NOW()
            WHERE id = ?
        `, [
            name, specialization, experience, mode, location, about, qualifications,
            consultationFee, languages, image, phone, registration_number, title,
            clinic_name, clinic_address, clinic_timings, id
        ]);

        res.json({ message: 'Doctor updated successfully' });
    } catch (error) {
        console.error('Error updating doctor:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete doctor
exports.deleteDoctor = async (req, res) => {
    try {
        const { id } = req.params;

        // Delete from doctors table
        await pool.query('DELETE FROM doctors WHERE id = ?', [id]);

        res.json({ message: 'Doctor deleted successfully' });
    } catch (error) {
        console.error('Error deleting doctor:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
