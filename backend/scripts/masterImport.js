const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../src/config/database');

const DATA_DIR = path.join(__dirname, '../data/hospitals');
const NIN_FILE = path.join(DATA_DIR, 'nin_health_facilities.csv');
const BATCH_SIZE = 1000;

async function runImport() {
    console.log('🚀 Starting Master Global Hospital Consolidation...');

    // 1. Clear existing data
    console.log('🗑️  Clearing database for fresh import...');
    await db.query('DELETE FROM hospitals');

    // 2. Load all enrichment data into a single map
    const enrichmentMap = new Map();
    const files = [
        'hospitals_covid_viz.csv',
        'cghs_empanelled_raw.csv',
        'india_hospitals_scraped.csv'
    ];

    for (const fileName of files) {
        const filePath = path.join(DATA_DIR, fileName);
        if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
            console.log(`📖 Reading ${fileName}...`);

            if (fileName.endsWith('.json')) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const rows = Array.isArray(data) ? data : (data.features || []);

                rows.forEach(item => {
                    const row = item.properties || item; // Handle GeoJSON or simple Array
                    const name = (row.name || row['Hospital Name'] || row['Health Facility Name'] || '').toLowerCase().trim();
                    const pincode = (row.pincode || row['PIN Code'] || row['Pincode'] || row['Postcode'] || '').trim();
                    if (name) {
                        const key = `${name}_${pincode}`;
                        const existing = enrichmentMap.get(key) || {};
                        enrichmentMap.set(key, { ...existing, ...row });
                    }
                });
            } else {
                await new Promise((resolve) => {
                    fs.createReadStream(filePath)
                        .pipe(csv())
                        .on('data', (row) => {
                            const name = (row.name || row['Hospital Name'] || row['Health Facility Name'] || '').toLowerCase().trim();
                            const pincode = (row.pincode || row['PIN Code'] || row['Pincode'] || row['Postcode'] || '').trim();
                            if (name) {
                                const key = `${name}_${pincode}`;
                                const existing = enrichmentMap.get(key) || {};
                                enrichmentMap.set(key, { ...existing, ...row });
                            }
                        })
                        .on('end', resolve);
                });
            }
        }
    }

    // 3. Process NIN Backbone
    if (!fs.existsSync(NIN_FILE) || fs.statSync(NIN_FILE).size === 0) {
        console.error('❌ ERROR: nin_health_facilities.csv not found or empty. This is the backbone!');
        process.exit(1);
    }

    console.log('🏗️  Importing NIN Backbone with multi-source enrichment...');
    let batch = [];
    let count = 0;

    const stream = fs.createReadStream(NIN_FILE).pipe(csv());

    for await (const row of stream) {
        const name = row['Health Facility Name'] || 'Unnamed Facility';
        const pincode = row['pincode'];
        const facilityType = row['Facility Type'] || 'Hospital';
        const key = `${name.toLowerCase().trim()}_${pincode}`;

        const enriched = enrichmentMap.get(key) || {};

        // Ownership / Type Logic
        let typeEnum = 'government';
        const lowerName = name.toLowerCase();
        const lowerFType = facilityType.toLowerCase();
        const ownership = enriched.ownership || row['Ownership'] || (typeEnum === 'government' ? 'Government' : 'Private');

        if (lowerName.includes('apollo') || lowerName.includes('max ') || lowerName.includes('fortis') || lowerName.includes('hospital limited')) {
            typeEnum = 'private';
        } else if (lowerName.includes('charitable') || lowerName.includes('mission') || lowerName.includes('trust')) {
            typeEnum = 'charitable';
        } else if (lowerFType.includes('others')) {
            typeEnum = 'private';
        }

        const hospital = [
            name,
            row['Address'] || enriched.address || '',
            enriched.description || enriched.specialties || null,
            row['District_Name'] || row['locality'] || enriched.city || 'Unknown',
            row['State_Name'] || enriched.state || 'India',
            pincode || enriched.pincode || null,
            row['landline_number'] || enriched.phone || enriched.contact || null,
            enriched.emergency_phone || null,
            enriched.email || null,
            enriched.website || null,
            typeEnum,
            facilityType,
            ownership,
            1, // has_emergency
            0, // has_ambulance
            0, // has_icu
            0, // beds_available
            enriched.specialties || null,
            enriched.facilities || null,
            0.0, // rating
            'Global-Import',
            parseFloat(row['latitude']) || null,
            parseFloat(row['longitude']) || null
        ];

        batch.push(hospital);
        count++;

        if (batch.length >= BATCH_SIZE) {
            await insertBatch(batch);
            batch = [];
            process.stdout.write(`\r✅ Processed: ${count} health facilities`);
        }
    }

    if (batch.length > 0) await insertBatch(batch);

    console.log(`\n🎉 Success! Consolidated ${count} health facilities.`);
    process.exit(0);
}

async function insertBatch(batch) {
    const query = `
        INSERT INTO hospitals 
        (name, address, description, city, state, pincode, phone, emergency_phone, email, website, type, 
         facility_type, ownership, has_emergency, has_ambulance, has_icu, beds_available, specialties, facilities, rating, data_source, latitude, longitude) 
        VALUES ?
    `;
    await db.query(query, [batch]);
}

runImport().catch(err => {
    console.error('❌ Import failed:', err);
    process.exit(1);
});
