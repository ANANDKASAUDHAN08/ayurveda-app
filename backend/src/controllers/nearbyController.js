const db = require('../config/database');

// Haversine formula to calculate distance in KM
const getDistanceQuery = (lat, lng, tblLat = 'latitude', tblLng = 'longitude') => {
    return `(6371 * acos(cos(radians(${lat})) * cos(radians(${tblLat})) * cos(radians(${tblLng}) - radians(${lng})) + sin(radians(${lat})) * sin(radians(${tblLat}))))`;
};

exports.getNearbyHospitals = async (req, res) => {
    try {
        const { lat, lng, radius = 25, search, page = 1, limit = 20, state, city, pincode } = req.query; // increased default radius
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Location is optional if searching or filtering
        const hasLocation = lat && lng && parseFloat(lat) !== 0 && parseFloat(lng) !== 0;

        if (!hasLocation && !search && !state && !city && !pincode) {
            return res.status(400).json({
                success: false,
                message: 'Latitude/Longitude or search/filters are required'
            });
        }

        const rawDistanceSql = hasLocation ? getDistanceQuery(lat, lng) : 'NULL';
        const distanceSql = `IF(latitude IS NULL OR longitude IS NULL OR latitude = 0 OR longitude = 0, NULL, ${rawDistanceSql})`;
        const query = `
            SELECT *, ${distanceSql} AS distance 
            FROM hospitals
            WHERE 1=1
            ${search ? ' AND (name LIKE ? OR specialties LIKE ?)' : ''}
            ${state ? ' AND state LIKE ?' : ''}
            ${city ? ' AND city LIKE ?' : ''}
            ${pincode ? ' AND pincode LIKE ?' : ''}
            HAVING (
                (distance <= ? OR distance IS NULL) 
                ${(search || state || city || pincode) ? ' OR 1=1 ' : ''}
            )
        `;

        const params = [];
        if (search) {
            params.push(`%${search}%`, `%${search}%`);
        }
        if (state) params.push(`%${state}%`);
        if (city) params.push(`%${city}%`);
        if (pincode) params.push(`%${pincode}%`);
        params.push(parseFloat(radius));

        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered`;
        const [countResult] = await db.execute(countQuery, params);
        const total = countResult[0].total;

        // Add sorting and final pagination - prioritize items with distance
        const finalQuery = `${query} ORDER BY (distance IS NULL), distance ASC LIMIT ${Math.max(1, parseInt(limit))} OFFSET ${Math.max(0, parseInt(offset))}`;
        const [hospitals] = await db.execute(finalQuery, params);

        const cleanedHospitals = hospitals.map(h => {
            // Clean up '\N' strings
            const clean = (val) => (val === '\\N' || val === 'NULL' || val === null) ? '' : val;

            let address = clean(h.address);
            if (!address || address === '') {
                const parts = [clean(h.city), clean(h.state), clean(h.pincode)].filter(p => p !== '');
                address = parts.join(', ');
            }

            return {
                ...h,
                address: address,
                city: clean(h.city),
                state: clean(h.state),
                pincode: clean(h.pincode),
                phone: clean(h.phone),
                email: clean(h.email),
                website: clean(h.website),
                specialties: clean(h.specialties),
                type: clean(h.type) || 'Hospital',
                data_source: h.data_source || 'hospitals'
            };
        });

        res.json({
            success: true,
            data: cleanedHospitals,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
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
        const { lat, lng, radius = 5, page = 1, limit = 20, state, city, pincode } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Location is optional if searching or filtering
        const hasLocation = lat && lng && parseFloat(lat) !== 0 && parseFloat(lng) !== 0;

        if (!hasLocation && !state && !city && !pincode) {
            return res.status(400).json({
                success: false,
                message: 'Latitude/Longitude or filters are required'
            });
        }

        const rawDistanceSql = hasLocation ? getDistanceQuery(lat, lng) : 'NULL';
        const distanceSql = `IF(latitude IS NULL OR longitude IS NULL OR latitude = 0 OR longitude = 0, NULL, ${rawDistanceSql})`;
        const query = `
            SELECT *, ${distanceSql} AS distance 
            FROM pharmacies 
            WHERE 1=1
            ${state ? ' AND state LIKE ?' : ''}
            ${city ? ' AND city LIKE ?' : ''}
            ${pincode ? ' AND pincode LIKE ?' : ''}
            HAVING (
                distance <= ? 
                ${(state || city || pincode) ? ' OR 1=1 ' : ''}
            )
        `;

        // Total count
        const params = [];
        if (state) params.push(`%${state}%`);
        if (city) params.push(`%${city}%`);
        if (pincode) params.push(`%${pincode}%`);
        params.push(parseFloat(radius));

        const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered`;
        const [countResult] = await db.execute(countQuery, params);
        const total = countResult[0].total;

        // Final paginated query - prioritize items with distance
        const finalQuery = `${query} ORDER BY (distance IS NULL), distance ASC LIMIT ${Math.max(1, parseInt(limit))} OFFSET ${Math.max(0, parseInt(offset))}`;
        const [pharmacies] = await db.execute(finalQuery, params);

        res.json({
            success: true,
            data: pharmacies,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
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
        const { lat, lng, radius = 5, page = 1, limit = 20, state, city, pincode } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Location is optional if searching or filtering
        const hasLocation = lat && lng && parseFloat(lat) !== 0 && parseFloat(lng) !== 0;

        if (!hasLocation && !state && !city && !pincode) {
            return res.status(400).json({
                success: false,
                message: 'Latitude/Longitude or filters are required'
            });
        }

        const rawDistanceSql = hasLocation ? getDistanceQuery(lat, lng) : 'NULL';
        const distanceSql = `IF(latitude IS NULL OR longitude IS NULL OR latitude = 0 OR longitude = 0, NULL, ${rawDistanceSql})`;
        const query = `
            SELECT *, ${distanceSql} AS distance 
            FROM doctors 
            WHERE 1=1
            ${state ? ' AND state LIKE ?' : ''}
            ${city ? ' AND city LIKE ?' : ''}
            ${pincode ? ' AND pincode LIKE ?' : ''}
            HAVING (
                distance <= ? 
                ${(state || city || pincode) ? ' OR 1=1 ' : ''}
            )
        `;

        // Total count
        const params = [];
        if (state) params.push(`%${state}%`);
        if (city) params.push(`%${city}%`);
        if (pincode) params.push(`%${pincode}%`);
        params.push(parseFloat(radius));

        const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered`;
        const [countResult] = await db.execute(countQuery, params);
        const total = countResult[0].total;

        // Final paginated query - prioritize items with distance
        const finalQuery = `${query} ORDER BY (distance IS NULL), distance ASC LIMIT ${Math.max(1, parseInt(limit))} OFFSET ${Math.max(0, parseInt(offset))}`;
        const [doctors] = await db.execute(finalQuery, params);

        res.json({
            success: true,
            data: doctors,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
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
        const { lat, lng, radius = 10, district, state, subdistrict, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query;
        let params = [];
        // Safely generate distance SQL if coordinates are present
        const rawDistanceSql = (lat && lng) ? getDistanceQuery(parseFloat(lat), parseFloat(lng)) : 'NULL';
        const distanceSql = `IF(latitude IS NULL OR longitude IS NULL OR latitude = 0 OR longitude = 0, NULL, ${rawDistanceSql})`;

        query = `
            SELECT *, ${distanceSql} AS distance 
            FROM health_centres 
            WHERE 1=1
            ${state ? ' AND state_name LIKE ?' : ''}
            ${district ? ' AND district_name LIKE ?' : ''}
            ${subdistrict ? ' AND subdistrict_name LIKE ?' : ''}
            HAVING (
                (distance <= ? OR distance IS NULL)
                ${(state || district || subdistrict) ? ' OR 1=1 ' : ''}
            )
        `;

        if (state) params.push(`%${state}%`);
        if (district) params.push(`%${district}%`);
        if (subdistrict) params.push(`%${subdistrict}%`);
        params.push(parseFloat(radius));

        // Total count
        const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered`;
        const [countResult] = await db.execute(countQuery, params);
        const total = countResult[0].total;

        // Final paginated query - prioritize items with distance
        const finalQuery = `${query} ORDER BY (distance IS NULL), distance ASC LIMIT ${Math.max(1, parseInt(limit))} OFFSET ${Math.max(0, parseInt(offset))}`;
        const [centres] = await db.execute(finalQuery, params);

        const mappedCentres = centres.map(c => ({
            ...c,
            name: c.facility_name,
            address: c.facility_address && c.facility_address !== 'NA'
                ? c.facility_address
                : `${c.subdistrict_name}, ${c.district_name}, ${c.state_name}`,
            type: 'health-centre'
        }));

        res.json({
            success: true,
            data: mappedCentres,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
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
