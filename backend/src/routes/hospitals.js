const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

// GET /api/hospitals/nearby - Get nearby hospitals
router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = 10, type } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const searchRadius = parseFloat(radius);

        // Build query with optional type filter
        let query = `
            SELECT 
                id, name, address, city, latitude, longitude, 
                phone, emergency_phone, type, has_emergency, 
                has_ambulance, has_icu, beds_available, rating
            FROM hospitals 
            WHERE has_emergency = 1
        `;

        const queryParams = [];

        if (type && (type === 'government' || type === 'private')) {
            query += ' AND type = ?';
            queryParams.push(type);
        }

        const [hospitals] = await db.execute(query, queryParams);

        // Calculate distance for each hospital and filter by radius
        const hospitalsWithDistance = hospitals
            .map(hospital => ({
                ...hospital,
                distance: calculateDistance(
                    userLat,
                    userLng,
                    parseFloat(hospital.latitude),
                    parseFloat(hospital.longitude)
                )
            }))
            .filter(hospital => hospital.distance <= searchRadius)
            .sort((a, b) => a.distance - b.distance); // Sort by distance (nearest first)

        res.json({
            count: hospitalsWithDistance.length,
            hospitals: hospitalsWithDistance
        });

    } catch (error) {
        console.error('Error fetching nearby hospitals:', error);
        res.status(500).json({ error: 'Failed to fetch nearby hospitals' });
    }
});

// GET /api/hospitals/:id - Get single hospital details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [hospitals] = await db.execute(
            'SELECT * FROM hospitals WHERE id = ?',
            [id]
        );

        if (hospitals.length === 0) {
            return res.status(404).json({ error: 'Hospital not found' });
        }

        res.json(hospitals[0]);

    } catch (error) {
        console.error('Error fetching hospital:', error);
        res.status(500).json({ error: 'Failed to fetch hospital details' });
    }
});

// GET /api/hospitals - Get all hospitals (with optional filters)
router.get('/', async (req, res) => {
    try {
        const { type, city, has_emergency } = req.query;

        let query = 'SELECT * FROM hospitals WHERE 1=1';
        const queryParams = [];

        if (type) {
            query += ' AND type = ?';
            queryParams.push(type);
        }

        if (city) {
            query += ' AND city LIKE ?';
            queryParams.push(`%${city}%`);
        }

        if (has_emergency !== undefined) {
            query += ' AND has_emergency = ?';
            queryParams.push(has_emergency === 'true' ? 1 : 0);
        }

        query += ' ORDER BY name ASC';

        const [hospitals] = await db.execute(query, queryParams);

        res.json(hospitals);

    } catch (error) {
        console.error('Error fetching hospitals:', error);
        res.status(500).json({ error: 'Failed to fetch hospitals' });
    }
});

module.exports = router;


// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

// GET /api/hospitals/nearby - Get nearby hospitals
router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = 10, type } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const searchRadius = parseFloat(radius);

        const connection = await mysql.createConnection(config);

        // Build query with optional type filter
        let query = `
            SELECT 
                id, name, address, city, latitude, longitude, 
                phone, emergency_phone, type, has_emergency, 
                has_ambulance, has_icu, beds_available, rating
            FROM hospitals 
            WHERE has_emergency = 1
        `;

        const queryParams = [];

        if (type && (type === 'government' || type === 'private')) {
            query += ' AND type = ?';
            queryParams.push(type);
        }

        const [hospitals] = await connection.execute(query, queryParams);

        // Calculate distance for each hospital and filter by radius
        const hospitalsWithDistance = hospitals
            .map(hospital => ({
                ...hospital,
                distance: calculateDistance(
                    userLat,
                    userLng,
                    parseFloat(hospital.latitude),
                    parseFloat(hospital.longitude)
                )
            }))
            .filter(hospital => hospital.distance <= searchRadius)
            .sort((a, b) => a.distance - b.distance); // Sort by distance (nearest first)

        await connection.end();

        res.json({
            count: hospitalsWithDistance.length,
            hospitals: hospitalsWithDistance
        });

    } catch (error) {
        console.error('Error fetching nearby hospitals:', error);
        res.status(500).json({ error: 'Failed to fetch nearby hospitals' });
    }
});

// GET /api/hospitals/:id - Get single hospital details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await mysql.createConnection(config);

        const [hospitals] = await connection.execute(
            'SELECT * FROM hospitals WHERE id = ?',
            [id]
        );

        await connection.end();

        if (hospitals.length === 0) {
            return res.status(404).json({ error: 'Hospital not found' });
        }

        res.json(hospitals[0]);

    } catch (error) {
        console.error('Error fetching hospital:', error);
        res.status(500).json({ error: 'Failed to fetch hospital details' });
    }
});

// GET /api/hospitals - Get all hospitals (with optional filters)
router.get('/', async (req, res) => {
    try {
        const { type, city, has_emergency } = req.query;
        const connection = await mysql.createConnection(config);

        let query = 'SELECT * FROM hospitals WHERE 1=1';
        const queryParams = [];

        if (type) {
            query += ' AND type = ?';
            queryParams.push(type);
        }

        if (city) {
            query += ' AND city LIKE ?';
            queryParams.push(`%${city}%`);
        }

        if (has_emergency !== undefined) {
            query += ' AND has_emergency = ?';
            queryParams.push(has_emergency === 'true' ? 1 : 0);
        }

        query += ' ORDER BY name ASC';

        const [hospitals] = await connection.execute(query, queryParams);
        await connection.end();

        res.json(hospitals);

    } catch (error) {
        console.error('Error fetching hospitals:', error);
        res.status(500).json({ error: 'Failed to fetch hospitals' });
    }
});

module.exports = router;
