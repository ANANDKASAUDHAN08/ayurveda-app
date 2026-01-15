const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../src/config/database');

const CSV_FILE = path.join(__dirname, '../data/ayurveda/NATIONAL AYURVEDA MORBIDITY CODES.csv');
const BATCH_SIZE = 500;

async function importMorbidityCodes(shouldExit = true) {
    console.log('🚀 Starting Ayurveda Morbidity Codes Import...');

    if (!fs.existsSync(CSV_FILE)) {
        console.error('❌ CSV file not found:', CSV_FILE);
        if (shouldExit) process.exit(1);
        return;
    }

    try {
        console.log('🗑️  Clearing existing data from ayurveda_morbidity_codes...');
        await db.query('TRUNCATE TABLE ayurveda_morbidity_codes');
        console.log('✅ Table cleared\n');

        let importedCount = 0;
        let batch = [];

        const readStream = fs.createReadStream(CSV_FILE).pipe(csv());

        readStream.on('data', async (row) => {
            if (Object.keys(row).length < 2) return; // Skip empty rows

            // Map CSV columns to DB columns
            // CSV Headers: Sr No.,NAMC_ID,NAMC_CODE,NAMC_term,NAMC_term_diacritical,NAMC_term_DEVANAGARI,Short_definition,Long_definition,Ontology_branches
            const record = [
                row['NAMC_ID'] || row['Sr No.'],       // namc_id
                row['NAMC_CODE'] || 'N/A',             // namc_code
                row['NAMC_term'],                      // namc_term
                row['NAMC_term_diacritical'] || '',    // namc_term_diacritical
                row['NAMC_term_DEVANAGARI'] || '',     // namc_term_devanagari
                row['Short_definition'] || null, // short_definition
                row['Long_definition'] || null,    // long_definition
                row['Ontology_branches'] || null         // ontology_branches
            ];

            // Filter out rows where essential data key is missing if necessary, but here we just push
            if (record[0] && record[2]) { // Ensure ID and Term exist at least
                batch.push(record);
            }

            if (batch.length >= BATCH_SIZE) {
                readStream.pause(); // Pause stream to allow batch insert to complete
                await insertBatch(batch);
                importedCount += batch.length;
                process.stdout.write(`\r✅ Imported: ${importedCount} codes`);
                batch = [];
                readStream.resume(); // Resume stream
            }
        })
            .on('end', async () => {
                if (batch.length > 0) {
                    await insertBatch(batch);
                    importedCount += batch.length;
                }
                console.log(`\n\n🎉 Import Complete! Total: ${importedCount} codes`);
                if (shouldExit) {
                    db.end(); // Close connection
                    process.exit(0); // Success
                }
            });

    } catch (error) {
        console.error('\n❌ Import failed:', error.message);
        if (shouldExit) process.exit(1);
    }
}

async function insertBatch(batch) {
    const query = `INSERT INTO ayurveda_morbidity_codes 
        (namc_id, namc_code, namc_term, namc_term_diacritical, namc_term_devanagari, short_definition, long_definition, ontology_branches) 
        VALUES ?`;
    await db.query(query, [batch]);
}

if (require.main === module) {
    importMorbidityCodes();
}

module.exports = { importMorbidityCodes };
