const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../src/config/database');

const JSON_FILE = path.join(__dirname, '../data/labs/private-labs-master.json');

async function importLaboratories() {
    try {
        if (!fs.existsSync(JSON_FILE)) {
            console.error('❌ Data file not found. Run downloadLabLocations.js first.');
            process.exit(1);
        }

        const data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
        console.log(`🚀 Starting import of ${data.length} laboratories...`);

        // Clear existing data from private labs
        await db.execute("TRUNCATE TABLE laboratories");

        const query = `
            INSERT INTO laboratories (
                name, address, city, state, pincode, phone, website, timings, services, latitude, longitude, 
                is_nabl_accredited, is_cghs_empanelled, data_source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        let count = 0;
        for (const lab of data) {
            await db.execute(query, [
                lab.name,
                lab.address,
                lab.city,
                lab.state,
                lab.pincode,
                lab.phone,
                lab.website || null,
                lab.timings || null,
                lab.services ? JSON.stringify(lab.services) : null,
                lab.latitude,
                lab.longitude,
                lab.is_nabl_accredited ? 1 : 0,
                lab.is_cghs_empanelled ? 1 : 0,
                lab.data_source
            ]);
            count++;
        }

        console.log(`✅ Successfully imported ${count} laboratories.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error importing laboratories:', error);
        process.exit(1);
    }
}

importLaboratories();
