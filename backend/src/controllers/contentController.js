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

// Get active hospitals (NABH and Specialty only for listing)
exports.getHospitals = async (req, res) => {
    const { city, state, search, specialty, category, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        // Build the combined query with ratings from hospital_reviews
        let baseQuery = `
            SELECT 
                n.id, 
                n.name, 
                n.address, 
                NULL as city, 
                n.state, 
                NULL as pincode, 
                n.contact as phone, 
                NULL as email, 
                n.website, 
                n.category as type, 
                n.specialties, 
                NULL as facilities, 
                COALESCE(r.avg_rating, 0) as rating,
                COALESCE(r.review_count, 0) as review_count,
                'NABH' as data_source
            FROM nabh_hospitals n
            LEFT JOIN (
                SELECT hospital_id, hospital_source, 
                       ROUND(AVG(rating), 1) as avg_rating,
                       COUNT(*) as review_count
                FROM hospital_reviews 
                WHERE hospital_source = 'nabh_hospitals'
                GROUP BY hospital_id, hospital_source
            ) r ON n.id = r.hospital_id
            WHERE 1=1
            
            UNION ALL
            
            SELECT 
                h.id, 
                h.hospital_name as name, 
                h.address, 
                h.city, 
                h.state, 
                h.pincode, 
                NULL as phone, 
                h.email, 
                h.website, 
                h.hospital_type as type, 
                h.specialties, 
                h.facilities, 
                COALESCE(r.avg_rating, 0) as rating,
                COALESCE(r.review_count, 0) as review_count,
                'Specialty' as data_source
            FROM hospitals_with_specialties h
            LEFT JOIN (
                SELECT hospital_id, hospital_source, 
                       ROUND(AVG(rating), 1) as avg_rating,
                       COUNT(*) as review_count
                FROM hospital_reviews 
                WHERE hospital_source = 'hospitals_with_specialties'
                GROUP BY hospital_id, hospital_source
            ) r ON h.id = r.hospital_id
            WHERE 1=1
        `;

        // Wrap the UNION in a subquery for filtering and pagination
        let query = `SELECT * FROM (${baseQuery}) as combined WHERE 1=1`;
        const params = [];

        if (city) {
            query += ' AND city LIKE ?';
            params.push(`%${city}%`);
        }

        if (state) {
            query += ' AND state LIKE ?';
            params.push(`%${state}%`);
        }

        if (search) {
            query += ' AND (name LIKE ? OR specialties LIKE ? OR address LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (specialty) {
            query += ' AND specialties LIKE ?';
            params.push(`%${specialty}%`);
        }

        if (category) {
            if (category === 'NABH') {
                query += " AND data_source = 'NABH'";
            } else if (category === 'Specialty') {
                query += " AND data_source = 'Specialty'";
            }
        }

        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered`;
        const [countResult] = await pool.query(countQuery, params);
        const total = countResult[0].total;

        // Add sorting and pagination
        query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [rows] = await pool.query(query, params);

        res.json({
            hospitals: rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
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

// Get unique cities, states, and specialties for filters
exports.getHospitalFilters = async (req, res) => {
    try {
        const [states] = await pool.query("SELECT DISTINCT state FROM (SELECT state FROM nabh_hospitals UNION SELECT state FROM hospitals_with_specialties) as combined WHERE state IS NOT NULL AND state != '' ORDER BY state");

        // Extract unique specialties from both tables
        const [nabhSpec] = await pool.query('SELECT specialties FROM nabh_hospitals WHERE specialties IS NOT NULL');
        const [otherSpec] = await pool.query('SELECT specialties FROM hospitals_with_specialties WHERE specialties IS NOT NULL');

        const specialtySet = new Set();
        nabhSpec.forEach(row => {
            if (row.specialties) {
                try {
                    const specs = Array.isArray(row.specialties) ? row.specialties : JSON.parse(row.specialties);
                    if (Array.isArray(specs)) specs.forEach(s => specialtySet.add(s));
                } catch (e) {
                    if (typeof row.specialties === 'string') {
                        row.specialties.split(',').forEach(s => specialtySet.add(s.trim()));
                    }
                }
            }
        });

        otherSpec.forEach(row => {
            if (row.specialties) {
                row.specialties.split(',').forEach(s => specialtySet.add(s.trim()));
            }
        });

        res.json({
            states: states.map(s => s.state),
            specialties: Array.from(specialtySet).filter(s => s && s.length > 2).sort()
        });
    } catch (error) {
        console.error('Error fetching hospital filters:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get Specialty Encyclopedia data
exports.getSpecialtyEncyclopedia = async (req, res) => {
    try {
        const fs = require('fs').promises;
        const path = require('path');
        const dataPath = path.join(__dirname, '../../data/specialties/specialty_encyclopedia.json');

        const data = await fs.readFile(dataPath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error fetching specialty encyclopedia:', error);
        res.status(500).json({ message: 'Server error loading encyclopedia' });
    }
};
