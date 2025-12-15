const db = require('../config/database');

async function migrateOrdersTable() {
    try {
        console.log('🔄 Migrating orders table...');

        // Check if columns exist
        const [columns] = await db.execute(`
            SHOW COLUMNS FROM orders LIKE 'tax'
        `);

        if (columns.length === 0) {
            console.log('Adding tax and delivery_fee columns...');

            // Add tax column
            await db.execute(`
                ALTER TABLE orders 
                ADD COLUMN tax DECIMAL(10,2) DEFAULT 0 AFTER total_amount
            `);

            // Add delivery_fee column
            await db.execute(`
                ALTER TABLE orders 
                ADD COLUMN delivery_fee DECIMAL(10,2) DEFAULT 0 AFTER tax
            `);

            console.log('✅ Columns added successfully!');
        } else {
            console.log('✅ Columns already exist. No migration needed.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
}

migrateOrdersTable();
