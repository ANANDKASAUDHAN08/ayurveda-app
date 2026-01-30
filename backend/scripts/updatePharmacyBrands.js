const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Mysqlpassak@7876',
    database: 'healthConnect_db'
};

// Brand mapping: patterns to canonical brand names
// Patterns are checked in order, so put more specific patterns first
const BRAND_MAPPING = [
    { patterns: ['apollo pharmacy', 'apollo'], canonical: 'Apollo Pharmacy' },
    { patterns: ['tata 1mg', '1mg'], canonical: 'Tata 1mg' },
    { patterns: ['wellness forever', 'wellness'], canonical: 'Wellness Forever' },
    { patterns: ['medplus'], canonical: 'MedPlus' },
    { patterns: ['pharmeasy'], canonical: 'PharmEasy' },
    { patterns: ['netmeds'], canonical: 'Netmeds' },
    { patterns: ['healthkart'], canonical: 'HealthKart' },
    { patterns: ['guardian pharmacy', 'guardian'], canonical: 'Guardian Pharmacy' },
    { patterns: ['fortis healthworld', 'fortis'], canonical: 'Fortis Healthworld' },
    { patterns: ['max health', 'max'], canonical: 'Max Healthcare' },
    { patterns: ['medlife'], canonical: 'Medlife' },
    { patterns: ['cipla'], canonical: 'Cipla' },
    { patterns: ['dr. reddy', 'dr reddy'], canonical: 'Dr. Reddy\'s' },
    { patterns: ['sun pharma'], canonical: 'Sun Pharma' },
    { patterns: ['chemist shop'], canonical: 'Chemist Shop' },
    { patterns: ['medical store'], canonical: 'Medical Store' },
    { patterns: ['medicine shop'], canonical: 'Medicine Shop' },
    { patterns: ['medicos'], canonical: 'Medicos' },
    { patterns: ['chemist'], canonical: 'Chemist' },
    { patterns: ['pharmacy'], canonical: 'Pharmacy' }
];

async function extractBrandFromName(name) {
    if (!name) return 'Independent';

    const nameLower = name.toLowerCase();

    // Check brand mappings in order (more specific first)
    for (const brandMap of BRAND_MAPPING) {
        for (const pattern of brandMap.patterns) {
            if (nameLower.includes(pattern)) {
                return brandMap.canonical;
            }
        }
    }

    return 'Independent';
}

async function updatePharmacyBrands() {
    let connection;

    try {
        console.log('📂 Reading pharmacy data...');
        const dataPath = path.join(__dirname, '../data/pharmacies/chemist-shops.json');
        const pharmaciesData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

        console.log(`✅ Loaded ${pharmaciesData.length} pharmacies\n`);

        // Extract brands and count occurrences
        console.log('🔍 Analyzing pharmacy names and extracting brands...');
        const brandCounts = new Map();
        const pharmacyBrands = new Map();

        for (const pharmacy of pharmaciesData) {
            const brand = await extractBrandFromName(pharmacy.name);
            pharmacyBrands.set(pharmacy.osm_id, brand);
            brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
        }

        // Filter brands that appear at least 2 times (excluding "Independent")
        const popularBrands = Array.from(brandCounts.entries())
            .filter(([brand, count]) => count >= 2 && brand !== 'Independent')
            .sort((a, b) => b[1] - a[1]);

        console.log('\n📊 Brand Statistics:');
        console.log('━'.repeat(60));
        console.log('Popular Brands (appearing 2+ times):');
        popularBrands.forEach(([brand, count]) => {
            console.log(`  • ${brand.padEnd(30)} ${count} locations`);
        });

        const independentCount = brandCounts.get('Independent') || 0;
        console.log(`\n  • ${'Independent'.padEnd(30)} ${independentCount} locations`);
        console.log('━'.repeat(60));

        // Connect to database
        console.log('\n🔗 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database\n');

        // Check if brand column exists, if not add it
        console.log('🔧 Checking database schema...');
        const [columns] = await connection.query(
            'SHOW COLUMNS FROM pharmacies LIKE "brand"'
        );

        if (columns.length === 0) {
            console.log('➕ Adding brand column to pharmacies table...');
            await connection.query(
                'ALTER TABLE pharmacies ADD COLUMN brand VARCHAR(100) DEFAULT "Independent"'
            );
            console.log('✅ Brand column added\n');
        } else {
            console.log('✅ Brand column already exists\n');
        }


        // Update brands in database
        console.log('💾 Updating pharmacy brands in database...');
        let updated = 0;
        let notFound = 0;

        for (const pharmacy of pharmaciesData) {
            const brand = pharmacyBrands.get(pharmacy.osm_id);

            // Only update if brand is in popular brands or is Independent
            const shouldUpdate = brand === 'Independent' ||
                popularBrands.some(([b]) => b === brand);

            if (shouldUpdate) {
                try {
                    // Try to find pharmacy by name and city
                    const result = await connection.query(
                        'UPDATE pharmacies SET brand = ? WHERE name = ? AND city = ? LIMIT 1',
                        [brand, pharmacy.name, pharmacy.city]
                    );

                    if (result[0].affectedRows > 0) {
                        updated++;
                        if (updated % 100 === 0) {
                            console.log(`  ⏳ Updated ${updated} pharmacies...`);
                        }
                    } else {
                        notFound++;
                    }
                } catch (err) {
                    console.error(`  ⚠️  Error updating ${pharmacy.name}:`, err.message);
                }
            }
        }

        console.log(`\n✅ Successfully updated ${updated} pharmacy brands!`);
        if (notFound > 0) {
            console.log(`⚠️  ${notFound} pharmacies from JSON not found in database (may have different names)`);
        }

        // Verify the update
        console.log('\n📈 Final Brand Distribution in Database:');
        console.log('━'.repeat(60));
        const [brandStats] = await connection.query(`
            SELECT brand, COUNT(*) as count 
            FROM pharmacies 
            WHERE brand != 'Independent' AND brand IS NOT NULL
            GROUP BY brand 
            HAVING count >= 2
            ORDER BY count DESC
        `);

        brandStats.forEach(row => {
            console.log(`  • ${row.brand.padEnd(30)} ${row.count} locations`);
        });

        const [independentStats] = await connection.query(`
            SELECT COUNT(*) as count 
            FROM pharmacies 
            WHERE brand = 'Independent' OR brand IS NULL
        `);
        console.log(`\n  • ${'Independent'.padEnd(30)} ${independentStats[0].count} locations`);
        console.log('━'.repeat(60));

        console.log('\n🎉 All done! Pharmacy brands have been updated successfully.');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed.');
        }
    }
}

// Run the script
updatePharmacyBrands().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
