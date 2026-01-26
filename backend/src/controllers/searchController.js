const db = require('../config/database');

// Search products with filters and sorting
exports.searchProducts = async (req, res) => {
    try {
        const {
            q,              // Search query
            category,       // Filter by category
            type,           // medicine, device, doctor, all, etc.
            minPrice,       // Min price
            maxPrice,       // Max price
            sortBy,         // price_asc, price_desc, name_asc, name_desc
            page = 1,       // Page number
            limit = 20,     // Results per page
            medicineType,   // ayurveda, homeopathy, allopathy
            manufacturer,   // Filter by manufacturer
            city,           // Filter by city (hospitals/pharmacies)
            minRating       // Min rating (hospitals/doctors)
        } = req.query;

        // Ensure page and limit are valid numbers with defaults
        const validPage = parseInt(page) || 1;
        const validLimit = parseInt(limit) || 20;
        const offset = (validPage - 1) * validLimit;
        const pageSize = validLimit;

        let total = 0;
        let allResults = [];

        // Search Medicines
        if (!type || type === 'medicine' || type === 'all') {
            let medicineQuery = `
                SELECT 
                    id, name, description, price, mrp, category, stock, manufacturer,
                    'medicine' as product_type, medicine_type, image_url, composition, drug_interactions, substitutes, side_effects_list, review_percent
                FROM medicines
                WHERE 1=1
            `;
            let medicineParams = [];

            if (q) {
                medicineQuery += ` AND (name LIKE ? OR composition LIKE ? OR category LIKE ? OR manufacturer LIKE ? OR description LIKE ?)`;
                medicineParams.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
            }
            if (category) {
                medicineQuery += ` AND category = ?`;
                medicineParams.push(category);
            }
            if (medicineType) {
                medicineQuery += ` AND medicine_type = ?`;
                medicineParams.push(medicineType);
            }
            if (manufacturer) {
                medicineQuery += ` AND manufacturer LIKE ?`;
                medicineParams.push(`%${manufacturer}%`);
            }
            if (minPrice) {
                medicineQuery += ` AND price >= ?`;
                medicineParams.push(minPrice);
            }
            if (maxPrice) {
                medicineQuery += ` AND price <= ?`;
                medicineParams.push(maxPrice);
            }

            // For accurate totals, fetch count if specific type
            if (type === 'medicine') {
                const countQuery = `SELECT COUNT(*) as total FROM (${medicineQuery}) as t`;
                const [[{ total: medicineTotal }]] = await db.execute(countQuery, [...medicineParams]);
                total = medicineTotal;

                // Add sorting and pagination at DB level for medicine-specific search
                const orderMap = {
                    'price_asc': 'price ASC',
                    'price_desc': 'price DESC',
                    'name_asc': 'name ASC',
                    'name_desc': 'name DESC'
                };
                medicineQuery += ` ORDER BY ${orderMap[sortBy] || 'name ASC'} LIMIT ${pageSize} OFFSET ${offset}`;
                // No need to push pageSize and offset to medicineParams anymore
            } else {
                // If "all" or generic, limit to 200 to keep it fast
                medicineQuery += ` LIMIT 200`;
            }

            try {
                const [rows] = await db.execute(medicineQuery, medicineParams);

                for (const row of rows) {
                    row.stock_quantity = row.stock || 0;
                    allResults.push(row);
                }
            } catch (error) {
                console.error('❌ Medicines search failed:', error.message);
            }
        }

        // Search Medical Devices
        if (!type || type === 'device' || type === 'all') {
            let deviceQuery = `
                SELECT 
                    id, name, description, price, category, stock, image_url,
                    'device' as product_type, manufacturer
                FROM medical_devices
                WHERE 1 = 1
                `;
            let deviceParams = [];

            if (q) {
                deviceQuery += ` AND (name LIKE ? OR description LIKE ? OR category LIKE ? OR manufacturer LIKE ?)`;
                deviceParams.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
            }
            if (category) {
                deviceQuery += ` AND category = ? `;
                deviceParams.push(category);
            }
            if (minPrice) {
                deviceQuery += ` AND price >= ? `;
                deviceParams.push(minPrice);
            }
            if (maxPrice) {
                deviceQuery += ` AND price <= ? `;
                deviceParams.push(maxPrice);
            }

            try {
                const [rows] = await db.execute(deviceQuery, deviceParams);
                allResults.push(...rows.map(r => ({ ...r, stock_quantity: r.stock })));
            } catch (error) {
                console.log('Devices table query failed:', error.message);
            }
        }

        // Search Doctors
        if ((!type || type === 'doctor' || type === 'all') && !minPrice && !maxPrice) {
            let doctorQuery = `
                SELECT
                    id, name, specialization, phone, consultationFee as price,
                    'doctor' as product_type,
                    CONCAT(specialization, ' - ', COALESCE(experience, 0), ' years exp') as description,
                    specialization as category, rating, medicine_type, image as image_url, about, location, gender
                FROM doctors
                WHERE 1 = 1
                `;

            let doctorParams = [];
            if (q) {
                doctorQuery += ` AND (name LIKE ? OR specialization LIKE ? OR about LIKE ? OR location LIKE ?)`;
                doctorParams.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
            }
            if (medicineType) {
                doctorQuery += ` AND medicine_type = ?`;
                doctorParams.push(medicineType);
            }
            if (minRating) {
                doctorQuery += ` AND rating >= ?`;
                doctorParams.push(minRating);
            }

            if (type === 'doctor') {
                const [[{ total: doctorTotal }]] = await db.execute(`SELECT COUNT(*) as total FROM (${doctorQuery}) as t`, [...doctorParams]);
                total = doctorTotal;
                doctorQuery += ` LIMIT ${pageSize} OFFSET ${offset}`;
                // No need to push pageSize and offset to doctorParams anymore
            }

            try {
                const [rows] = await db.execute(doctorQuery, doctorParams);
                allResults.push(...rows.map(r => ({
                    ...r,
                    stock_quantity: null,
                    category: 'Doctor'
                })));
            } catch (error) {
                console.error('❌ Doctors search failed:', error.message);
            }
        }


        // Search Hospitals - Query BOTH tables (hospitals_with_specialties FIRST, then nabh_hospitals)
        if ((!type || type === 'hospital' || type === 'all')) {
            let hospitalQuery = `
                SELECT id, name, address as description, address, 'hospital' as product_type, 
                       rating, city, state, image_url, specialties, facilities, data_source
                FROM (
                    SELECT h.id, hospital_name as name, address,
                           COALESCE(r.avg_rating, 0) as rating,
                           city, state, NULL as image_url, 
                           specialties, facilities, 'Specialty' as data_source
                    FROM hospitals_with_specialties h
                    LEFT JOIN (
                        SELECT hospital_id, ROUND(AVG(rating), 1) as avg_rating
                        FROM hospital_reviews 
                        WHERE hospital_source = 'hospitals_with_specialties'
                        GROUP BY hospital_id
                    ) r ON h.id = r.hospital_id
                    WHERE 1 = 1
            `;
            let hospitalParams = [];

            // Build WHERE conditions for hospitals_with_specialties (FIRST)
            let specialtyConditions = [];
            if (q) {
                specialtyConditions.push(`(hospital_name LIKE ? OR address LIKE ? OR city LIKE ? OR specialties LIKE ? OR facilities LIKE ?)`);
                hospitalParams.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
            }
            if (city) {
                specialtyConditions.push(`city LIKE ?`);
                hospitalParams.push(`%${city}%`);
            }
            if (minRating) {
                specialtyConditions.push(`COALESCE(r.avg_rating, 0) >= ?`);
                hospitalParams.push(minRating);
            }

            if (specialtyConditions.length > 0) {
                hospitalQuery += ` AND ` + specialtyConditions.join(' AND ');
            }

            // Add UNION for nabh_hospitals (SECOND)
            hospitalQuery += `
                    UNION ALL
                    SELECT n.id, name, address,
                           COALESCE(r2.avg_rating, 0) as rating,
                           NULL as city, state, NULL as image_url, 
                           specialties, NULL as facilities, 'NABH' as data_source
                    FROM nabh_hospitals n
                    LEFT JOIN (
                        SELECT hospital_id, ROUND(AVG(rating), 1) as avg_rating
                        FROM hospital_reviews 
                        WHERE hospital_source = 'nabh_hospitals'
                        GROUP BY hospital_id
                    ) r2 ON n.id = r2.hospital_id
                    WHERE 1 = 1
            `;

            // Build WHERE conditions for nabh_hospitals (SECOND)
            let nabhConditions = [];
            if (q) {
                nabhConditions.push(`(name LIKE ? OR address LIKE ? OR state LIKE ? OR specialties LIKE ?)`);
                hospitalParams.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
            }
            if (city) {
                // Skip city filter for nabh_hospitals since it doesn't have city column
            }
            if (minRating) {
                nabhConditions.push(`COALESCE(r2.avg_rating, 0) >= ?`);
                hospitalParams.push(minRating);
            }

            if (nabhConditions.length > 0) {
                hospitalQuery += ` AND ` + nabhConditions.join(' AND ');
            }

            hospitalQuery += `
                ) AS combined_hospitals
            `;

            if (type === 'hospital') {
                const [[{ total: hospitalTotal }]] = await db.execute(`SELECT COUNT(*) as total FROM (${hospitalQuery}) as t`, [...hospitalParams]);
                total = hospitalTotal;
                hospitalQuery += ` LIMIT ${pageSize} OFFSET ${offset}`;
                // No need to push pageSize and offset to hospitalParams anymore
            }

            try {
                const [rows] = await db.execute(hospitalQuery, hospitalParams);
                allResults.push(...rows.map(r => ({
                    ...r,
                    stock_quantity: null,
                    category: 'Hospital',
                    description: r.description || 'Hospital'
                })));
            } catch (error) {
                console.error('❌ Hospitals search failed:', error.message);
            }
        }

        // Search Pharmacies
        if ((!type || type === 'pharmacy' || type === 'all')) {
            let pharmacyQuery = `
                SELECT id, name, address as description, phone, 'pharmacy' as product_type, rating, city, image_url, is_24x7, delivery_available
                FROM pharmacies
                WHERE 1 = 1
            `;
            let pharmacyParams = [];

            if (q) {
                pharmacyQuery += ` AND (name LIKE ? OR address LIKE ? OR city LIKE ?)`;
                pharmacyParams.push(`%${q}%`, `%${q}%`, `%${q}%`);
            }
            if (city) {
                pharmacyQuery += ` AND city LIKE ?`;
                pharmacyParams.push(`%${city}%`);
            }

            try {
                const [rows] = await db.execute(pharmacyQuery, pharmacyParams);
                allResults.push(...rows.map(r => ({
                    ...r,
                    stock_quantity: null,
                    category: 'Pharmacy'
                })));
            } catch (error) {
                console.error('Pharmacies search failed:', error.message);
            }
        }

        // Search Lab Tests
        if (!type || type === 'lab_test' || type === 'all') {
            let labQuery = `
                SELECT 
                    id, name, description, discounted_price as price, price as mrp, 
                    category, 'lab_test' as product_type
                FROM lab_tests
                WHERE 1 = 1
            `;
            let labParams = [];
            if (q) {
                labQuery += ` AND (name LIKE ? OR description LIKE ? OR category LIKE ?)`;
                labParams.push(`%${q}%`, `%${q}%`, `%${q}%`);
            }
            try {
                const [rows] = await db.execute(labQuery, labParams);
                allResults.push(...rows);
            } catch (error) {
                console.log('Lab tests query failed:', error.message);
            }
        }

        // Search Health Packages
        if (!type || type === 'health_package' || type === 'all') {
            let packageQuery = `
                SELECT 
                    id, name, description, discounted_price as price, price as mrp, 
                    'health_package' as product_type
                FROM health_packages
                WHERE 1 = 1
            `;
            let packageParams = [];
            if (q) {
                packageQuery += ` AND (name LIKE ? OR description LIKE ?)`;
                packageParams.push(`%${q}%`, `%${q}%`);
            }
            try {
                const [rows] = await db.execute(packageQuery, packageParams);
                allResults.push(...rows);
            } catch (error) {
                console.log('Health packages query failed:', error.message);
            }
        }

        if (!type || type === 'ayurveda_medicine' || type === 'all') {
            let ayurQuery = `
                SELECT id, name, description, price, category, 'ayurveda_medicine' as product_type, image_url, benefits
                FROM ayurveda_medicines
                WHERE 1 = 1
                `;
            let ayurParams = [];
            if (q) {
                ayurQuery += ` AND (name LIKE ? OR description LIKE ? OR category LIKE ? OR benefits LIKE ?)`;
                ayurParams.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
            }
            try {
                const [rows] = await db.execute(ayurQuery, ayurParams);
                allResults.push(...rows);
            } catch (error) {
                console.error('Ayurveda medicines search failed:', error.message);
            }
        }

        // Search Ayurveda Exercises
        if (!type || type === 'ayurveda_exercise' || type === 'all') {
            let exerciseQuery = `
                SELECT id, name, description, NULL as price, 'ayurveda_exercise' as product_type, image_url, benefits
                FROM ayurveda_exercises
                WHERE 1 = 1
                `;
            let exParams = [];
            if (q) {
                exerciseQuery += ` AND (name LIKE ? OR description LIKE ? OR benefits LIKE ?)`;
                exParams.push(`%${q}%`, `%${q}%`, `%${q}%`);
            }
            try {
                const [rows] = await db.execute(exerciseQuery, exParams);
                allResults.push(...rows);
            } catch (error) {
                console.error('Ayurveda exercises search failed:', error.message);
            }
        }

        // Search Ayurveda Articles
        if (!type || type === 'ayurveda_article' || type === 'all') {
            let articleQuery = `
                SELECT id, title as name, excerpt as description, NULL as price, category, 'ayurveda_article' as product_type, image_url, author
                FROM ayurveda_articles
                WHERE 1 = 1
                `;
            let artParams = [];
            if (q) {
                articleQuery += ` AND (title LIKE ? OR excerpt LIKE ? OR category LIKE ? OR content LIKE ?)`;
                artParams.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
            }
            try {
                const [rows] = await db.execute(articleQuery, artParams);
                allResults.push(...rows);
            } catch (error) {
                console.log('Ayurveda articles query failed:', error.message);
            }
        }

        // Search Static Pages
        if (!type || type === 'page' || type === 'all') {
            let pageQuery = `
                SELECT id, title as name, NULL as price, 'page' as product_type
                FROM static_pages
                WHERE 1 = 1
            `;
            let pageParams = [];
            if (q) {
                pageQuery += ` AND (title LIKE ?)`;
                pageParams.push(`%${q}%`);
            }
            try {
                const [rows] = await db.execute(pageQuery, pageParams);
                allResults.push(...rows);
            } catch (error) {
                console.error('Static pages search failed:', error.message);
            }
        }

        // Search Ayurveda Herbs
        if (!type || type === 'herb' || type === 'all') {
            let herbQuery = `
                SELECT id, name, scientific_name, description, benefits, usage_instructions, image_url, pacify, tridosha, 'herb' as product_type
                FROM ayurveda_herbs
                WHERE 1 = 1
            `;
            let herbParams = [];
            if (q) {
                herbQuery += ` AND (name LIKE ? OR scientific_name LIKE ? OR description LIKE ? OR benefits LIKE ?)`;
                herbParams.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
            }
            try {
                const [rows] = await db.execute(herbQuery, herbParams);
                // Parse JSON fields for herbs
                const parsedHerbs = rows.map(herb => ({
                    ...herb,
                    pacify: typeof herb.pacify === 'string' ? JSON.parse(herb.pacify || '[]') : herb.pacify,
                    tridosha: herb.tridosha === 1 || herb.tridosha === true
                }));
                allResults.push(...parsedHerbs);
            } catch (error) {
                console.error('Ayurveda herbs search failed:', error.message);
            }
        }

        // Search Ayurveda Yoga Poses
        if (!type || type === 'yoga_pose' || type === 'all') {
            let yogaQuery = `
                SELECT id, name, sanskrit_name, description, benefits, image_url, difficulty, 'yoga_pose' as product_type
                FROM ayurveda_yoga_poses
                WHERE 1 = 1
            `;
            let yogaParams = [];
            if (q) {
                yogaQuery += ` AND (name LIKE ? OR sanskrit_name LIKE ? OR description LIKE ? OR benefits LIKE ?)`;
                yogaParams.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
            }
            try {
                const [rows] = await db.execute(yogaQuery, yogaParams);
                allResults.push(...rows);
            } catch (error) {
                console.error('Yoga poses search failed:', error.message);
            }
        }

        // Search General Health Articles
        if (!type || type === 'article' || type === 'all') {
            let articleQuery = `
                SELECT id, title as name, excerpt as description, image_url, author, category, 'article' as product_type
                FROM health_articles
                WHERE is_published = true
            `;
            let articleParams = [];
            if (q) {
                articleQuery += ` AND (title LIKE ? OR excerpt LIKE ? OR category LIKE ?)`;
                articleParams.push(`%${q}%`, `%${q}%`, `%${q}%`);
            }
            try {
                const [rows] = await db.execute(articleQuery, articleParams);
                allResults.push(...rows);
            } catch (error) {
                console.error('Health articles search failed:', error.message);
            }
        }

        // NEW: Search Ayurveda Knowledge (Diseases)
        if (!type || type === 'disease' || type === 'all') {
            let knowledgeQuery = `
                SELECT 
                    id, disease as name, symptoms as description, NULL as price, 
                    'disease' as product_type, ayur_herbs as category, herbal_remedies as uses,
                    prevention, diet_recommendations as quick_tips
                FROM (
                    SELECT 
                        id, disease, symptoms, ayurvedic_herbs as ayur_herbs, 
                        herbal_remedies, prevention, diet_lifestyle_recommendations as diet_recommendations
                    FROM ayurveda_knowledge
                ) as k
                WHERE 1 = 1
            `;
            let knowledgeParams = [];
            if (q) {
                knowledgeQuery += ` AND (disease LIKE ? OR symptoms LIKE ? OR ayur_herbs LIKE ? OR herbal_remedies LIKE ? OR prevention LIKE ?)`;
                knowledgeParams.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
            }
            try {
                const [rows] = await db.execute(knowledgeQuery, knowledgeParams);
                allResults.push(...rows.map(r => ({
                    ...r,
                    category: r.category || 'Ayurveda Condition',
                    uses: r.uses ? r.uses.split(',').map(s => s.trim()) : [],
                    quick_tips: r.quick_tips ? r.quick_tips.split('.').map(s => s.trim().replace(/^•\s*/, '')).filter(s => s) : []
                })));
            } catch (error) {
                console.error('Ayurveda knowledge search failed:', error.message);
            }
        }

        const sortMap = {
            'price_asc': (a, b) => (a.price || 0) - (b.price || 0),
            'price_desc': (a, b) => (b.price || 0) - (a.price || 0),
            'name_asc': (a, b) => (a.name || '').localeCompare(b.name || ''),
            'name_desc': (a, b) => (b.name || '').localeCompare(a.name || '')
        };

        const sortFn = sortMap[sortBy] || sortMap['name_asc'];

        const typePriority = [
            'hospital',
            'doctor',
            'medicine',
            'device',
            'pharmacy',
            'lab_test',
            'health_package',
            'ayurveda_medicine',
            'ayurveda_exercise',
            'herb',
            'disease',
            'yoga_pose',
            'article',
            'page'
        ];

        const prioritySortFn = (a, b) => {
            const indexA = typePriority.indexOf(a.product_type);
            const indexB = typePriority.indexOf(b.product_type);

            // If priority is same, use the selected sortFn
            if (indexA === indexB) {
                return sortFn(a, b);
            }

            // If one is not in priority list, move to end
            const pA = indexA === -1 ? 999 : indexA;
            const pB = indexB === -1 ? 999 : indexB;

            return pA - pB;
        };

        const sortFnToUse = (!type || type === 'all') ? prioritySortFn : sortFn;

        // If type is "all", we need to sort and paginate the combined results
        if (!type || type === 'all' || !['medicine', 'doctor', 'hospital'].includes(type)) {
            allResults.sort(sortFnToUse);

            // Apply category capping for diversity
            // On mobile (limit 12), we cap at 8 to ensure variety (12 - 8 = 4 slots for others)
            // On desktop (limit 20), we cap at 9
            const categoryCap = (validLimit <= 12) ? 8 : 9;
            const counts = {};
            const cappedResults = [];

            for (const result of allResults) {
                const cat = result.product_type;
                counts[cat] = (counts[cat] || 0) + 1;
                if (counts[cat] <= categoryCap) {
                    cappedResults.push(result);
                }
            }

            // Apply pagination to aggregated and capped list
            total = cappedResults.length;
            allResults = cappedResults.slice(offset, offset + pageSize);
        }

        res.json({
            success: true,
            data: {
                results: allResults,
                pagination: {
                    page: validPage,
                    limit: pageSize,
                    total: total,
                    totalPages: Math.ceil(total / pageSize)
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

// Get autocomplete suggestions - OPTIMIZED FOR SPEED
exports.getSuggestions = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.json({
                success: true,
                data: []
            });
        }

        // Use 'term%' pattern for better index performance (prefix matching)
        const prefixPattern = `${q}%`;
        // Fallback to '%term%' for partial matching (slower but more comprehensive)
        const containsPattern = `%${q}%`;

        // Execute ALL queries in PARALLEL for maximum speed
        const queryPromises = [
            // Medicines (Most Important - try prefix first)
            db.execute(`
                SELECT name, price, category, 'medicine' as product_type
                FROM medicines
                WHERE name LIKE ?
                LIMIT 3
            `, [prefixPattern])
                .catch(err => { console.log('Medicine suggestions failed:', err.message); return [[]]; }),

            // Doctors
            db.execute(`
                SELECT name, consultationFee as price, specialization as category, 'doctor' as product_type
                FROM doctors
                WHERE name LIKE ? OR specialization LIKE ?
                LIMIT 2
            `, [prefixPattern, containsPattern])
                .catch(err => { console.log('Doctor suggestions failed:', err.message); return [[]]; }),

            // Hospitals - hospitals_with_specialties FIRST, then nabh_hospitals
            db.execute(`
                SELECT name, NULL as price, 'Hospital' as category, 'hospital' as product_type
                FROM (
                    SELECT hospital_name as name FROM hospitals_with_specialties WHERE hospital_name LIKE ? OR city LIKE ?
                    UNION ALL
                    SELECT name FROM nabh_hospitals WHERE name LIKE ? OR state LIKE ?
                ) AS combined_hospitals
                LIMIT 2
            `, [prefixPattern, containsPattern, prefixPattern, containsPattern])
                .catch(err => { console.log('Hospital suggestions failed:', err.message); return [[]]; }),

            // Lab Tests
            db.execute(`
                SELECT name, discounted_price as price, category, 'lab_test' as product_type
                FROM lab_tests
                WHERE name LIKE ?
                LIMIT 2
            `, [prefixPattern])
                .catch(err => { console.log('Lab test suggestions failed:', err.message); return [[]]; }),

            // Pharmacies
            db.execute(`
                SELECT name, NULL as price, 'Pharmacy' as category, 'pharmacy' as product_type
                FROM pharmacies
                WHERE name LIKE ?
                LIMIT 1
            `, [prefixPattern])
                .catch(err => { console.log('Pharmacy suggestions failed:', err.message); return [[]]; }),

            // Ayurveda Medicines
            db.execute(`
                SELECT name, price, category, 'ayurveda_medicine' as product_type
                FROM ayurveda_medicines
                WHERE name LIKE ?
                LIMIT 1
            `, [prefixPattern])
                .catch(err => { console.log('Ayurveda suggestions failed:', err.message); return [[]]; })
        ];

        // Wait for all queries to complete in parallel
        const results = await Promise.all(queryPromises);

        // Flatten results
        let allSuggestions = [];
        results.forEach(([rows]) => {
            if (rows && rows.length > 0) {
                allSuggestions.push(...rows);
            }
        });

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