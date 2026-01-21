const db = require('../config/database');

// Submit a new hospital review
exports.submitReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { hospital_id, hospital_source, rating, title, comment, aspects } = req.body;

        // Validation
        if (!hospital_id || !hospital_source || !rating || !comment) {
            return res.status(400).json({
                success: false,
                message: 'Hospital ID, source, rating, and comment are required'
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

        const validSources = ['hospitals', 'nabh_hospitals', 'hospitals_with_specialties', 'health_centres'];
        if (!validSources.includes(hospital_source)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid hospital source'
            });
        }

        // Check if user already reviewed this hospital
        const [existing] = await db.execute(
            'SELECT id FROM hospital_reviews WHERE user_id = ? AND hospital_id = ? AND hospital_source = ?',
            [userId, hospital_id, hospital_source]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this hospital. Please edit your existing review instead.'
            });
        }

        // Insert review
        const aspectsJson = aspects ? JSON.stringify(aspects) : null;
        const [result] = await db.execute(
            `INSERT INTO hospital_reviews (user_id, hospital_id, hospital_source, rating, title, comment, aspects)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, hospital_id, hospital_source, rating, title || null, comment, aspectsJson]
        );

        // Fetch the created review with user info
        const [reviews] = await db.execute(
            `SELECT hr.*, u.name as user_name
             FROM hospital_reviews hr
             JOIN users u ON hr.user_id = u.id
             WHERE hr.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: reviews[0]
        });

    } catch (error) {
        console.error('Submit hospital review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit review',
            error: error.message
        });
    }
};

// Get reviews for a specific hospital
exports.getHospitalReviews = async (req, res) => {
    try {
        const { hospitalId, source } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const parsedLimit = parseInt(limit) || 10;
        const parsedPage = parseInt(page) || 1;
        const parsedOffset = (parsedPage - 1) * parsedLimit;

        // Get total count
        const [countResult] = await db.execute(
            'SELECT COUNT(*) as total FROM hospital_reviews WHERE hospital_id = ? AND hospital_source = ?',
            [hospitalId, source]
        );
        const total = countResult[0].total;

        // Get reviews with user info
        const [reviews] = await db.execute(
            `SELECT hr.*, u.name as user_name
             FROM hospital_reviews hr
             LEFT JOIN users u ON hr.user_id = u.id
             WHERE hr.hospital_id = ? AND hr.hospital_source = ?
             ORDER BY hr.created_at DESC
             LIMIT ${parsedLimit} OFFSET ${parsedOffset}`,
            [hospitalId, source]
        );

        // MySQL already returns JSON as parsed objects, no need to parse
        const reviewsWithParsedAspects = reviews.map(review => ({
            ...review,
            aspects: review.aspects || null
        }));

        res.json({
            success: true,
            data: reviewsWithParsedAspects,
            pagination: {
                total,
                page: parsedPage,
                limit: parsedLimit,
                totalPages: Math.ceil(total / parsedLimit)
            }
        });

    } catch (error) {
        console.error('Get hospital reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews',
            error: error.message
        });
    }
};

// Get rating statistics for a hospital
exports.getHospitalStats = async (req, res) => {
    try {
        const { hospitalId, source } = req.params;

        // Get average rating and total count
        const [stats] = await db.execute(
            `SELECT 
                ROUND(AVG(rating), 1) as averageRating,
                COUNT(*) as totalReviews
             FROM hospital_reviews
             WHERE hospital_id = ? AND hospital_source = ?`,
            [hospitalId, source]
        );

        // Get rating distribution
        const [distribution] = await db.execute(
            `SELECT 
                rating,
                COUNT(*) as count
             FROM hospital_reviews
             WHERE hospital_id = ? AND hospital_source = ?
             GROUP BY rating
             ORDER BY rating DESC`,
            [hospitalId, source]
        );

        // Format distribution as object
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
        console.error('Get hospital stats error:', error);
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
        const { rating, title, comment, aspects } = req.body;

        // Check if review exists and belongs to user
        const [existing] = await db.execute(
            'SELECT * FROM hospital_reviews WHERE id = ? AND user_id = ?',
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
        if (aspects !== undefined) {
            updates.push('aspects = ?');
            params.push(aspects ? JSON.stringify(aspects) : null);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        params.push(id);
        await db.execute(
            `UPDATE hospital_reviews SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        // Fetch updated review
        const [updated] = await db.execute(
            `SELECT hr.*, u.name as user_name
             FROM hospital_reviews hr
             JOIN users u ON hr.user_id = u.id
             WHERE hr.id = ?`,
            [id]
        );

        res.json({
            success: true,
            message: 'Review updated successfully',
            data: {
                ...updated[0],
                aspects: updated[0].aspects || null
            }
        });

    } catch (error) {
        console.error('Update hospital review error:', error);
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

        // Check if review exists and belongs to user
        const [existing] = await db.execute(
            'SELECT * FROM hospital_reviews WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found or you do not have permission to delete it'
            });
        }

        await db.execute('DELETE FROM hospital_reviews WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });

    } catch (error) {
        console.error('Delete hospital review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review',
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
            'SELECT COUNT(*) as total FROM hospital_reviews WHERE user_id = ?',
            [userId]
        );
        const total = countResult[0].total;

        // Get reviews
        const [reviews] = await db.execute(
            `SELECT hr.*, u.name as user_name
             FROM hospital_reviews hr
             LEFT JOIN users u ON hr.user_id = u.id
             WHERE hr.user_id = ?
             ORDER BY hr.created_at DESC
             LIMIT ${parsedLimit} OFFSET ${parsedOffset}`,
            [userId]
        );

        const reviewsWithParsedAspects = reviews.map(review => ({
            ...review,
            aspects: review.aspects || null
        }));

        res.json({
            success: true,
            data: reviewsWithParsedAspects,
            pagination: {
                total,
                page: parsedPage,
                limit: parsedLimit,
                totalPages: Math.ceil(total / parsedLimit)
            }
        });

    } catch (error) {
        console.error('Get user hospital reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user reviews',
            error: error.message
        });
    }
};
