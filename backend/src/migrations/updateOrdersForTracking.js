const db = require('../config/database');

async function migrate() {
    try {
        console.log('--- Order Tracking Migration Start ---');

        const tables = await db.execute('SHOW COLUMNS FROM orders');
        const columns = tables[0].map(c => c.Field);

        const newColumns = [
            { name: 'driver_name', type: 'VARCHAR(255)' },
            { name: 'driver_phone', type: 'VARCHAR(20)' },
            { name: 'driver_lat', type: 'DECIMAL(10, 8)' },
            { name: 'driver_lng', type: 'DECIMAL(11, 8)' },
            { name: 'customer_lat', type: 'DECIMAL(10, 8)' },
            { name: 'customer_lng', type: 'DECIMAL(11, 8)' },
            { name: 'estimated_delivery_time', type: 'TIMESTAMP NULL' }
        ];

        for (const col of newColumns) {
            if (!columns.includes(col.name)) {
                console.log(`Adding ${col.name}...`);
                await db.execute(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.type}`);
            }
        }

        console.log('✅ Migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('Migration Error:', err);
        process.exit(1);
    }
}

migrate();
