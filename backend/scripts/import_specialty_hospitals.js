const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../src/config/database');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const CSV_FILE = path.join(__dirname, '../data/hospitals/hospitals_with_specialties.csv');
const BATCH_SIZE = 500;

async function importSpecialtyHospitals() {
    console.log('🚀 Starting Specialty Hospitals Import...');
    console.log(`📁 Reading from: ${CSV_FILE}`);

    if (!fs.existsSync(CSV_FILE)) {
        console.error('❌ CSV file not found!');
        process.exit(1);
    }

    try {
        // Clear existing data in the new table
        console.log('🗑️  Clearing existing data from hospitals_with_specialties...');
        await db.query('TRUNCATE TABLE hospitals_with_specialties');
        console.log('✅ Table cleared\n');

        let importedCount = 0;
        let batch = [];
        let rowCount = 0;

        const readStream = fs.createReadStream(CSV_FILE).pipe(csv([
            'id', 'State', 'District', 'Hospital Name', 'Type', 'System', 'Address', 'Pincode', 'Email', 'Website', 'Specialties', 'Facilities'
        ]));

        for await (const record of readStream) {
            rowCount++;
            const hospital = [
                record['State'] || null,
                record['District'] || null,
                record['Hospital Name'] || null,
                record['Type'] || null,
                record['System'] || null,
                record['Address'] || null,
                record['Pincode'] || null,
                record['Email'] === 'NA' ? null : record['Email'],
                record['Website'] === 'NA' ? null : record['Website'],
                record['Specialties'] || null,
                record['Facilities'] || null
            ];

            batch.push(hospital);

            if (batch.length >= BATCH_SIZE) {
                await insertBatch(batch);
                importedCount += batch.length;
                batch = [];
                process.stdout.write(`\r✅ Imported: ${importedCount} hospitals`);
            }
        }

        if (batch.length > 0) {
            await insertBatch(batch);
            importedCount += batch.length;
        }

        console.log(`\n\n🎉 Import Complete!`);
        console.log(`📊 Total rows read: ${rowCount}`);
        console.log(`✅ Successfully imported: ${importedCount} hospitals`);
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Import failed:', error.message);
        process.exit(1);
    }
}

async function insertBatch(batch) {
    const query = `
        INSERT INTO hospitals_with_specialties 
        (state, city, hospital_name, hospital_type, hospital_system, address, pincode, email, website, specialties, facilities) 
        VALUES ?
    `;
    await db.query(query, [batch]);
}


if (require.main === module) {
    importSpecialtyHospitals();
}

module.exports = { importSpecialtyHospitals };
