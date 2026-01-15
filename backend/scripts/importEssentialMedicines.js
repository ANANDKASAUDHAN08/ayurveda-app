const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../src/config/database');

/**
 * 💊 Smart Filtered Import - "The Gold Standard"
 * Merges Medicine_Details.csv (Anchor) with interactions from medicine_data.csv 
 * and substitutes from medicine_dataset.csv.
 */

const ANCHOR_FILE = path.join(__dirname, '../data/allopathy/Medicine_Details.csv');
const CLINICAL_FILE = path.join(__dirname, '../data/allopathy/medicine_data.csv'); // 350MB
const ENRICHMENT_FILE = path.join(__dirname, '../data/allopathy/medicine_dataset.csv'); // 90MB

// Essential Salts (NLEM) core list to ensure they are always included
const ESSENTIAL_SALTS = [
    'PARACETAMOL', 'METFORMIN', 'AMOXICILLIN', 'INSULIN', 'ATORVASTATIN',
    'AMLODIPINE', 'AZITHROMYCIN', 'IBUPROFEN', 'OMEPRAZOLE', 'RANITIDINE',
    'CETIRIZINE', 'DICLOFENAC', 'ALBENDAZOLE', 'PANTOPRAZOLE', 'TELMISARTAN'
];

async function importGoldStandard() {
    console.log('🚀 Starting "Gold Standard" Medicine Import...');

    // PHASE 0: Cleanup
    console.log('🧹 Phase 0: Cleaning up old medicine data...');
    try {
        await db.execute('SET FOREIGN_KEY_CHECKS = 0');
        await db.execute('TRUNCATE TABLE medicines');
        await db.execute('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ Database medicines table cleared.');
    } catch (err) {
        console.log('⚠️ Cleanup warning:', err.message);
    }

    const medicineMap = new Map(); // Key: clean_name, Value: medicine_object

    // PHASE 1: Load Anchor Data (Top ~11k medicines)
    console.log('📦 Phase 1: Loading Anchor Data (Medicine_Details.csv)...');
    const anchorStream = fs.createReadStream(ANCHOR_FILE).pipe(csv());
    for await (const row of anchorStream) {
        const name = row['Medicine Name'];
        if (!name) continue;
        const cleanName = name.trim().toLowerCase();

        medicineMap.set(cleanName, {
            name: name,
            composition: row['Composition'],
            uses: row['Uses'],
            side_effects: row['Side_effects'],
            image_url: row['Image URL'],
            manufacturer: row['Manufacturer'],
            review_percent: {
                excellent: parseInt(row['Excellent Review %']) || 0,
                average: parseInt(row['Average Review %']) || 0,
                poor: parseInt(row['Poor Review %']) || 0
            },
            drug_interactions: null,
            substitutes: null,
            price: 0, // Will be filled if found
            mrp: 0
        });
    }
    console.log(`✅ Loaded ${medicineMap.size} anchor medicines.`);

    // PHASE 2: Fetch Clinical Details (Interactions)
    console.log('🔬 Phase 2: Fetching Clinical Details (medicine_data.csv)...');
    const clinicalStream = fs.createReadStream(CLINICAL_FILE).pipe(csv());
    let clinicalMatches = 0;
    for await (const row of clinicalStream) {
        const name = row['product_name'];
        if (!name) continue;
        const cleanName = name.trim().toLowerCase();

        const med = medicineMap.get(cleanName);
        if (med) {
            med.drug_interactions = row['drug_interactions'];
            med.price = parseFloat(row['product_price']?.replace(/[^\d.]/g, '')) || med.price;
            clinicalMatches++;
        }

        // Also check for Essential Salts if the medicine isn't already in our map
        const salt = row['salt_composition']?.toUpperCase() || '';
        const isEssential = ESSENTIAL_SALTS.some(s => salt.includes(s));

        if (isEssential && !med && medicineMap.size < 16000) {
            medicineMap.set(cleanName, {
                name: name,
                composition: row['salt_composition'],
                uses: row['medicine_desc'],
                side_effects: row['side_effects'],
                drug_interactions: row['drug_interactions'],
                manufacturer: row['product_manufactured'],
                price: parseFloat(row['product_price']?.replace(/[^\d.]/g, '')) || 0,
                mrp: parseFloat(row['product_price']?.replace(/[^\d.]/g, '')) || 0,
                image_url: 'https://via.placeholder.com/400x300/10b981/ffffff?text=Medicine',
                review_percent: { excellent: 0, average: 0, poor: 0 },
                substitutes: null
            });
        }
    }
    console.log(`✅ Matched interactions for ${clinicalMatches} medicines.`);
    console.log(`📈 New total (including essential salts): ${medicineMap.size}`);

    // PHASE 3: Fetch Substitutes
    console.log('🔄 Phase 3: Fetching Substitutes (medicine_dataset.csv)...');
    const enrichmentStream = fs.createReadStream(ENRICHMENT_FILE).pipe(csv());
    let subMatches = 0;
    for await (const row of enrichmentStream) {
        const name = row['name'];
        if (!name) continue;
        const cleanName = name.trim().toLowerCase();

        const med = medicineMap.get(cleanName);
        if (med) {
            const subs = [
                row.substitute0, row.substitute1, row.substitute2, row.substitute3, row.substitute4
            ].filter(s => s && s.length > 0);

            if (subs.length > 0) {
                med.substitutes = JSON.stringify(subs);
                subMatches++;
            }
        }
    }
    console.log(`✅ Found substitutes for ${subMatches} medicines.`);

    // PHASE 4: Database Insertion
    console.log('💾 Phase 4: Inserting into Database...');
    let inserted = 0;
    let batch = [];
    const BATCH_SIZE = 100;

    for (const med of medicineMap.values()) {
        batch.push([
            med.name,
            med.uses?.substring(0, 2000), // Trim if too long
            med.price || 0,
            med.price || 0,
            med.manufacturer || 'Unknown',
            'Allopathy',
            0,
            100,
            med.image_url,
            'Tablet', // Default
            med.composition,
            '10 units',
            'Gold-Standard-Merge',
            med.drug_interactions,
            med.substitutes,
            med.side_effects,
            JSON.stringify(med.review_percent)
        ]);

        if (batch.length >= BATCH_SIZE) {
            await insertBatch(batch);
            inserted += batch.length;
            process.stdout.write(`\r✅ Progress: ${inserted.toLocaleString()} / ${medicineMap.size}...`);
            batch = [];
        }
    }

    if (batch.length > 0) {
        await insertBatch(batch);
        inserted += batch.length;
    }

    console.log(`\n\n🎉 SUCCESS! Imported ${inserted} rich records!`);
    process.exit(0);
}

async function insertBatch(batch) {
    const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
    const flatValues = [].concat(...batch);
    const query = `
        INSERT INTO medicines (
            name, description, price, mrp, manufacturer, category, 
            prescription_required, stock, image_url, type, composition, 
            pack_size, data_source, drug_interactions, substitutes, 
            side_effects_list, review_percent
        )
        VALUES ${placeholders}
        ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
    `;
    try {
        await db.execute(query, flatValues);
    } catch (err) {
        console.error('\n❌ Batch Insert Error:', err.message);
        // If batch fails, we could try one by one, but for now we'll just log
    }
}

importGoldStandard().catch(err => console.error(err));
