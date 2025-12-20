const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Load environment variables from root .env file
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = require('../src/config/database');

/**
 * Import Indian Medicine Dataset into existing medicines table
 * CSV Columns: id, name, price(₹), Is_discontinued, manufacturer_name, type, pack_size, composition
 */

const CSV_FILE = path.join(__dirname, '../data/indian-medicines.csv');
const BATCH_SIZE = 500; // Import in batches for performance

// Placeholder images based on medicine type
const PLACEHOLDER_IMAGES = {
    'tablet': 'https://via.placeholder.com/400x400/4ade80/ffffff?text=Tablet',
    'capsule': 'https://via.placeholder.com/400x400/f87171/ffffff?text=Capsule',
    'syrup': 'https://via.placeholder.com/400x400/fb923c/ffffff?text=Syrup',
    'injection': 'https://via.placeholder.com/400x400/60a5fa/ffffff?text=Injection',
    'cream': 'https://via.placeholder.com/400x400/a78bfa/ffffff?text=Cream',
    'ointment': 'https://via.placeholder.com/400x400/a78bfa/ffffff?text=Ointment',
    'drops': 'https://via.placeholder.com/400x400/38bdf8/ffffff?text=Drops',
    'spray': 'https://via.placeholder.com/400x400/2dd4bf/ffffff?text=Spray',
    'powder': 'https://via.placeholder.com/400x400/fbbf24/ffffff?text=Powder',
    'solution': 'https://via.placeholder.com/400x400/34d399/ffffff?text=Solution',
    'gel': 'https://via.placeholder.com/400x400/c084fc/ffffff?text=Gel',
    'lotion': 'https://via.placeholder.com/400x400/f472b6/ffffff?text=Lotion',
    'default': 'https://via.placeholder.com/400x400/10b981/ffffff?text=Medicine'
};

function getPlaceholderImage(packSize) {
    if (!packSize) return PLACEHOLDER_IMAGES.default;

    const packLower = packSize.toLowerCase();

    if (packLower.includes('tablet')) return PLACEHOLDER_IMAGES.tablet;
    if (packLower.includes('capsule')) return PLACEHOLDER_IMAGES.capsule;
    if (packLower.includes('syrup') || packLower.includes('suspension')) return PLACEHOLDER_IMAGES.syrup;
    if (packLower.includes('injection') || packLower.includes('vial') || packLower.includes('ampule')) return PLACEHOLDER_IMAGES.injection;
    if (packLower.includes('cream')) return PLACEHOLDER_IMAGES.cream;
    if (packLower.includes('ointment')) return PLACEHOLDER_IMAGES.ointment;
    if (packLower.includes('drops') || packLower.includes('drop')) return PLACEHOLDER_IMAGES.drops;
    if (packLower.includes('spray')) return PLACEHOLDER_IMAGES.spray;
    if (packLower.includes('powder') || packLower.includes('sachet')) return PLACEHOLDER_IMAGES.powder;
    if (packLower.includes('solution')) return PLACEHOLDER_IMAGES.solution;
    if (packLower.includes('gel')) return PLACEHOLDER_IMAGES.gel;
    if (packLower.includes('lotion')) return PLACEHOLDER_IMAGES.lotion;

    return PLACEHOLDER_IMAGES.default;
}

async function importMedicines() {
    console.log('📊 Starting Indian Medicine Dataset Import...');
    console.log(`📁 Reading from: ${CSV_FILE}`);

    // Check if file exists
    if (!fs.existsSync(CSV_FILE)) {
        console.error('❌ CSV file not found!');
        console.log('💡 Run download script first: node backend/scripts/downloadMedicineData.js');
        process.exit(1);
    }

    // First, delete old imported data to avoid duplicates
    console.log('\n🗑️  Removing old imported data...');
    await db.execute(`DELETE FROM medicines WHERE data_source = 'Indian-Medicine-Dataset'`);
    console.log('✅ Old data cleared\n');

    const medicines = [];
    let rowCount = 0;
    let importedCount = 0;
    let errorCount = 0;

    // Read CSV file
    const readStream = fs.createReadStream(CSV_FILE)
        .pipe(csv());

    for await (const row of readStream) {
        rowCount++;

        try {
            const packSize = row.pack_size_label || '10 units';

            // Map to YOUR existing table structure with CORRECT column names
            const medicine = {
                name: row.name || 'Unknown Medicine',
                description: row.short_composition1 || row.composition || null,
                price: parseFloat(row['price(₹)']) || 0,
                mrp: parseFloat(row['price(₹)']) || 0,
                manufacturer: row.manufacturer_name || 'Unknown',
                category: row.type || 'General',
                prescription_required: 0, // Default false
                stock: 100, // Default stock
                image_url: getPlaceholderImage(packSize), // Assign based on type
                type: row.type || 'Tablet',
                composition: row.short_composition1 || row.short_composition2 || null,
                pack_size: packSize,
                data_source: 'Indian-Medicine-Dataset'
            };

            medicines.push(medicine);

            // Import in batches
            if (medicines.length >= BATCH_SIZE) {
                await importBatch(medicines);
                importedCount += medicines.length;
                medicines.length = 0; // Clear array

                process.stdout.write(`\r✅ Imported: ${importedCount} medicines`);
            }
        } catch (error) {
            errorCount++;
            if (errorCount <= 10) {
                console.error(`\n⚠️ Error parsing row ${rowCount}:`, error.message);
            }
        }
    }

    // Import remaining medicines
    if (medicines.length > 0) {
        await importBatch(medicines);
        importedCount += medicines.length;
    }

    console.log(`\n\n🎉 Import Complete!`);
    console.log(`📊 Total rows read: ${rowCount}`);
    console.log(`✅ Successfully imported: ${importedCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    // Show sample data with ALL fields including images
    console.log('\n📋 Sample medicines imported:');
    const [samples] = await db.execute(`
        SELECT name, manufacturer, price, mrp, composition, pack_size, image_url, data_source 
        FROM medicines 
        WHERE data_source = 'Indian-Medicine-Dataset' 
        LIMIT 5
    `);
    console.table(samples);

    // Show image distribution
    console.log('\n🖼️  Placeholder Image Distribution:');
    const [imageStats] = await db.execute(`
        SELECT image_url, COUNT(*) as count 
        FROM medicines 
        WHERE data_source = 'Indian-Medicine-Dataset' 
        GROUP BY image_url
        ORDER BY count DESC
    `);
    console.table(imageStats);

    process.exit(0);
}

async function importBatch(medicines) {
    if (medicines.length === 0) return;

    try {
        const placeholders = medicines.map(() =>
            '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).join(',');

        const values = [];
        medicines.forEach(m => {
            values.push(
                m.name,
                m.description,
                m.price,
                m.mrp,
                m.manufacturer,
                m.category,
                m.prescription_required,
                m.stock,
                m.image_url,
                m.type,
                m.composition,
                m.pack_size,
                m.data_source
            );
        });

        const query = `
            INSERT INTO medicines 
            (name, description, price, mrp, manufacturer, category, prescription_required, 
             stock, image_url, type, composition, pack_size, data_source) 
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
importMedicines();
