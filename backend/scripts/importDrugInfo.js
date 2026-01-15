const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../src/config/database');

/**
 * Import Open Source "DrugInfo" Dataset (riz4d)
 * This dataset provides Side Effects and Composition.
 */

const CSV_FILE = path.join(__dirname, '../data/allopathy/medicine_dataset.csv');
const BATCH_SIZE = 500;

async function importDrugInfo() {
    console.log('💊 Starting DrugInfo Detailed Import...');

    if (!fs.existsSync(CSV_FILE)) {
        console.error(`❌ File not found: ${CSV_FILE}`);
        console.log('💡 Please download medicine_dataset.csv from https://github.com/riz4d/DrugInfo');
        return;
    }

    let rowCount = 0;
    let importedCount = 0;
    let batch = [];

    const stream = fs.createReadStream(CSV_FILE).pipe(csv());

    for await (const row of stream) {
        rowCount++;

        // Clean and Map columns from riz4d dataset
        // Expected columns: name, composition, uses, side_effects, manufacturer, price
        const medicine = [
            row.name || 'Unknown',
            row.uses || 'Details not available', // Using 'uses' as the primary description
            parseFloat(row.price?.replace('₹', '')) || 0,
            parseFloat(row.price?.replace('₹', '')) || 0,
            row.manufacturer || 'Generic Pharma',
            'Allopathy',
            0,
            100,
            row.image_url || 'https://via.placeholder.com/400x300/10b981/ffffff?text=Medicine',
            'Tablet',
            row.composition || 'Composition not available',
            '10 units', // Default pack size if missing
            'DrugInfo-OS'
        ];

        batch.push(medicine);

        if (batch.length >= BATCH_SIZE) {
            await insertBatch(batch);
            importedCount += batch.length;
            process.stdout.write(`\r✅ Imported: ${importedCount.toLocaleString()} detailed records...`);
            batch = [];
        }
    }

    if (batch.length > 0) {
        await insertBatch(batch);
        importedCount += batch.length;
    }

    // After importing to SQL, we should also generate a JSON for the "Deep Layer" modal 
    // This allows the frontend to show side_effects which aren't in the main search table.
    console.log(`\n\n🎉 Detailed Import Finished! Total: ${importedCount}`);
    console.log(`📝 Next: Generating deep-layer JSON for the modal...`);
    await generateDeepLayerJSON();

    process.exit(0);
}

async function insertBatch(batch) {
    const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
    const flatValues = [].concat(...batch);
    const query = `
        INSERT INTO medicines (name, description, price, mrp, manufacturer, category, prescription_required, stock, image_url, type, composition, pack_size, data_source)
        VALUES ${placeholders}
        ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
    `;
    await db.execute(query, flatValues);
}

async function generateDeepLayerJSON() {
    // Re-read CSV to create the JSON file the frontend uses for the "Detailed" view
    const detailedData = [];
    const stream = fs.createReadStream(CSV_FILE).pipe(csv());

    for await (const row of stream) {
        detailedData.push({
            name: row.name,
            manufacturer: row.manufacturer,
            price: parseFloat(row.price?.replace('₹', '')) || 0,
            composition: row.composition,
            introduction: row.uses,
            uses: [row.uses],
            side_effects: {
                common: (row.side_effects || '').split(',').map(s => s.trim()),
                advice: "Consult your doctor if side effects persist."
            },
            safety_advice: [], // OS data is missing this, can be left empty
            substitutes: []
        });
    }

    const outputPath = path.join(__dirname, '../data/allopathy/medicines-detailed.json');
    fs.writeFileSync(outputPath, JSON.stringify(detailedData, null, 2));
    console.log(`✅ Deep-layer JSON generated at: ${outputPath}`);
}

if (require.main === module) {
    importDrugInfo().catch(err => console.error(err));
}

module.exports = { importDrugInfo };
