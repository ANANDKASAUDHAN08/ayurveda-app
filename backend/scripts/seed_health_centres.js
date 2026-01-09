const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../src/config/database');

const csvPath = path.join(__dirname, '../data/geocode_health_centre.csv');
const BATCH_SIZE = 1000;

async function seedHealthCentres() {
    console.log('🌱 Health Centres Data Seeder');
    console.log('================================\n');

    try {
        // Step 1: Check if table exists
        console.log('📊 Checking table...');
        try {
            const [rows] = await db.execute('SELECT COUNT(*) as count FROM health_centres');
            const count = rows[0].count;

            if (count > 0) {
                console.log(`⚠️  Table already has ${count} records`);
                console.log('\n❌ Seeding skipped: Data already exists');
                console.log('   To re-seed:');
                console.log('   1. Drop table: npm run init:health-centres');
                console.log('   2. Run seed again\n');
                process.exit(0);
            }

            console.log('✅ Table is empty. Ready to seed.\n');
        } catch (error) {
            if (error.code === 'ER_NO_SUCH_TABLE') {
                console.log('❌ Table does not exist!');
                console.log('   Run: npm run init:health-centres\n');
                process.exit(1);
            }
            throw error;
        }

        // Step 2: Check CSV file
        console.log('📁 Checking CSV file...');
        if (!fs.existsSync(csvPath)) {
            console.log(`❌ CSV file not found: ${csvPath}`);
            console.log('\n💡 Please ensure geocode_health_centre.csv is in backend/data/\n');
            process.exit(1);
        }

        const stats = fs.statSync(csvPath);
        console.log(`✅ Found: ${(stats.size / 1024 / 1024).toFixed(2)} MB\n`);

        // Step 3: Seed data
        console.log('🚀 Starting import...\n');
        let batch = [];
        let processedCount = 0;
        let errorCount = 0;

        const stream = fs.createReadStream(csvPath).pipe(csv());

        for await (const row of stream) {
            batch.push([
                row['State Name'],
                row['District Name'],
                row['Subdistrict Name'],
                row['Facility Type'],
                row['Facility Name'],
                row['Facility Address'],
                parseFloat(row['Latitude']) || null,
                parseFloat(row['Longitude']) || null,
                row['ActiveFlag_C'],
                row['Location Type'],
                row['Type Of Facility']
            ]);

            if (batch.length >= BATCH_SIZE) {
                try {
                    await insertBatch(batch);
                    processedCount += batch.length;
                    console.log(`   ✅ Processed ${processedCount.toLocaleString()} records...`);
                } catch (error) {
                    errorCount++;
                    console.log(`   ⚠️  Batch error: ${error.message}`);
                }
                batch = [];
            }
        }

        // Insert remaining batch
        if (batch.length > 0) {
            try {
                await insertBatch(batch);
                processedCount += batch.length;
            } catch (error) {
                errorCount++;
                console.log(`   ⚠️  Final batch error: ${error.message}`);
            }
        }

        console.log('\n================================');
        console.log(`✅ Seeding complete!`);
        console.log(`   Total records: ${processedCount.toLocaleString()}`);
        if (errorCount > 0) {
            console.log(`   Errors: ${errorCount}`);
        }
        console.log('================================\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Seeding failed:', error.message);
        process.exit(1);
    }
}

async function insertBatch(batch) {
    const query = `
        INSERT INTO health_centres 
        (state_name, district_name, subdistrict_name, facility_type, facility_name, facility_address, latitude, longitude, active_flag, location_type, type_of_facility) 
        VALUES ?
    `;
    await db.query(query, [batch]);
}

seedHealthCentres();
