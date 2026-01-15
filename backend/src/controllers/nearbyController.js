const db = require('../config/database');

// Haversine formula to calculate distance in KM
const getDistanceQuery = (lat, lng, tblLat = 'latitude', tblLng = 'longitude') => {
    return `(6371 * acos(cos(radians(${lat})) * cos(radians(${tblLat})) * cos(radians(${tblLng}) - radians(${lng})) + sin(radians(${lat})) * sin(radians(${tblLat}))))`;
};

exports.getNearbyHospitals = async (req, res) => {
    try {
        const { lat, lng, radius = 25, search } = req.query; // increased default radius

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and Longitude are required'
            });
        }

        const distanceSql = getDistanceQuery(lat, lng);

        let query = `
            SELECT *, ${distanceSql} AS distance 
            FROM (
                SELECT id, name, address, city, state, pincode, latitude, longitude, phone, email, website, type, specialties, rating, data_source
                FROM hospitals
                UNION ALL
                SELECT id, name, address, NULL as city, state, NULL as pincode, NULL as latitude, NULL as longitude, contact as phone, NULL as email, website, category as type, specialties, NULL as rating, 'NABH' as data_source
                FROM nabh_hospitals
                UNION ALL
                SELECT id, hospital_name as name, address, city, state, pincode, NULL as latitude, NULL as longitude, NULL as phone, email, website, hospital_type as type, specialties, NULL as rating, 'Specialty' as data_source
                FROM hospitals_with_specialties
            ) as combined
            WHERE 1=1
        `;

        const params = [];
        if (search) {
            query += ' AND (name LIKE ? OR specialties LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        // Include records without coordinates by checking if distance is NULL
        query += ` HAVING (distance <= ? OR distance IS NULL) ORDER BY distance ASC LIMIT 100`;
        params.push(radius);

        const [hospitals] = await db.execute(query, params);

        res.json({
            success: true,
            data: hospitals
        });
    } catch (error) {
        console.error('Get nearby hospital error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching nearby hospitals'
        });
    }
};

exports.getNearbyPharmacies = async (req, res) => {
    try {
        const { lat, lng, radius = 5 } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and Longitude are required'
            });
        }

        const distanceSql = getDistanceQuery(lat, lng);
        const query = `
            SELECT *, ${distanceSql} AS distance 
            FROM pharmacies 
            HAVING distance <= ? 
            ORDER BY distance ASC 
            LIMIT 100
        `;

        const [pharmacies] = await db.execute(query, [radius]);

        res.json({
            success: true,
            data: pharmacies
        });
    } catch (error) {
        console.error('Get nearby pharmacies error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching nearby pharmacies'
        });
    }
};

exports.getNearbyDoctors = async (req, res) => {
    try {
        const { lat, lng, radius = 5 } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and Longitude are required'
            });
        }

        const distanceSql = getDistanceQuery(lat, lng);
        const query = `
            SELECT *, ${distanceSql} AS distance 
            FROM doctors 
            HAVING distance <= ? 
            ORDER BY distance ASC 
            LIMIT 100
        `;

        const [doctors] = await db.execute(query, [radius]);

        res.json({
            success: true,
            data: doctors
        });
    } catch (error) {
        console.error('Get nearby doctors error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching nearby doctors'
        });
    }
};

exports.getNearbyHealthCentres = async (req, res) => {
    try {
        const { lat, lng, radius = 10, district } = req.query;

        let query;
        let params = [];
        // Safely generate distance SQL if coordinates are present
        const distanceSql = (lat && lng) ? getDistanceQuery(parseFloat(lat), parseFloat(lng)) : '0';

        if (district) {
            query = `
                SELECT *, ${distanceSql} AS distance 
                FROM health_centres 
                WHERE district_name LIKE ? 
                ORDER BY distance ASC
                LIMIT 200
            `;
            params = [`%${district}%`];
        } else if (lat && lng) {
            query = `
                SELECT *, ${distanceSql} AS distance 
                FROM health_centres 
                HAVING distance <= ? 
                ORDER BY distance ASC 
                LIMIT 100
            `;
            params = [radius];
        } else {
            return res.status(400).json({
                success: false,
                message: 'Latitude/Longitude or District is required'
            });
        }

        const [centres] = await db.execute(query, params);

        res.json({
            success: true,
            data: centres.map(c => ({
                ...c,
                name: c.facility_name,
                address: c.facility_address && c.facility_address !== 'NA'
                    ? c.facility_address
                    : `${c.subdistrict_name}, ${c.district_name}, ${c.state_name}`,
                type: 'health-centre'
            }))
        });
    } catch (error) {
        console.error('Get nearby health centres error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching health centres'
        });
    }
};

exports.searchHealthCentresByDistrict = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.length < 2) {
            return res.json({ success: true, data: [] });
        }

        const sql = `
            SELECT DISTINCT district_name, state_name 
            FROM health_centres 
            WHERE district_name LIKE ? 
            LIMIT 10
        `;
        const [districts] = await db.execute(sql, [`%${query}%`]);

        res.json({
            success: true,
            data: districts
        });
    } catch (error) {
        console.error('District search error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during district search'
        });
    }
};
