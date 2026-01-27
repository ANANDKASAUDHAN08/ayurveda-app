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
        const { lat, lng, radius = 10, type, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const searchRadius = parseFloat(radius);

        const query = `
            SELECT id, name, address, city, state, pincode, latitude, longitude, phone, emergency_phone, email, website, type, specialties, rating, data_source
            FROM hospitals
            WHERE 1=1
            ${type && (type === 'government' || type === 'private') ? ' AND type = ?' : ''}
        `;

        const queryParams = [];
        if (type && (type === 'government' || type === 'private')) {
            queryParams.push(type);
        }

        // Total count (ignoring pagination)
        const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered`;
        const [countResult] = await db.execute(countQuery, queryParams);
        const total = countResult[0].total;

        const [hospitals] = await db.execute(query, queryParams);

        // Calculate distance and clean up data
        const cleanedHospitals = hospitals
            .map(hospital => {
                const clean = (val) => (val === '\\N' || val === 'NULL' || val === null) ? '' : val;

                let address = clean(hospital.address);
                if (!address || address === '') {
                    const parts = [clean(hospital.city), clean(hospital.state), clean(hospital.pincode)].filter(p => p !== '');
                    address = parts.join(', ');
                }

                const lat = parseFloat(hospital.latitude);
                const lng = parseFloat(hospital.longitude);

                return {
                    ...hospital,
                    address: address,
                    city: clean(hospital.city),
                    state: clean(hospital.state),
                    pincode: clean(hospital.pincode),
                    phone: clean(hospital.phone),
                    email: clean(hospital.email),
                    website: clean(hospital.website),
                    specialties: clean(hospital.specialties),
                    type: clean(hospital.type) || 'Hospital',
                    distance: (lat && lng && lat !== 0 && lng !== 0) ? calculateDistance(
                        userLat,
                        userLng,
                        lat,
                        lng
                    ) : null
                };
            })
            .filter(hospital => hospital.distance === null || hospital.distance <= searchRadius)
            .sort((a, b) => {
                if (a.distance === null && b.distance !== null) return 1;
                if (a.distance !== null && b.distance === null) return -1;
                if (a.distance === null && b.distance === null) return 0;
                return a.distance - b.distance;
            });

        // Apply pagination to cleaned results
        const paginatedHospitals = cleanedHospitals.slice(offset, offset + parseInt(limit));

        res.json({
            count: total,
            hospitals: paginatedHospitals,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
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

