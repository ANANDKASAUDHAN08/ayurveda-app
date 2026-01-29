const db = require('../config/database');

// Haversine formula to calculate distance in KM
const getDistanceQuery = (lat, lng, tblLat = 'latitude', tblLng = 'longitude') => {
    return `(6371 * acos(cos(radians(${lat})) * cos(radians(${tblLat})) * cos(radians(${tblLng}) - radians(${lng})) + sin(radians(${lat})) * sin(radians(${tblLat}))))`;
};

exports.getNearbyLaboratories = async (req, res) => {
    try {
        const { lat, lng, radius = 50, search, page = 1, limit = 20, city } = req.query;

        // Location check
        const hasLocation = lat && lng && parseFloat(lat) !== 0 && parseFloat(lng) !== 0;

        // Build base query components
        const distanceSql = hasLocation ? getDistanceQuery(parseFloat(lat), parseFloat(lng)) : '0';
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (city) {
            whereClause += ' AND city = ?';
            params.push(city);
        }

        if (search) {
            whereClause += ' AND (name LIKE ? OR address LIKE ? OR city LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        let baseQuery = `
            SELECT *, ${distanceSql} AS distance 
            FROM laboratories 
            ${whereClause} 
        `;
        let queryParams = [...params];

        if (hasLocation) {
            baseQuery += `HAVING distance <= ?`;
            queryParams.push(parseFloat(radius));
        }

        // Get total count using a subquery
        const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as t`;
        const [totalResult] = await db.execute(countQuery, queryParams);
        const total = totalResult[0].total;

        // Sorting
        const sortOrder = hasLocation ? 'distance ASC' : 'name ASC';

        // Pagination - interpolate to avoid prepared statement issues with LIMIT
        const pLimit = Math.max(1, parseInt(limit) || 20);
        const pPage = Math.max(1, parseInt(page) || 1);
        const offset = (pPage - 1) * pLimit;

        const finalQuery = `${baseQuery} ORDER BY ${sortOrder} LIMIT ${pLimit} OFFSET ${offset}`;
        const [results] = await db.execute(finalQuery, queryParams);

        res.json({
            success: true,
            data: results,
            pagination: {
                total,
                page: pPage,
                limit: pLimit,
                pages: Math.ceil(total / pLimit)
            }
        });

    } catch (error) {
        console.error('Error fetching nearby laboratories:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching nearby laboratories',
            error: error.message
        });
    }
};

exports.getLaboratories = async (req, res) => {
    try {
        const { search, page = 1, limit = 12, city, service } = req.query;

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (city) {
            whereClause += ' AND city = ?';
            params.push(city);
        }

        if (service) {
            whereClause += ' AND JSON_CONTAINS(services, ?)';
            params.push(JSON.stringify(service));
        }

        if (search) {
            whereClause += ' AND (name LIKE ? OR address LIKE ? OR city LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        // Get total count
        const [countResult] = await db.execute(`SELECT COUNT(*) as total FROM laboratories ${whereClause}`, params);
        const total = countResult[0].total;

        // Pagination
        const pLimit = parseInt(limit) || 12;
        const pPage = parseInt(page) || 1;
        const offset = (pPage - 1) * pLimit;

        const [results] = await db.execute(
            `SELECT * FROM laboratories ${whereClause} ORDER BY name ASC LIMIT ${pLimit} OFFSET ${offset}`,
            params
        );

        res.json({
            success: true,
            data: {
                results,
                pagination: {
                    total,
                    page: pPage,
                    limit: pLimit,
                    totalPages: Math.ceil(total / pLimit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching laboratories:', error);
        res.status(500).json({ success: false, message: 'Error fetching laboratories' });
    }
};

exports.getLaboratoryServices = async (req, res) => {
    try {
        // Since services is a JSON array, we can use JSON_TABLE or just fetch all and process in JS if the dataset is small.
        // For efficiency in MySQL:
        const [results] = await db.execute(`
            SELECT DISTINCT service 
            FROM laboratories, 
            JSON_TABLE(services, "$[*]" COLUMNS (service VARCHAR(255) PATH "$")) as jt
            ORDER BY service
        `);

        res.json({
            success: true,
            data: results.map(r => r.service)
        });
    } catch (error) {
        console.error('Error fetching laboratory services:', error);
        res.status(500).json({ success: false, message: 'Error fetching laboratory services' });
    }
};

exports.getLaboratoryById = async (req, res) => {
    try {
        const [lab] = await db.execute('SELECT * FROM laboratories WHERE id = ?', [req.params.id]);
        if (lab.length === 0) {
            return res.status(404).json({ success: false, message: 'Laboratory not found' });
        }
        res.json({ success: true, data: lab[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching laboratory detail' });
    }
};
