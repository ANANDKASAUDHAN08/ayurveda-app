const db = require('../src/config/database');

async function initHealthCentres() {
    try {
        console.log('🏥 Initializing health_centres table...\n');

        // Check if table exists and has data
        let hasData = false;
        try {
            const [rows] = await db.execute('SELECT COUNT(*) as count FROM health_centres');
            hasData = rows[0].count > 0;

            if (hasData) {
                console.log(`⚠️  Table already exists with ${rows[0].count} records`);
                console.log('\n❌ Aborting: Will not drop table with existing data!');
                console.log('   If you really want to recreate:');
                console.log('   1. Backup data first');
                console.log('   2. Manually run: DROP TABLE health_centres;');
                console.log('   3. Run this script again\n');
                process.exit(0);
            }
        } catch (error) {
            // Table doesn't exist, we can create it
            console.log('📋 Table does not exist. Creating...');
        }

        // Drop table only if no data exists
        console.log('🗑️  Dropping existing empty table (if any)...');
        await db.execute('DROP TABLE IF EXISTS health_centres');

        // Create table
        console.log('📊 Creating health_centres table...');
        const query = `
            CREATE TABLE IF NOT EXISTS health_centres (
                id INT AUTO_INCREMENT PRIMARY KEY,
                state_name VARCHAR(100),
                district_name VARCHAR(100),
                subdistrict_name VARCHAR(100),
                facility_type VARCHAR(50),
                facility_name VARCHAR(255),
                facility_address TEXT,
                latitude DOUBLE,
                longitude DOUBLE,
                active_flag VARCHAR(10),
                location_type VARCHAR(50),
                type_of_facility VARCHAR(50),
                INDEX idx_lat_lng (latitude, longitude),
                INDEX idx_state_district (state_name, district_name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await db.execute(query);
        console.log('✅ Table health_centres created successfully!\n');
        console.log('💡 Next step: Run seed script to populate data');
        console.log('   npm run seed:health-centres\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating table:', error.message);
        process.exit(1);
    }
}

initHealthCentres();
