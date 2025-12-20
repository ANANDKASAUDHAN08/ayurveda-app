const db = require('../config/database');

async function columnExists(table, column) {
    try {
        const [columns] = await db.execute(`SHOW COLUMNS FROM ${table} LIKE ?`, [column]);
        return columns.length > 0;
    } catch (error) {
        return false;
    }
}

async function migrate() {
    try {
        console.log('Starting Geolocation Migration (MySQL Compatible)...');

        const tables = ['hospitals', 'pharmacies', 'doctors'];

        for (const table of tables) {
            console.log(`Checking table: ${table}`);

            if (!(await columnExists(table, 'latitude'))) {
                console.log(`Adding latitude to ${table}...`);
                await db.execute(`ALTER TABLE ${table} ADD COLUMN latitude DECIMAL(10, 8)`);
            }

            if (!(await columnExists(table, 'longitude'))) {
                console.log(`Adding longitude to ${table}...`);
                await db.execute(`ALTER TABLE ${table} ADD COLUMN longitude DECIMAL(11, 8)`);
            }
        }

        // 4. Seed Dummy Data for testing (Delhi area)
        console.log('Seeding dummy coordinates...');

        // Update some hospitals
        await db.execute('UPDATE hospitals SET latitude = 28.6139, longitude = 77.2090 WHERE id % 3 = 0');
        await db.execute('UPDATE hospitals SET latitude = 28.6210, longitude = 77.2100 WHERE id % 3 = 1');
        await db.execute('UPDATE hospitals SET latitude = 28.6300, longitude = 77.2210 WHERE id % 3 = 2');

        // Update some pharmacies
        await db.execute('UPDATE pharmacies SET latitude = 28.6100, longitude = 77.2050 WHERE id % 2 = 0');
        await db.execute('UPDATE pharmacies SET latitude = 28.6150, longitude = 77.2200 WHERE id % 2 = 1');

        // Update some doctors
        await db.execute('UPDATE doctors SET latitude = 28.6120, longitude = 77.2150 WHERE id % 2 = 0');
        await db.execute('UPDATE doctors SET latitude = 28.6250, longitude = 77.2000 WHERE id % 2 = 1');

        console.log('✅ Geolocation migration and seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
