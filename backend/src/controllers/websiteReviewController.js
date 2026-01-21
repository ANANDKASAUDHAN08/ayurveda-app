const db = require('../config/database');

// Submit platform feedback
exports.submitReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { rating, title, comment, category, page_url } = req.body;

        // Validation
        if (!rating || !comment || !category) {
            return res.status(400).json({
                success: false,
                message: 'Rating, comment, and category are required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        if (comment.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Comment must be at least 10 characters long'
            });
        }

        const validCategories = ['general', 'ui_ux', 'features', 'performance', 'suggestion', 'bug_report'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category'
            });
        }

        // Insert review
        const [result] = await db.execute(
            `INSERT INTO website_reviews (user_id, rating, title, comment, category, page_url)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, rating, title || null, comment, category, page_url || null]
        );

        // Fetch the created review with user info
        const [reviews] = await db.execute(
            `SELECT wr.*, u.name as user_name
             FROM website_reviews wr
             JOIN users u ON wr.user_id = u.id
             WHERE wr.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully. Thank you for helping us improve!',
            data: reviews[0]
        });

    } catch (error) {
        console.error('Submit website review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit feedback',
            error: error.message
        });
    }
};

// Get all website reviews with filtering
exports.getWebsiteReviews = async (req, res) => {
    try {
        const { page = 1, limit = 10, category, minRating } = req.query;

        const parsedLimit = parseInt(limit) || 10;
        const parsedPage = parseInt(page) || 1;
        const parsedOffset = (parsedPage - 1) * parsedLimit;

        // Build query with filters
        let whereClause = '1=1';
        const params = [];

        if (category) {
            whereClause += ' AND wr.category = ?';
            params.push(category);
        }

        if (minRating) {
            whereClause += ' AND wr.rating >= ?';
            params.push(parseInt(minRating));
        }

        // Get total count
        const [countResult] = await db.execute(
            `SELECT COUNT(*) as total FROM website_reviews wr WHERE ${whereClause}`,
            params
        );
        const total = countResult[0].total;

        // Get reviews with user info
        const [reviews] = await db.execute(
            `SELECT wr.*, u.name as user_name
             FROM website_reviews wr
             LEFT JOIN users u ON wr.user_id = u.id
             WHERE ${whereClause}
             ORDER BY wr.created_at DESC
             LIMIT ${parsedLimit} OFFSET ${parsedOffset}`,
            params
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
        console.error('Get website reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews',
            error: error.message
        });
    }
};

// Get overall platform statistics
exports.getWebsiteStats = async (req, res) => {
    try {
        // Get average rating and total count
        const [stats] = await db.execute(
            `SELECT 
                ROUND(AVG(rating), 1) as averageRating,
                COUNT(*) as totalReviews
             FROM website_reviews`
        );

        // Get rating distribution
        const [distribution] = await db.execute(
            `SELECT 
                rating,
                COUNT(*) as count
             FROM website_reviews
             GROUP BY rating
             ORDER BY rating DESC`
        );

        // Get category distribution
        const [categories] = await db.execute(
            `SELECT 
                category,
                COUNT(*) as count
             FROM website_reviews
             GROUP BY category
             ORDER BY count DESC`
        );

        // Format distributions
        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        distribution.forEach(item => {
            ratingDistribution[item.rating] = item.count;
        });

        const categoryDistribution = {};
        categories.forEach(item => {
            categoryDistribution[item.category] = item.count;
        });

        res.json({
            success: true,
            data: {
                averageRating: stats[0].averageRating || 0,
                totalReviews: stats[0].totalReviews || 0,
                ratingDistribution,
                categoryDistribution
            }
        });

    } catch (error) {
        console.error('Get website stats error:', error);
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
        const { rating, title, comment, category } = req.body;

        // Check if review exists and belongs to user
        const [existing] = await db.execute(
            'SELECT * FROM website_reviews WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found or you do not have permission to edit it'
            });
        }

        // Validation
        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        if (comment && comment.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Comment must be at least 10 characters long'
            });
        }

        if (category) {
            const validCategories = ['general', 'ui_ux', 'features', 'performance', 'suggestion', 'bug_report'];
            if (!validCategories.includes(category)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category'
                });
            }
        }

        // Build update query
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
        if (category !== undefined) {
            updates.push('category = ?');
            params.push(category);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        params.push(id);
        await db.execute(
            `UPDATE website_reviews SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        // Fetch updated review
        const [updated] = await db.execute(
            `SELECT wr.*, u.name as user_name
             FROM website_reviews wr
             JOIN users u ON wr.user_id = u.id
             WHERE wr.id = ?`,
            [id]
        );

        res.json({
            success: true,
            message: 'Feedback updated successfully',
            data: updated[0]
        });

    } catch (error) {
        console.error('Update website review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update feedback',
            error: error.message
        });
    }
};

// Delete user's own review
exports.deleteReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Check if review exists and belongs to user
        const [existing] = await db.execute(
            'SELECT * FROM website_reviews WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found or you do not have permission to delete it'
            });
        }

        await db.execute('DELETE FROM website_reviews WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Feedback deleted successfully'
        });

    } catch (error) {
        console.error('Delete website review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete feedback',
            error: error.message
        });
    }
};

// Get all reviews by a specific user
exports.getUserReviews = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const parsedLimit = parseInt(limit) || 10;
        const parsedPage = parseInt(page) || 1;
        const parsedOffset = (parsedPage - 1) * parsedLimit;

        // Get total count
        const [countResult] = await db.execute(
            'SELECT COUNT(*) as total FROM website_reviews WHERE user_id = ?',
            [userId]
        );
        const total = countResult[0].total;

        // Get reviews
        const [reviews] = await db.execute(
            `SELECT wr.*, u.name as user_name
             FROM website_reviews wr
             LEFT JOIN users u ON wr.user_id = u.id
             WHERE wr.user_id = ?
             ORDER BY wr.created_at DESC
             LIMIT ${parsedLimit} OFFSET ${parsedOffset}`,
            [userId]
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
        console.error('Get user website reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user reviews',
            error: error.message
        });
    }
};
