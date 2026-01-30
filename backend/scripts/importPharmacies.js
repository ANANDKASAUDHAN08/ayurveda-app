const fs = require('fs');
const path = require('path');
const db = require('../src/config/database');

/**
 * Script to import pharmacy data from JSON files into the pharmacies table.
 * Processes all JSON files in the data/pharmacies directory.
 */

const DATA_DIR = path.join(__dirname, '../data/pharmacies');

async function importPharmacies() {
    try {
        console.log('🚀 Starting pharmacy data import...');

        // 1. Check if data directory exists
        if (!fs.existsSync(DATA_DIR)) {
            console.error(`❌ Data directory not found at: ${DATA_DIR}`);
            process.exit(1);
        }

        // 2. Load all JSON files from directory
        const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.json'));
        console.log(`📁 Found ${files.length} JSON file(s) to import`);

        let allPharmacies = [];
        for (const file of files) {
            const filePath = path.join(DATA_DIR, file);
            const rawData = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(rawData);
            allPharmacies = allPharmacies.concat(data);
            console.log(`  ✓ Loaded ${data.length} pharmacies from ${file}`);
        }

        console.log(`📦 Total pharmacies to import: ${allPharmacies.length}`);

        // 3. Ensure table exists (based on provided screenshot structure)
        console.log('🛠 Checking if pharmacies table exists...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS pharmacies (
                id int NOT NULL AUTO_INCREMENT,
                name varchar(255) NOT NULL,
                address text NOT NULL,
                city varchar(100) NOT NULL,
                state varchar(100) NOT NULL,
                pincode varchar(10) NOT NULL,
                phone varchar(20) DEFAULT NULL,
                email varchar(255) DEFAULT NULL,
                is_24x7 tinyint(1) DEFAULT '0',
                delivery_available tinyint(1) DEFAULT '0',
                rating decimal(3,2) DEFAULT '0.00',
                image_url varchar(500) DEFAULT NULL,
                is_active tinyint(1) DEFAULT '1',
                created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                latitude decimal(10,8) DEFAULT NULL,
                longitude decimal(11,8) DEFAULT NULL,
                brand varchar(100) DEFAULT NULL,
                data_source varchar(100) DEFAULT NULL,
                PRIMARY KEY (id),
                KEY name (name),
                KEY city (city),
                KEY is_24x7 (is_24x7),
                KEY delivery_available (delivery_available),
                KEY is_active (is_active),
                KEY brand (brand)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 3.5 Add brand and data_source columns if they don't exist
        console.log('🔧 Ensuring brand and data_source columns exist...');

        // Add brand column
        try {
            await db.execute('ALTER TABLE pharmacies ADD COLUMN brand varchar(100) DEFAULT NULL');
            console.log('  ✓ Added brand column');
        } catch (err) {
            if (err.message.includes('Duplicate column')) {
                console.log('  ✓ Brand column already exists');
            } else {
                console.warn('  ⚠️  Brand column warning:', err.message);
            }
        }

        // Add data_source column
        try {
            await db.execute('ALTER TABLE pharmacies ADD COLUMN data_source varchar(100) DEFAULT NULL');
            console.log('  ✓ Added data_source column');
        } catch (err) {
            if (err.message.includes('Duplicate column')) {
                console.log('  ✓ Data_source column already exists');
            } else {
                console.warn('  ⚠️  Data_source column warning:', err.message);
            }
        }

        // Add brand index
        try {
            await db.execute('ALTER TABLE pharmacies ADD INDEX brand (brand)');
            console.log('  ✓ Added brand index');
        } catch (err) {
            if (err.message.includes('Duplicate key')) {
                console.log('  ✓ Brand index already exists');
            }
        }

        // 4. TRUNCATE existing data for a clean re-import
        console.log('🧹 Truncating existing pharmacies data...');
        await db.execute('TRUNCATE TABLE pharmacies');

        // 5. Batch insertion
        const batchSize = 100;
        let insertedCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < allPharmacies.length; i += batchSize) {
            const batch = allPharmacies.slice(i, i + batchSize);
            const values = [];

            for (const p of batch) {
                // Determine 24x7 status from opening_hours
                const is24x7 = (p.opening_hours && p.opening_hours.toLowerCase().includes('24/7')) ? 1 : 0;

                // Clean phone number (handle "N/A" -> NULL)
                const phone = (p.phone && p.phone !== 'N/A') ? p.phone.substring(0, 20) : null;

                // Truncate and refine fields
                const name = p.name ? p.name.substring(0, 255) : 'Unknown Pharmacy';
                const city = p.city ? p.city.substring(0, 100) : 'N/A';

                // State from JSON (already processed by addStateToPharmacies.js)
                const state = p.state ? p.state.substring(0, 100) : 'Unknown';

                const pincode = p.pincode ? p.pincode.substring(0, 10) : '';

                // Brand and data_source fields
                const brand = p.brand ? p.brand.substring(0, 100) : 'Independent';
                const dataSource = p.data_source ? p.data_source.substring(0, 100) : 'Unknown';

                values.push([
                    name,
                    p.address || '',
                    city,
                    state,
                    pincode,
                    phone,
                    is24x7,
                    p.latitude || null,
                    p.longitude || null,
                    brand,
                    dataSource
                ]);
            }

            const sql = `
                INSERT INTO pharmacies (
                    name, address, city, state, pincode, phone, is_24x7, latitude, longitude, brand, data_source
                ) VALUES ?
            `;

            try {
                const [result] = await db.query(sql, [values]);
                insertedCount += result.affectedRows;
                process.stdout.write(`\r✅ Progress: ${insertedCount + skippedCount}/${allPharmacies.length} processed...`);
            } catch (err) {
                console.error(`\n❌ Batch insertion error at index ${i}:`, err.message);
                skippedCount += batch.length;
            }
        }

        console.log(`\n\n✨ Import completed successfully!`);
        console.log(`✅ Total Inserted: ${insertedCount}`);
        console.log(`⚠️  Total Skipped: ${skippedCount}`);

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Critical error during import:', error);
        process.exit(1);
    }
}

importPharmacies();
