const db = require('../config/database');

// Haversine formula to calculate distance in KM
const getDistanceQuery = (lat, lng, tblLat = 'latitude', tblLng = 'longitude') => {
    return `(6371 * acos(cos(radians(${lat})) * cos(radians(${tblLat})) * cos(radians(${tblLng}) - radians(${lng})) + sin(radians(${lat})) * sin(radians(${tblLat}))))`;
};

exports.getNearbyHospitals = async (req, res) => {
    try {
        const { lat, lng, radius = 10 } = req.query; // radius in km

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and Longitude are required'
            });
        }

        const distanceSql = getDistanceQuery(lat, lng);
        const query = `
            SELECT *, ${distanceSql} AS distance 
            FROM hospitals 
            HAVING distance <= ? 
            ORDER BY distance ASC 
            LIMIT 50
        `;

        const [hospitals] = await db.execute(query, [radius]);

        res.json({
            success: true,
            data: hospitals
        });
    } catch (error) {
        console.error('Get nearby hospitals error:', error);
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
            LIMIT 50
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
            LIMIT 50
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
