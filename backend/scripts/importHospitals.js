const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = require('../src/config/database');

/**
 * Import Indian Hospital/Health Facilities from GitHub GeoJSON
 * Source: planemad/india_health_facilities
 */

const JSON_FILE = path.join(__dirname, '../data/indian-hospitals.json');
const BATCH_SIZE = 500;

async function importHospitals() {
    console.log('📊 Starting Indian Hospital Directory Import...');
    console.log(`📁 Reading from: ${JSON_FILE}`);

    // Check if file exists
    if (!fs.existsSync(JSON_FILE)) {
        console.error('\n❌ JSON file not found!');
        console.log('💡 Please download the file first:');
        console.log('   node backend/scripts/downloadHospitalData.js');
        process.exit(1);
    }

    // Delete old imported data
    console.log('\n🗑️  Removing old imported data...');
    await db.execute(`DELETE FROM hospitals WHERE data_source = 'GitHub-HealthFacilities'`);
    console.log('✅ Old data cleared\n');

    // Read and parse GeoJSON
    const rawData = fs.readFileSync(JSON_FILE, 'utf-8');
    const geoData = JSON.parse(rawData);

    if (!geoData.features || !Array.isArray(geoData.features)) {
        console.error('❌ Invalid GeoJSON format');
        process.exit(1);
    }

    const hospitals = [];
    let rowCount = 0;
    let importedCount = 0;
    let errorCount = 0;

    console.log(`📋 Found ${geoData.features.length} health facilities in file\n`);

    for (const feature of geoData.features) {
        rowCount++;

        try {
            const props = feature.properties || {};
            const coords = feature.geometry && feature.geometry.coordinates;

            // Map GeoJSON properties to database
            const hospital = {
                name: props.name || props.facility_name || props.NAME || 'Health Facility',
                address: props.address || props.ADDRESS || null,
                city: props.city || props.CITY || props.district || props.DISTRICT || null,
                state: props.state || props.STATE || null,
                phone: props.phone || props.PHONE || props.contact || null,
                latitude: coords ? coords[1] : null, // GeoJSON is [lng, lat]
                longitude: coords ? coords[0] : null,
                pincode: props.pincode || props.PIN || null,
                facility_type: props.facility_type || props.type || Props.TYPE || 'Hospital',
                ownership: props.ownership || props.OWNERSHIP || 'Government',
                specializations: props.services || props.specialization || null,
                data_source: 'GitHub-HealthFacilities'
            };

            hospitals.push(hospital);

            // Import in batches
            if (hospitals.length >= BATCH_SIZE) {
                await importBatch(hospitals);
                importedCount += hospitals.length;
                hospitals.length = 0;

                process.stdout.write(`\r✅ Imported: ${importedCount} facilities`);
            }
        } catch (error) {
            errorCount++;
            if (errorCount <= 10) {
                console.error(`\n⚠️  Error parsing feature ${rowCount}:`, error.message);
            }
        }
    }

    // Import remaining hospitals
    if (hospitals.length > 0) {
        await importBatch(hospitals);
        importedCount += hospitals.length;
    }

    console.log(`\n\n🎉 Import Complete!`);
    console.log(`📊 Total facilities read: ${rowCount}`);
    console.log(`✅ Successfully imported: ${importedCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    // Show sample data
    console.log('\n📋 Sample facilities imported:');
    const [samples] = await db.execute(`
        SELECT name, city, state, facility_type, latitude, longitude
        FROM hospitals 
        WHERE data_source = 'GitHub-HealthFacilities' 
        LIMIT 5
    `);
    console.table(samples);

    // Show stats by state
    console.log('\n📊 Facilities by State (Top 10):');
    const [stateStats] = await db.execute(`
        SELECT state, COUNT(*) as count 
        FROM hospitals 
        WHERE data_source = 'GitHub-HealthFacilities' AND state IS NOT NULL
        GROUP BY state 
        ORDER BY count DESC
        LIMIT 10
    `);
    console.table(stateStats);

    process.exit(0);
}

async function importBatch(hospitals) {
    if (hospitals.length === 0) return;

    try {
        const placeholders = hospitals.map(() =>
            '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).join(',');

        const values = [];
        hospitals.forEach(h => {
            values.push(
                h.name,
                h.address,
                h.city,
                h.state,
                h.phone,
                h.latitude,
                h.longitude,
                h.pincode,
                h.facility_type,
                h.ownership,
                h.specializations,
                h.data_source
            );
        });

        const query = `
            INSERT INTO hospitals 
            (name, address, city, state, phone, latitude, longitude, pincode, 
             facility_type, ownership, specializations, data_source) 
            VALUES ${placeholders}
        `;

        await db.execute(query, values);
    } catch (error) {
        console.error('\n❌ Batch import error:', error.message);
        throw error;
    }
}

// Handle errors
process.on('unhandledRejection', (error) => {
    console.error('\n❌ Unhandled error:', error);
    process.exit(1);
});

// Start import
importHospitals();
