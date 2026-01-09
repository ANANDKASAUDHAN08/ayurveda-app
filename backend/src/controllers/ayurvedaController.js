const db = require('../config/database');

// ============================================
// AYURVEDA DASHBOARD CONTROLLER
// Medicines, Exercises, and Articles APIs
// ============================================

// Get all Ayurveda Medicines
exports.getMedicines = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;
        const featured = req.query.featured === 'true';
        const q = req.query.q;

        let query = 'SELECT * FROM ayurveda_medicines WHERE 1=1';
        const params = [];

        if (featured) {
            query += ' AND is_bestseller = TRUE';
        }

        if (q) {
            query += ' AND (name LIKE ? OR description LIKE ? OR category LIKE ? OR benefits LIKE ?)';
            params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
        }

        query += ' ORDER BY is_bestseller DESC, created_at DESC LIMIT ?';
        params.push(limit);

        const [medicines] = await db.query(query, params);

        res.json({
            success: true,
            data: medicines
        });
    } catch (error) {
        console.error('Error fetching medicines:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch medicines',
            error: error.message
        });
    }
};

// Get single medicine by ID
exports.getMedicineById = async (req, res) => {
    try {
        const { id } = req.params;
        const [medicine] = await db.query(
            'SELECT * FROM ayurveda_medicines WHERE id = ?',
            [id]
        );

        if (medicine.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Medicine not found'
            });
        }

        res.json({
            success: true,
            data: medicine[0]
        });
    } catch (error) {
        console.error('Error fetching medicine:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch medicine',
            error: error.message
        });
    }
};

// Get all Ayurveda Exercises (Yoga/Pranayama/Meditation)
exports.getExercises = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;
        const type = req.query.type; // yoga, pranayama, meditation
        const q = req.query.q;

        let query = 'SELECT * FROM ayurveda_exercises WHERE 1=1';
        const params = [];

        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }

        if (q) {
            query += ' AND (name LIKE ? OR description LIKE ? OR benefits LIKE ?)';
            params.push(`%${q}%`, `%${q}%`, `%${q}%`);
        }

        query += ' ORDER BY difficulty ASC, created_at DESC LIMIT ?';
        params.push(limit);

        const [exercises] = await db.query(query, params);

        res.json({
            success: true,
            data: exercises
        });
    } catch (error) {
        console.error('Error fetching exercises:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch exercises',
            error: error.message
        });
    }
};

// Get single exercise by ID
exports.getExerciseById = async (req, res) => {
    try {
        const { id } = req.params;
        const [exercise] = await db.query(
            'SELECT * FROM ayurveda_exercises WHERE id = ?',
            [id]
        );

        if (exercise.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Exercise not found'
            });
        }

        res.json({
            success: true,
            data: exercise[0]
        });
    } catch (error) {
        console.error('Error fetching exercise:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch exercise',
            error: error.message
        });
    }
};

// Get all Ayurveda Articles
exports.getArticles = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;
        const category = req.query.category;
        const q = req.query.q;

        let query = 'SELECT * FROM ayurveda_articles WHERE 1=1';
        const params = [];

        if (category && category !== 'All') {
            query += ' AND category = ?';
            params.push(category);
        }

        if (q) {
            query += ' AND (title LIKE ? OR excerpt LIKE ? OR category LIKE ? OR content LIKE ?)';
            params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
        }

        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(limit);

        const [articles] = await db.query(query, params);

        res.json({
            success: true,
            data: articles
        });
    } catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch articles',
            error: error.message
        });
    }
};

// Get single article by ID
exports.getArticleById = async (req, res) => {
    try {
        const { id } = req.params;
        const [article] = await db.query(
            'SELECT * FROM ayurveda_articles WHERE id = ?',
            [id]
        );

        if (article.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Article not found'
            });
        }

        res.json({
            success: true,
            data: article[0]
        });
    } catch (error) {
        console.error('Error fetching article:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch article',
            error: error.message
        });
    }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
    try {
        const [[medicineCount]] = await db.query(
            'SELECT COUNT(*) as count FROM ayurveda_medicines'
        );
        const [[exerciseCount]] = await db.query(
            'SELECT COUNT(*) as count FROM ayurveda_exercises'
        );
        const [[articleCount]] = await db.query(
            'SELECT COUNT(*) as count FROM ayurveda_articles'
        );
        const [[doctorCount]] = await db.query(
            "SELECT COUNT(*) as count FROM doctors WHERE medicine_type = 'ayurveda'"
        );

        res.json({
            success: true,
            data: {
                doctors: doctorCount.count,
                medicines: medicineCount.count,
                exercises: exerciseCount.count,
                articles: articleCount.count
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stats',
            error: error.message
        });
    }
};
// Get all Ayurveda Rituals
exports.getRituals = async (req, res) => {
    try {
        const timeOfDay = req.query.time_of_day;
        let query = 'SELECT * FROM ayurveda_rituals WHERE 1=1';
        const params = [];

        if (timeOfDay) {
            query += ' AND time_of_day = ?';
            params.push(timeOfDay);
        }

        query += ' ORDER BY FIELD(time_of_day, \'Morning\', \'Afternoon\', \'Evening\', \'Night\'), id ASC';

        const [rituals] = await db.query(query, params);

        res.json({
            success: true,
            data: rituals
        });
    } catch (error) {
        console.error('Error fetching rituals:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch rituals',
            error: error.message
        });
    }
};

// Get all Ayurveda Herbs
exports.getHerbs = async (req, res) => {
    try {
        const herbOfMonth = req.query.herb_of_month === 'true';
        const pacify = req.query.pacify;
        const aggravate = req.query.aggravate;
        const q = req.query.q;

        let query = 'SELECT * FROM ayurveda_herbs WHERE 1=1';
        const params = [];

        if (herbOfMonth) {
            query += ' AND is_herb_of_month = TRUE';
        }

        if (pacify) {
            query += ' AND pacify LIKE ?';
            params.push(`%${pacify}%`);
        }

        if (aggravate) {
            query += ' AND aggravate LIKE ?';
            params.push(`%${aggravate}%`);
        }

        if (q) {
            query += ' AND (name LIKE ? OR scientific_name LIKE ? OR description LIKE ? OR preview LIKE ? OR benefits LIKE ?)';
            const searchTerm = `%${q}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY name ASC';

        const [herbs] = await db.query(query, params);

        // Parse JSON strings back to arrays
        const parsedHerbs = herbs.map(h => ({
            ...h,
            link: (h.link && h.link.startsWith('/'))
                ? `https://www.amidhaayurveda.com${h.link}`
                : h.link,
            pacify: h.pacify ? JSON.parse(h.pacify) : [],
            aggravate: h.aggravate ? JSON.parse(h.aggravate) : [],
            rasa: h.rasa ? JSON.parse(h.rasa) : [],
            guna: h.guna ? JSON.parse(h.guna) : [],
            prabhav: h.prabhav ? JSON.parse(h.prabhav) : []
        }));

        res.json({
            success: true,
            data: parsedHerbs
        });
    } catch (error) {
        console.error('Error fetching herbs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch herbs',
            error: error.message
        });
    }
};

// Get all Yoga Poses
exports.getYogaPoses = async (req, res) => {
    try {
        const poseOfWeek = req.query.pose_of_week === 'true';
        let query = 'SELECT * FROM ayurveda_yoga_poses WHERE 1=1';
        const params = [];

        if (poseOfWeek) {
            query += ' AND is_pose_of_week = TRUE';
        }

        query += ' ORDER BY name ASC';

        const [poses] = await db.query(query, params);

        res.json({
            success: true,
            data: poses
        });
    } catch (error) {
        console.error('Error fetching yoga poses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch yoga poses',
            error: error.message
        });
    }
};

// Search Ayurveda Knowledge Base
exports.searchKnowledge = async (req, res) => {
    try {
        const q = req.query.q;
        const limit = parseInt(req.query.limit) || 20;

        let query = 'SELECT * FROM ayurveda_knowledge';
        const params = [];

        if (q) {
            query += ' WHERE disease LIKE ? OR hindi_name LIKE ? OR marathi_name LIKE ? OR symptoms LIKE ? OR herbal_remedies LIKE ? OR ayurvedic_herbs LIKE ?';
            const searchTerm = `%${q}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ' LIMIT ?';
        params.push(limit);

        const [results] = await db.query(query, params);

        res.json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error('Error searching ayurveda knowledge:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search ayurveda knowledge',
            error: error.message
        });
    }
};
