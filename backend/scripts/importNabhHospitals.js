const fs = require('fs');
const path = require('path');
const db = require('../src/config/database');

const JSON_FILE = path.join(__dirname, '../data/hospitals/nabh_accredited_list.json');

async function importNabh() {
    console.log('🚀 Starting Dedicated NABH Table Import...');

    if (!fs.existsSync(JSON_FILE)) {
        console.error('❌ Error: nabh_accredited_list.json not found.');
        return;
    }

    const data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
    console.log(`📋 Found ${data.length} records in JSON.`);

    let importedCount = 0;
    let updatedCount = 0;

    for (const item of data) {
        try {
            // Check if exists
            const [existing] = await db.query('SELECT id FROM nabh_hospitals WHERE acc_no = ?', [item.acc_no]);

            const values = [
                item.name,
                item.address,
                item.state,
                item.contact,
                item.acc_no,
                item.status,
                item.category,
                JSON.stringify(item.specialties),
                item.certificate_link,
                item.website,
                item.extracted_at ? item.extracted_at.replace('T', ' ').replace('Z', '') : null
            ];

            if (existing.length > 0) {
                // Update
                await db.query(`
                    UPDATE nabh_hospitals 
                    SET name=?, address=?, state=?, contact=?, status=?, category=?, specialties=?, certificate_link=?, website=?, extracted_at=?
                    WHERE acc_no = ?
                `, [values[0], values[1], values[2], values[3], values[5], values[6], values[7], values[8], values[9], values[10], item.acc_no]);
                updatedCount++;
            } else {
                // Insert
                await db.query(`
                    INSERT INTO nabh_hospitals 
                    (name, address, state, contact, acc_no, status, category, specialties, certificate_link, website, extracted_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, values);
                importedCount++;
            }
        } catch (error) {
            console.error(`❌ Error processing ${item.name}:`, error.message);
        }
    }

    console.log('\n================================');
    console.log(`✅ Import finished!`);
    console.log(`   New records: ${importedCount}`);
    console.log(`   Updated records: ${updatedCount}`);
    console.log('================================\n');

    process.exit(0);
}


if (require.main === module) {
    importNabh();
}

module.exports = { importNabh };
