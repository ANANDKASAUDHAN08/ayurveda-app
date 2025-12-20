const db = require('../config/database');

exports.getLabTests = async (req, res) => {
    try {
        const { category, search, minPrice, maxPrice, sortBy, page = 1, limit = 12 } = req.query;

        let query = 'SELECT * FROM lab_tests WHERE 1=1';
        const params = [];

        // Category filter
        if (category && category !== 'All') {
            query += ' AND category = ?';
            params.push(category);
        }

        // Search filter
        if (search) {
            query += ' AND (name LIKE ? OR description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        // Price filters
        if (minPrice) {
            query += ' AND discounted_price >= ?';
            params.push(parseInt(minPrice, 10));
        }

        if (maxPrice) {
            query += ' AND discounted_price <= ?';
            params.push(parseInt(maxPrice, 10));
        }

        // Sorting
        if (sortBy === 'price_asc') {
            query += ' ORDER BY discounted_price ASC';
        } else if (sortBy === 'price_desc') {
            query += ' ORDER BY discounted_price DESC';
        } else if (sortBy === 'popular') {
            query += ' ORDER BY is_popular DESC, name ASC';
        } else if (sortBy === 'name_desc') {
            query += ' ORDER BY name DESC';
        } else {
            query += ' ORDER BY name ASC'; // Default: name_asc
        }

        // Get total count for pagination
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const [countResult] = await db.execute(countQuery, params);
        const total = countResult[0].total;

        // Apply pagination - use string concatenation since values are already validated integers
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        // Add LIMIT/OFFSET directly to query (safe since we parsed as integers)
        query += ` LIMIT ${limitNum} OFFSET ${offset}`;

        // Execute main query with only filter params (no LIMIT/OFFSET params)
        const [tests] = await db.execute(query, params);

        res.json({
            success: true,
            data: {
                results: tests,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });
    } catch (error) {
        console.error('Get lab tests error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching lab tests'
        });
    }
};

exports.getLabTestById = async (req, res) => {
    try {
        const [tests] = await db.execute(
            'SELECT * FROM lab_tests WHERE id = ?',
            [req.params.id]
        );

        if (tests.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Lab test not found'
            });
        }

        res.json({
            success: true,
            data: tests[0]
        });
    } catch (error) {
        console.error('Get lab test by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const [categories] = await db.execute(
            'SELECT DISTINCT category FROM lab_tests ORDER BY category'
        );

        res.json({
            success: true,
            data: categories.map(c => c.category)
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
