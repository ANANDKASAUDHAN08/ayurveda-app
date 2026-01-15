const db = require('../config/database');

/**
 * Medicines Controller
 * Dedicated controller for the Medicines Discovery Page
 */

// Search/Filter medicines for the medicine page
exports.getMedicines = async (req, res) => {
    try {
        const mysql = require('mysql2');
        const q = req.query.q || '';
        const category = req.query.category || '';
        const medicineSystem = req.query.medicineSystem || 'all';
        const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
        const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
        const sortBy = req.query.sortBy || 'name_asc';
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;

        let whereConditions = ['1=1'];

        // Text search
        if (q) {
            const searchPattern = mysql.escape(`%${q}%`);
            whereConditions.push(`(name LIKE ${searchPattern} OR description LIKE ${searchPattern} OR category LIKE ${searchPattern} OR manufacturer LIKE ${searchPattern})`);
        }

        // Category filter
        if (category) {
            whereConditions.push(`category = ${mysql.escape(category)}`);
        }

        // Price range
        if (minPrice !== null) {
            whereConditions.push(`price >= ${mysql.escape(minPrice)}`);
        }
        if (maxPrice !== null) {
            whereConditions.push(`price <= ${mysql.escape(maxPrice)}`);
        }

        // Manufacturer filter
        const manufacturer = req.query.manufacturer;
        if (manufacturer) {
            whereConditions.push(`manufacturer = ${mysql.escape(manufacturer)}`);
        }

        // Medicine System (Ayurveda/Homeopathy/Allopathy)
        if (medicineSystem && medicineSystem !== 'all') {
            if (medicineSystem === 'ayurveda') {
                const ayurConditions = [
                    "name LIKE '%ayur%'", "name LIKE '%herbal%'", "name LIKE '%churna%'",
                    "name LIKE '%ashwagandha%'", "name LIKE '%triphala%'", "name LIKE '%brahmi%'",
                    "name LIKE '%tulsi%'", "name LIKE '%neem%'", "name LIKE '%amla%'",
                    "name LIKE '%guduchi%'", "name LIKE '%bhasma%'",
                    "description LIKE '%ayur%'", "description LIKE '%natural%'", "description LIKE '%herbal%'"
                ];
                whereConditions.push(`(${ayurConditions.join(' OR ')})`);
            } else if (medicineSystem === 'homeopathy') {
                const homeoConditions = [
                    "name LIKE '%homeo%'", "name LIKE '%dilution%'", "name LIKE '%arnica%'",
                    "name LIKE '%belladonna%'", "name LIKE '%bryonia%'",
                    "description LIKE '%homeo%'", "description LIKE '%dilution%'"
                ];
                whereConditions.push(`(${homeoConditions.join(' OR ')})`);
            } else if (medicineSystem === 'allopathy') {
                whereConditions.push("data_source IN ('Gold-Standard-Merge', 'DrugInfo-OS')");
            }
        }

        const whereClause = whereConditions.join(' AND ');

        // Sorting
        let orderBy = 'name ASC';
        if (sortBy === 'price_asc') orderBy = 'price ASC';
        else if (sortBy === 'price_desc') orderBy = 'price DESC';
        else if (sortBy === 'name_asc') orderBy = 'name ASC';
        else if (sortBy === 'name_desc') orderBy = 'name DESC';
        else orderBy = 'id DESC';

        // Build queries
        const countQuery = `SELECT COUNT(*) as total FROM medicines WHERE ${whereClause}`;

        const dataQuery = `
            SELECT 
                id, name, description, price, mrp, category, stock, 
                image_url, manufacturer, pack_size, composition,
                drug_interactions, substitutes, side_effects_list, review_percent,
                data_source,
                'medicine' as product_type
            FROM medicines
            WHERE ${whereClause}
            ORDER BY ${orderBy}
            LIMIT ${mysql.escape(limit)} OFFSET ${mysql.escape(offset)}
        `;

        // Execute queries
        const [[{ total }]] = await db.query(countQuery);
        const [rows] = await db.query(dataQuery);

        res.json({
            success: true,
            data: {
                results: rows.map(row => ({ ...row, stock_quantity: row.stock })),
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('getMedicines error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching medicines',
            error: error.message
        });
    }
};

// Get suggestions for the medicines page only
exports.getSuggestions = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.json({ success: true, data: [] });
        }

        const [rows] = await db.execute(`
            SELECT name, price, category, 'medicine' as type
            FROM medicines
            WHERE name LIKE ?
            LIMIT 10
        `, [`%${q}%`]);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Medicines suggestions error:', error);
        res.status(500).json({ success: false, message: 'Error fetching suggestions' });
    }
};

// Get all unique manufacturers
exports.getManufacturers = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT DISTINCT manufacturer FROM medicines WHERE manufacturer IS NOT NULL AND manufacturer != "" ORDER BY manufacturer LIMIT 50'); // Limit to top 50 for now
        res.json({
            success: true,
            data: rows.map(r => r.manufacturer)
        });
    } catch (error) {
        console.error('getManufacturers error:', error);
        res.status(500).json({ success: false, message: 'Error fetching manufacturers' });
    }
};

// Get all unique categories for medicines
exports.getCategories = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT DISTINCT category FROM medicines WHERE category IS NOT NULL AND category != "" ORDER BY category');
        res.json({
            success: true,
            data: rows.map(r => r.category)
        });
    } catch (error) {
        console.error('getCategories error:', error);
        res.status(500).json({ success: false, message: 'Error fetching categories' });
    }
};
