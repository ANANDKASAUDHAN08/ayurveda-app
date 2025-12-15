const pool = require('../config/database');

// ==================================
// FEATURED DOCTORS MANAGEMENT
// ==================================

// Get all featured doctors (for admin panel)
exports.getFeaturedDoctors = async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT 
        fd.*,
        d.name as doctor_name,
        d.specialization,
        d.experience,
        d.consultationFee
      FROM featured_doctors fd
      JOIN doctors d ON fd.doctor_id = d.id
      ORDER BY fd.display_order ASC
    `);
        res.json({ featuredDoctors: rows });
    } catch (error) {
        console.error('Error fetching featured doctors:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add new featured doctor
exports.addFeaturedDoctor = async (req, res) => {
    const { doctor_id, display_order } = req.body;

    if (!doctor_id) {
        return res.status(400).json({ message: 'Doctor ID is required' });
    }

    try {
        const [result] = await pool.query(`
      INSERT INTO featured_doctors (doctor_id, display_order, is_active)
      VALUES (?, ?, true)
    `, [doctor_id, display_order || 0]);

        res.status(201).json({
            message: 'Featured doctor added successfully',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error adding featured doctor:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update featured doctor
exports.updateFeaturedDoctor = async (req, res) => {
    const { id } = req.params;
    const { doctor_id, display_order, is_active } = req.body;

    try {
        await pool.query(`
      UPDATE featured_doctors
      SET doctor_id = ?, display_order = ?, is_active = ?
      WHERE id = ?
    `, [doctor_id, display_order, is_active, id]);

        res.json({ message: 'Featured doctor updated successfully' });
    } catch (error) {
        console.error('Error updating featured doctor:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete featured doctor
exports.deleteFeaturedDoctor = async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM featured_doctors WHERE id = ?', [id]);
        res.json({ message: 'Featured doctor removed successfully' });
    } catch (error) {
        console.error('Error deleting featured doctor:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================================
// HEALTH ARTICLES MANAGEMENT
// ==================================

// Get all health articles
exports.getHealthArticles = async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT * FROM health_articles
      ORDER BY created_at DESC
    `);
        res.json({ articles: rows });
    } catch (error) {
        console.error('Error fetching health articles:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add new health article
exports.addHealthArticle = async (req, res) => {
    const { title, excerpt, content, image_url, author, category, is_published } = req.body;

    try {
        const [result] = await pool.query(`
      INSERT INTO health_articles (title, excerpt, content, image_url, author, category, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [title, excerpt, content, image_url, author, category, is_published || false]);

        res.status(201).json({
            message: 'Health article added successfully',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error adding health article:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update health article
exports.updateHealthArticle = async (req, res) => {
    const { id } = req.params;
    const { title, excerpt, content, image_url, author, category, is_published } = req.body;

    try {
        await pool.query(`
      UPDATE health_articles
      SET title = ?, excerpt = ?, content = ?, image_url = ?, author = ?, category = ?, is_published = ?
      WHERE id = ?
    `, [title, excerpt, content, image_url, author, category, is_published, id]);

        res.json({ message: 'Health article updated successfully' });
    } catch (error) {
        console.error('Error updating health article:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete health article
exports.deleteHealthArticle = async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM health_articles WHERE id = ?', [id]);
        res.json({ message: 'Health article deleted successfully' });
    } catch (error) {
        console.error('Error deleting health article:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================================
// HOSPITALS MANAGEMENT
// ==================================

// Get all hospitals
exports.getHospitals = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM hospitals ORDER BY name ASC');
        res.json({ hospitals: rows });
    } catch (error) {
        console.error('Error fetching hospitals:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add new hospital
exports.addHospital = async (req, res) => {
    const { name, address, city, state, pincode, phone, email, specialties, facilities, rating, image_url, is_active } = req.body;

    try {
        const [result] = await pool.query(`
      INSERT INTO hospitals (name, address, city, state, pincode, phone, email, specialties, facilities, rating, image_url, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, address, city, state, pincode, phone, email, specialties, facilities, rating || 0, image_url, is_active !== false]);

        res.status(201).json({
            message: 'Hospital added successfully',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error adding hospital:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update hospital
exports.updateHospital = async (req, res) => {
    const { id } = req.params;
    const { name, address, city, state, pincode, phone, email, specialties, facilities, rating, image_url, is_active } = req.body;

    try {
        await pool.query(`
      UPDATE hospitals
      SET name = ?, address = ?, city = ?, state = ?, pincode = ?, phone = ?, email = ?, specialties = ?, facilities = ?, rating = ?, image_url = ?, is_active = ?
      WHERE id = ?
    `, [name, address, city, state, pincode, phone, email, specialties, facilities, rating, image_url, is_active, id]);

        res.json({ message: 'Hospital updated successfully' });
    } catch (error) {
        console.error('Error updating hospital:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete hospital
exports.deleteHospital = async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM hospitals WHERE id = ?', [id]);
        res.json({ message: 'Hospital deleted successfully' });
    } catch (error) {
        console.error('Error deleting hospital:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================================
// PHARMACIES MANAGEMENT
// ==================================

// Get all pharmacies
exports.getPharmacies = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM pharmacies ORDER BY name ASC');
        res.json({ pharmacies: rows });
    } catch (error) {
        console.error('Error fetching pharmacies:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add new pharmacy
exports.addPharmacy = async (req, res) => {
    const { name, address, city, phone, is_24x7, delivery_available, rating, is_active } = req.body;

    try {
        const [result] = await pool.query(`
      INSERT INTO pharmacies (name, address, city, phone, is_24x7, delivery_available, rating, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, address, city, phone, is_24x7 || false, delivery_available || false, rating || 0, is_active !== false]);

        res.status(201).json({
            message: 'Pharmacy added successfully',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error adding pharmacy:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update pharmacy
exports.updatePharmacy = async (req, res) => {
    const { id } = req.params;
    const { name, address, city, phone, is_24x7, delivery_available, rating, is_active } = req.body;

    try {
        await pool.query(`
      UPDATE pharmacies
      SET name = ?, address = ?, city = ?, phone = ?, is_24x7 = ?, delivery_available = ?, rating = ?, is_active = ?
      WHERE id = ?
    `, [name, address, city, phone, is_24x7, delivery_available, rating, is_active, id]);

        res.json({ message: 'Pharmacy updated successfully' });
    } catch (error) {
        console.error('Error updating pharmacy:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete pharmacy
exports.deletePharmacy = async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM pharmacies WHERE id = ?', [id]);
        res.json({ message: 'Pharmacy deleted successfully' });
    } catch (error) {
        console.error('Error deleting pharmacy:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================================
// STATIC PAGES MANAGEMENT
// ==================================

// Get all static pages
exports.getStaticPages = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM static_pages ORDER BY slug ASC');

        // Parse JSON sections for each page
        rows.forEach(page => {
            if (page.sections) {
                try {
                    page.sections = JSON.parse(page.sections);
                } catch (e) {
                    page.sections = null;
                }
            }
        });

        res.json({ pages: rows });
    } catch (error) {
        console.error('Error fetching static pages:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update static page
exports.updateStaticPage = async (req, res) => {
    const { id } = req.params;
    const { title, content, meta_description, sections, effective_date, version, is_published } = req.body;

    try {
        // Convert sections array to JSON string if provided
        const sectionsJson = sections ? JSON.stringify(sections) : null;

        await pool.query(`
      UPDATE static_pages
      SET title = ?, 
          content = ?, 
          meta_description = ?,
          sections = ?,
          effective_date = ?,
          version = ?,
          is_published = ?,
          updated_at = NOW()
      WHERE id = ?
    `, [title, content, meta_description, sectionsJson, effective_date, version, is_published, id]);

        res.json({ message: 'Static page updated successfully' });
    } catch (error) {
        console.error('Error updating static page:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================================
// DOCTORS MANAGEMENT
// ==================================

// Add new doctor
exports.addDoctor = async (req, res) => {
    try {
        const {
            name, specialization, experience, mode, location, about,
            qualifications, consultationFee, languages, image, phone,
            registration_number, title, clinic_name, clinic_address, clinic_timings,
            email, password // Add email and password to request body
        } = req.body;

        // 1. Create User Account first
        // Default email if not provided (generated from name)
        const userEmail = email || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
        // Default password if not provided
        const userPassword = password || 'Doctor@123';

        // Check if user exists
        const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [userEmail]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userPassword, salt);

        const [userResult] = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, userEmail, hashedPassword, 'doctor']
        );

        const userId = userResult.insertId;

        // 2. Create Doctor Profile linked to the new user
        const [result] = await pool.query(`
            INSERT INTO doctors (
                userId, name, specialization, experience, mode, location, about,
                qualifications, consultationFee, languages, image, phone,
                registration_number, title, clinic_name, clinic_address, clinic_timings
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            userId, // Use the real userId
            name, specialization, experience || 0, mode || 'online', location || '',
            about || '', qualifications || '', consultationFee || 0, languages || 'English',
            image || '/assets/images/default-doctor.png', phone || '', registration_number || '',
            title || 'Dr.', clinic_name || '', clinic_address || '', clinic_timings || '9 AM - 5 PM'
        ]);

        res.status(201).json({
            message: 'Doctor added successfully',
            doctorId: result.insertId,
            userId: userId,
            email: userEmail,
            tempPassword: userPassword
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
