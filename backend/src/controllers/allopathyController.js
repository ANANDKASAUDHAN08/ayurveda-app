const db = require('../config/database');

/**
 * Allopathy Controller
 * Handles clinical features: medical records, diagnostic packages, and pharmacy logic
 */

// Get Dashboard Overview for Allopathy
exports.getDashboardOverview = async (req, res) => {
    try {
        const userId = req.user?.id;

        // Mocking user context if no auth (for demo)
        const effectiveUserId = userId || 1;

        const [[recordsCount]] = await db.execute(
            'SELECT COUNT(*) as count FROM medical_records WHERE user_id = ?',
            [effectiveUserId]
        );

        const [[refillCount]] = await db.execute(
            'SELECT COUNT(*) as count FROM medicines WHERE medicine_type = "allopathy" AND stock < 10'
        );

        res.json({
            success: true,
            data: {
                totalRecords: recordsCount.count,
                pendingRefills: refillCount.count,
                activeProtocols: 4, // Mock
                nextCheckup: '2025-01-15' // Mock
            }
        });
    } catch (error) {
        console.error('Error fetching allopathy dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get Medical Records
exports.getMedicalRecords = async (req, res) => {
    try {
        const userId = req.user?.id || 1;
        const { type, limit = 10 } = req.query;

        let query = 'SELECT * FROM medical_records WHERE user_id = ?';
        const params = [userId];

        if (type && type !== 'all') {
            query += ' AND type = ?';
            params.push(type);
        }

        query += ' ORDER BY record_date DESC LIMIT ?';
        params.push(parseInt(limit));

        const [records] = await db.execute(query, params);

        res.json({
            success: true,
            data: records
        });
    } catch (error) {
        console.error('Error fetching medical records:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get Health Packages (Grouped Tests)
exports.getHealthPackages = async (req, res) => {
    try {
        const [packages] = await db.execute('SELECT * FROM health_packages ORDER BY is_popular DESC');
        res.json({
            success: true,
            data: packages
        });
    } catch (error) {
        console.error('Error fetching health packages:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get Pharmacy Categories & Featured Meds
exports.getPharmacyData = async (req, res) => {
    try {
        const [categories] = await db.execute(
            'SELECT DISTINCT category FROM medicines WHERE medicine_type = "allopathy"'
        );

        const [featured] = await db.execute(
            'SELECT * FROM medicines WHERE medicine_type = "allopathy" LIMIT 6'
        );

        res.json({
            success: true,
            data: {
                categories: categories.map(c => c.category),
                featuredMedicines: featured
            }
        });
    } catch (error) {
        console.error('Error fetching pharmacy data:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get Principles Content (Timeline, Ethics, Pillars)
exports.getPrinciplesContent = async (req, res) => {
    try {
        const [content] = await db.execute(
            'SELECT * FROM medicine_type_content WHERE medicine_type = "allopathy" ORDER BY created_at ASC'
        );

        // Group content for frontend ease
        const grouped = {
            pillars: content.filter(c => c.content_type === 'guide'),
            timeline: content.filter(c => c.content_type === 'article' && c.tags && c.tags.includes('Timeline')),
            ethics: content.filter(c => c.content_type === 'tip' && c.tags && c.tags.includes('Ethics'))
        };

        res.json({
            success: true,
            data: grouped
        });
    } catch (error) {
        console.error('Error fetching allopathy principles:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
