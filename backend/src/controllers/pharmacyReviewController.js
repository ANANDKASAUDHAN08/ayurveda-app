const db = require('../config/database');

// Submit a new pharmacy review
exports.submitReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { pharmacy_id, rating, title, comment } = req.body;

        if (!pharmacy_id || !rating || !comment) {
            return res.status(400).json({
                success: false,
                message: 'Pharmacy ID, rating, and comment are required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        const [existing] = await db.execute(
            'SELECT id FROM pharmacy_reviews WHERE user_id = ? AND pharmacy_id = ?',
            [userId, pharmacy_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this pharmacy.'
            });
        }

        const [result] = await db.execute(
            `INSERT INTO pharmacy_reviews (user_id, pharmacy_id, rating, title, comment)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, pharmacy_id, rating, title || null, comment]
        );

        const [reviews] = await db.execute(
            `SELECT pr.*, u.name as user_name
             FROM pharmacy_reviews pr
             JOIN users u ON pr.user_id = u.id
             WHERE pr.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: reviews[0]
        });

    } catch (error) {
        console.error('Submit pharmacy review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit review',
            error: error.message
        });
    }
};

// Get reviews for a specific pharmacy
exports.getPharmacyReviews = async (req, res) => {
    try {
        const { pharmacyId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const parsedLimit = parseInt(limit) || 10;
        const parsedPage = parseInt(page) || 1;
        const parsedOffset = (parsedPage - 1) * parsedLimit;

        const [countResult] = await db.execute(
            'SELECT COUNT(*) as total FROM pharmacy_reviews WHERE pharmacy_id = ?',
            [pharmacyId]
        );
        const total = countResult[0].total;

        const [reviews] = await db.execute(
            `SELECT pr.*, u.name as user_name
             FROM pharmacy_reviews pr
             LEFT JOIN users u ON pr.user_id = u.id
             WHERE pr.pharmacy_id = ?
             ORDER BY pr.created_at DESC
             LIMIT ${parsedLimit} OFFSET ${parsedOffset}`,
            [pharmacyId]
        );

        res.json({
            success: true,
            data: reviews,
            pagination: {
                total,
                page: parsedPage,
                limit: parsedLimit,
                totalPages: Math.ceil(total / parsedLimit)
            }
        });

    } catch (error) {
        console.error('Get pharmacy reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews',
            error: error.message
        });
    }
};

// Get rating statistics for a pharmacy
exports.getPharmacyStats = async (req, res) => {
    try {
        const { pharmacyId } = req.params;

        const [stats] = await db.execute(
            `SELECT 
                ROUND(AVG(rating), 1) as averageRating,
                COUNT(*) as totalReviews
             FROM pharmacy_reviews
             WHERE pharmacy_id = ?`,
            [pharmacyId]
        );

        const [distribution] = await db.execute(
            `SELECT 
                rating,
                COUNT(*) as count
             FROM pharmacy_reviews
             WHERE pharmacy_id = ?
             GROUP BY rating
             ORDER BY rating DESC`,
            [pharmacyId]
        );

        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        distribution.forEach(item => {
            ratingDistribution[item.rating] = item.count;
        });

        res.json({
            success: true,
            data: {
                averageRating: stats[0].averageRating || 0,
                totalReviews: stats[0].totalReviews || 0,
                ratingDistribution
            }
        });

    } catch (error) {
        console.error('Get pharmacy stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message
        });
    }
};

// Update user's own review
exports.updateReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { rating, title, comment } = req.body;

        const [existing] = await db.execute(
            'SELECT * FROM pharmacy_reviews WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found or you do not have permission'
            });
        }

        const updates = [];
        const params = [];

        if (rating !== undefined) {
            updates.push('rating = ?');
            params.push(rating);
        }
        if (title !== undefined) {
            updates.push('title = ?');
            params.push(title || null);
        }
        if (comment !== undefined) {
            updates.push('comment = ?');
            params.push(comment);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        params.push(id);
        await db.execute(
            `UPDATE pharmacy_reviews SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        const [updated] = await db.execute(
            `SELECT pr.*, u.name as user_name
             FROM pharmacy_reviews pr
             JOIN users u ON pr.user_id = u.id
             WHERE pr.id = ?`,
            [id]
        );

        res.json({
            success: true,
            message: 'Review updated successfully',
            data: updated[0]
        });

    } catch (error) {
        console.error('Update pharmacy review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update review',
            error: error.message
        });
    }
};

// Delete user's own review
exports.deleteReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const [existing] = await db.execute(
            'SELECT * FROM pharmacy_reviews WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found or you do not have permission'
            });
        }

        await db.execute('DELETE FROM pharmacy_reviews WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });

    } catch (error) {
        console.error('Delete pharmacy review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review',
            error: error.message
        });
    }
};
