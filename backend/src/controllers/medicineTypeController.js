const db = require('../config/database');

/**
 * Medicine Type Controller
 * Handles medicine type statistics, user preferences, and type-specific content
 * Aligned with Phase 12: Medicine Type System
 */

/**
 * Get statistics for all medicine types
 * GET /api/medicine-types/stats
 * Returns: doctor count, medicine count, appointment count, content count for each type
 */
exports.getStats = async (req, res) => {
    try {
        const [stats] = await db.execute('SELECT * FROM medicine_type_stats');

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching medicine type stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch medicine type statistics'
        });
    }
};

/**
 * Get user's medicine type preference
 * GET /api/medicine-types/preference
 * Requires auth
 */
exports.getUserPreference = async (req, res) => {
    try {
        const userId = req.user.id;

        const [preferences] = await db.execute(
            'SELECT * FROM user_medicine_preference WHERE user_id = ?',
            [userId]
        );

        if (preferences.length === 0) {
            // Return default if no preference set
            return res.json({
                success: true,
                data: {
                    user_id: userId,
                    preferred_type: 'all',
                    updated_at: null
                }
            });
        }

        res.json({
            success: true,
            data: preferences[0]
        });
    } catch (error) {
        console.error('Error fetching user preference:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch medicine type preference'
        });
    }
};

/**
 * Set user's medicine type preference
 * POST /api/medicine-types/preference
 * Requires auth
 * Body: { preferred_type: 'ayurveda' | 'homeopathy' | 'allopathy' | 'all' }
 */
exports.setUserPreference = async (req, res) => {
    try {
        const userId = req.user.id;
        const { preferred_type } = req.body;

        // Validate preferred_type
        const validTypes = ['ayurveda', 'homeopathy', 'allopathy', 'all'];
        if (!validTypes.includes(preferred_type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid medicine type. Must be: ayurveda, homeopathy, allopathy, or all'
            });
        }

        // Upsert preference (insert or update if exists)
        await db.execute(
            `INSERT INTO user_medicine_preference (user_id, preferred_type)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE preferred_type = ?, updated_at = CURRENT_TIMESTAMP`,
            [userId, preferred_type, preferred_type]
        );

        res.json({
            success: true,
            message: 'Medicine type preference updated successfully',
            data: {
                user_id: userId,
                preferred_type: preferred_type
            }
        });
    } catch (error) {
        console.error('Error setting user preference:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update medicine type preference'
        });
    }
};

/**
 * Get type-specific content
 * GET /api/medicine-types/:type/content
 * Params: type = 'ayurveda' | 'homeopathy' | 'allopathy'
 * Query: content_type (optional), featured (optional), limit (optional)
 */
exports.getContent = async (req, res) => {
    try {
        const { type } = req.params;
        const { content_type, featured, limit = 10 } = req.query;

        // Validate type
        const validTypes = ['ayurveda', 'homeopathy', 'allopathy'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid medicine type. Must be: ayurveda, homeopathy, or allopathy'
            });
        }

        let query = 'SELECT * FROM medicine_type_content WHERE medicine_type = ?';
        const params = [type];

        // Optional filters
        if (content_type) {
            query += ' AND content_type = ?';
            params.push(content_type);
        }

        if (featured === 'true') {
            query += ' AND is_featured = TRUE';
        }

        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(parseInt(limit, 10));

        const [content] = await db.execute(query, params);

        res.json({
            success: true,
            count: content.length,
            data: content
        });
    } catch (error) {
        console.error('Error fetching type-specific content:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch content'
        });
    }
};

/**
 * Get all available medicine types
 * GET /api/medicine-types
 * Returns basic info about each type
 */
exports.getAllTypes = async (req, res) => {
    try {
        // Return static medicine type info
        const types = [
            {
                id: 'ayurveda',
                name: 'Ayurveda',
                description: 'Ancient Indian holistic healing system focusing on balance and natural remedies',
                color: '#10b981',
                icon: '🌿',
                tagline: 'Natural Healing for Body & Mind'
            },
            {
                id: 'homeopathy',
                name: 'Homeopathy',
                description: 'Gentle healing using highly diluted substances based on "like cures like"',
                color: '#8b5cf6',
                icon: '💊',
                tagline: 'Gentle Medicine, Powerful Results'
            },
            {
                id: 'allopathy',
                name: 'Allopathy',
                description: 'Modern evidence-based medicine using pharmaceuticals and surgery',
                color: '#3b82f6',
                icon: '⚕️',
                tagline: 'Science-Based Modern Medicine'
            }
        ];

        res.json({
            success: true,
            data: types
        });
    } catch (error) {
        console.error('Error fetching medicine types:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch medicine types'
        });
    }
};

/**
 * Increment content view count
 * POST /api/medicine-types/content/:id/view
 * Tracks content engagement
 */
exports.incrementContentView = async (req, res) => {
    try {
        const { id } = req.params;

        await db.execute(
            'UPDATE medicine_type_content SET view_count = view_count + 1 WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'View count updated'
        });
    } catch (error) {
        console.error('Error incrementing view count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update view count'
        });
    }
};

module.exports = exports;
