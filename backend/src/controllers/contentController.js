const pool = require('../config/database');

// ==================================
// PUBLIC CONTENT ENDPOINTS
// These are used by the main app to display content
// ==================================

// Get published featured doctors for home page
exports.getFeaturedDoctors = async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT 
        d.id,
        d.name,
        d.specialization as specialty,
        d.experience,
        d.consultationFee,
        d.clinic_name as location,
        d.clinic_address,
        d.image as profile_image,
        fd.display_order
      FROM featured_doctors fd
      JOIN doctors d ON fd.doctor_id = d.id
      WHERE fd.is_active = true
      ORDER BY fd.display_order ASC
      LIMIT 6
    `);
        res.json({ doctors: rows });
    } catch (error) {
        console.error('Error fetching featured doctors:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get published health articles for home page
exports.getHealthArticles = async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT id, title, excerpt, image_url, author, category, created_at
      FROM health_articles
      WHERE is_published = true
      ORDER BY created_at DESC
      LIMIT 6
    `);
        res.json({ articles: rows });
    } catch (error) {
        console.error('Error fetching health articles:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single article by ID
exports.getArticleById = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await pool.query(`
      SELECT * FROM health_articles
      WHERE id = ? AND is_published = true
    `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Article not found' });
        }

        res.json({ article: rows[0] });
    } catch (error) {
        console.error('Error fetching article:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get active hospitals
exports.getHospitals = async (req, res) => {
    const { city, search } = req.query;

    try {
        let query = 'SELECT * FROM hospitals WHERE is_active = true';
        const params = [];

        if (city) {
            query += ' AND city = ?';
            params.push(city);
        }

        if (search) {
            query += ' AND (name LIKE ? OR specialties LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY rating DESC';

        const [rows] = await pool.query(query, params);
        res.json({ hospitals: rows });
    } catch (error) {
        console.error('Error fetching hospitals:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get active pharmacies
exports.getPharmacies = async (req, res) => {
    const { city, is_24x7, delivery_available } = req.query;

    try {
        let query = 'SELECT * FROM pharmacies WHERE is_active = true';
        const params = [];

        if (city) {
            query += ' AND city = ?';
            params.push(city);
        }

        if (is_24x7 === 'true') {
            query += ' AND is_24x7 = true';
        }

        if (delivery_available === 'true') {
            query += ' AND delivery_available = true';
        }

        query += ' ORDER BY rating DESC';

        const [rows] = await pool.query(query, params);
        res.json({ pharmacies: rows });
    } catch (error) {
        console.error('Error fetching pharmacies:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get static page by slug
exports.getStaticPage = async (req, res) => {
    const { slug } = req.params;

    try {
        const [rows] = await pool.query(`
      SELECT * FROM static_pages WHERE slug = ? AND is_published = true
    `, [slug]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Page not found' });
        }

        const page = rows[0];

        // Parse JSON sections if they exist
        if (page.sections) {
            try {
                page.sections = JSON.parse(page.sections);
            } catch (e) {
                page.sections = null;
            }
        }

        res.json({ page });
    } catch (error) {
        console.error('Error fetching static page:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
