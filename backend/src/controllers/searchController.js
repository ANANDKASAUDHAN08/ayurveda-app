const db = require('../config/database');

// Search products with filters and sorting
exports.searchProducts = async (req, res) => {
    try {
        const {
            q,              // Search query
            category,       // Filter by category
            type,           // medicine, device, doctor, all
            minPrice,       // Min price
            maxPrice,       // Max price
            sortBy,         // price_asc, price_desc, name_asc, name_desc
            page = 1,       // Page number
            limit = 20      // Results per page
        } = req.query;

        let allResults = [];

        // Search Medicines
        if (!type || type === 'medicine' || type === 'all') {
            let medicineQuery = `
                SELECT 
                    id, name, description, price, mrp, category, stock, 
                    image_url, manufacturer, pack_size, composition,
                    'medicine' as product_type
                FROM medicines
                WHERE 1=1
            `;
            let medicineParams = [];

            if (q) {
                medicineQuery += ` AND (name LIKE ? OR description LIKE ? OR category LIKE ? OR manufacturer LIKE ?)`;
                medicineParams.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
            }
            if (category) {
                medicineQuery += ` AND category = ?`;
                medicineParams.push(category);
            }
            if (minPrice) {
                medicineQuery += ` AND price >= ?`;
                medicineParams.push(minPrice);
            }
            if (maxPrice) {
                medicineQuery += ` AND price <= ?`;
                medicineParams.push(maxPrice);
            }

            // Limit results to prevent memory issues with 250k+ medicines
            medicineQuery += ` LIMIT 500`;

            try {
                const [rows] = await db.execute(medicineQuery, medicineParams);
                // Use simple loop instead of spread+map to prevent stack overflow
                for (const row of rows) {
                    row.stock_quantity = row.stock;
                    allResults.push(row);
                }
            } catch (error) {
                console.log('Medicines table query failed:', error.message);
            }
        }

        // Search Medical Devices
        if (!type || type === 'device' || type === 'all') {
            let deviceQuery = `
                SELECT 
                    id, name, description, price, category, stock,
                    'device' as product_type
                FROM medical_devices
                WHERE 1=1
            `;
            let deviceParams = [];

            if (q) {
                deviceQuery += ` AND (name LIKE ? OR description LIKE ? OR category LIKE ? OR manufacturer LIKE ?)`;
                deviceParams.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
            }
            if (category) {
                deviceQuery += ` AND category = ?`;
                deviceParams.push(category);
            }
            if (minPrice) {
                deviceQuery += ` AND price >= ?`;
                deviceParams.push(minPrice);
            }
            if (maxPrice) {
                deviceQuery += ` AND price <= ?`;
                deviceParams.push(maxPrice);
            }

            try {
                const [rows] = await db.execute(deviceQuery, deviceParams);
                allResults.push(...rows.map(r => ({ ...r, stock_quantity: r.stock })));
            } catch (error) {
                console.log('Devices table query failed:', error.message);
            }
        }

        // Search Doctors (skip if price filters are active - doctors have consultationFee, not regular price)
        if ((!type || type === 'doctor' || type === 'all') && !minPrice && !maxPrice) {
            let doctorQuery = `
                SELECT 
                    id, name, specialization, phone, consultationFee as price,
                    'doctor' as product_type,
                    CONCAT(specialization, ' - ', COALESCE(experience, 0), ' years exp') as description,
                    specialization as category,
                    NULL as stock
                FROM doctors
                WHERE 1=1
            `;

            let doctorParams = [];
            if (q) {
                doctorQuery += ` AND (name LIKE ? OR specialization LIKE ? OR location LIKE ?)`;
                doctorParams.push(`%${q}%`, `%${q}%`, `%${q}%`);
            }

            try {
                const [rows] = await db.execute(doctorQuery, doctorParams);
                allResults.push(...rows.map(r => ({
                    ...r,
                    stock_quantity: null,
                    category: 'Doctor'
                })));
            } catch (error) {
                console.log('Doctors query failed:', error.message);
            }
        }

        // Search Hospitals (skip if price filters are active - hospitals have no price)
        if ((!type || type === 'hospital' || type === 'all') && !minPrice && !maxPrice) {
            let hospitalQuery = `
                SELECT 
                    id, name, address as description, phone,
                    'hospital' as product_type,
                    NULL as price,
                    NULL as category,
                    NULL as stock
                FROM hospitals
                WHERE 1=1
            `;
            let hospitalParams = [];

            if (q) {
                hospitalQuery += ` AND (name LIKE ? OR address LIKE ? OR city LIKE ?)`;
                hospitalParams.push(`%${q}%`, `%${q}%`, `%${q}%`);
            }

            try {
                const [rows] = await db.execute(hospitalQuery, hospitalParams);
                allResults.push(...rows.map(r => ({
                    ...r,
                    stock_quantity: null,
                    category: 'Hospital',
                    description: r.description || r.address
                })));
            } catch (error) {
                console.log('Hospitals query failed:', error.message);
            }
        }

        // Search Pharmacies (skip if price filters are active - pharmacies have no price)
        if ((!type || type === 'pharmacy' || type === 'all') && !minPrice && !maxPrice) {
            let pharmacyQuery = `
                SELECT 
                    id, name, address as description, phone,
                    'pharmacy' as product_type,
                    NULL as price,
                    'Pharmacy' as category,
                    NULL as stock
                FROM pharmacies
                WHERE 1=1
            `;
            let pharmacyParams = [];

            if (q) {
                pharmacyQuery += ` AND (name LIKE ? OR address LIKE ? OR city LIKE ?)`;
                pharmacyParams.push(`%${q}%`, `%${q}%`, `%${q}%`);
            }

            try {
                const [rows] = await db.execute(pharmacyQuery, pharmacyParams);
                allResults.push(...rows.map(r => ({
                    ...r,
                    stock_quantity: null,
                    category: 'Pharmacy'
                })));
            } catch (error) {
                console.log('Pharmacies query failed:', error.message);
            }
        }

        // Apply sorting
        const sortMap = {
            'price_asc': (a, b) => (a.price || 0) - (b.price || 0),
            'price_desc': (a, b) => (b.price || 0) - (a.price || 0),
            'name_asc': (a, b) => (a.name || '').localeCompare(b.name || ''),
            'name_desc': (a, b) => (b.name || '').localeCompare(a.name || '')
        };

        const sortFn = sortMap[sortBy] || sortMap['name_asc'];
        allResults.sort(sortFn);

        // Apply pagination
        const total = allResults.length;
        const offset = (page - 1) * limit;
        const paginatedResults = allResults.slice(offset, offset + parseInt(limit));

        res.json({
            success: true,
            data: {
                results: paginatedResults,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching products',
            error: error.message
        });
    }
};

// Get autocomplete suggestions
exports.getSuggestions = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.json({
                success: true,
                data: []
            });
        }

        let allSuggestions = [];

        // Medicines
        try {
            const [medicines] = await db.execute(`
                SELECT name, price, category, 'medicine' as type
                FROM medicines
                WHERE name LIKE ?
                LIMIT 3
            `, [`%${q}%`]);
            allSuggestions.push(...medicines);
        } catch (err) {
            console.log('Medicine suggestions failed:', err.message);
        }

        // Devices
        try {
            const [devices] = await db.execute(`
                SELECT name, price, category, 'device' as type
                FROM medical_devices
                WHERE name LIKE ?
                LIMIT 3
            `, [`%${q}%`]);
            allSuggestions.push(...devices);
        } catch (err) {
            console.log('Device suggestions failed:', err.message);
        }

        // Doctors
        try {
            const [doctors] = await db.execute(`
                SELECT name, consultationFee as price, specialization as category, 'doctor' as type
                FROM doctors
                WHERE name LIKE ? OR specialization LIKE ?
                LIMIT 2
            `, [`%${q}%`, `%${q}%`]);
            allSuggestions.push(...doctors);
        } catch (err) {
            console.log('Doctor suggestions failed:', err.message);
        }

        // Hospitals
        try {
            const [hospitals] = await db.execute(`
                SELECT name, NULL as price, 'Hospital' as category, 'hospital' as type
                FROM hospitals
                WHERE name LIKE ?
                LIMIT 2
            `, [`%${q}%`]);
            allSuggestions.push(...hospitals);
        } catch (err) {
            console.log('Hospital suggestions failed:', err.message);
        }

        // Pharmacies
        try {
            const [pharmacies] = await db.execute(`
                SELECT name, NULL as price, 'Pharmacy' as category, 'pharmacy' as type
                FROM pharmacies
                WHERE name LIKE ? OR address LIKE ?
                LIMIT 2
            `, [`%${q}%`, `%${q}%`]);
            allSuggestions.push(...pharmacies);
        } catch (err) {
            console.log('Pharmacy suggestions failed:', err.message);
        }

        // Limit total suggestions to 10
        const limitedSuggestions = allSuggestions.slice(0, 10);

        res.json({
            success: true,
            data: limitedSuggestions
        });
    } catch (error) {
        console.error('Suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting suggestions',
            error: error.message
        });
    }
};

// Get popular searches (mock - in production, track actual searches)
exports.getPopularSearches = async (req, res) => {
    try {
        let popularItems = [];

        // Get random medicines
        try {
            const [medicines] = await db.execute(`
                SELECT name FROM medicines
                ORDER BY RAND()
                LIMIT 2
            `);
            popularItems.push(...medicines.map(m => m.name));
        } catch (err) {
            console.log('Popular medicines query failed:', err.message);
        }

        // Get random pharmacies
        try {
            const [pharmacies] = await db.execute(`
                SELECT name FROM pharmacies
                ORDER BY RAND()
                LIMIT 1
            `);
            popularItems.push(...pharmacies.map(p => p.name));
        } catch (err) {
            console.log('Popular pharmacies query failed:', err.message);
        }

        // Get random doctor
        try {
            const [doctors] = await db.execute(`
                SELECT name FROM doctors
                ORDER BY RAND()
                LIMIT 1
            `);
            popularItems.push(...doctors.map(d => d.name));
        } catch (err) {
            console.log('Popular doctors query failed:', err.message);
        }

        // Limit total to 4
        popularItems = popularItems.slice(0, 4);

        // Fallback to static if database queries failed
        if (popularItems.length === 0) {
            popularItems = [
                'Paracetamol',
                'Blood Pressure Monitor',
                'Thermometer',
                'Vitamin C'
            ];
        }

        res.json({
            success: true,
            data: popularItems
        });
    } catch (error) {
        console.error('Popular searches error:', error);
        // Always return something, never fail
        res.json({
            success: true,
            data: [
                'Paracetamol',
                'Blood Pressure Monitor',
                'Thermometer',
                'Vitamin C'
            ]
        });
    }
};

// Track search (for analytics - optional)
exports.trackSearch = async (req, res) => {
    try {
        const { query, resultsCount } = req.body;

        // In production, save to search_analytics table
        // For now, just acknowledge

        res.json({
            success: true,
            message: 'Search tracked'
        });
    } catch (error) {
        console.error('Track search error:', error);
        res.status(500).json({
            success: false,
            message: 'Error tracking search'
        });
    }
};