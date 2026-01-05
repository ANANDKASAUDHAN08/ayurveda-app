const db = require('../config/database');

async function addDeliveryColumns() {
    try {
        console.log('🔄 Checking and adding delivery columns to orders table...\n');

        // Check if columns already exist
        const [columns] = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'orders' 
            AND COLUMN_NAME IN ('delivery_address', 'delivery_city', 'delivery_state', 'delivery_pincode', 'delivery_phone')
        `);

        const existingColumns = columns.map(col => col.COLUMN_NAME);
        console.log('Existing delivery columns:', existingColumns.length > 0 ? existingColumns : 'None');

        if (existingColumns.length === 5) {
            console.log('\n✅ All 5 delivery columns already exist!');
            process.exit(0);
        }

        // Add missing columns one by one
        const columnsToAdd = [
            { name: 'delivery_address', type: 'VARCHAR(255)' },
            { name: 'delivery_city', type: 'VARCHAR(100)' },
            { name: 'delivery_state', type: 'VARCHAR(100)' },
            { name: 'delivery_pincode', type: 'VARCHAR(10)' },
            { name: 'delivery_phone', type: 'VARCHAR(15)' }
        ];

        for (const col of columnsToAdd) {
            if (!existingColumns.includes(col.name)) {
                try {
                    await db.execute(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.type}`);
                    console.log(`✅ Added column: ${col.name}`);
                } catch (err) {
                    if (err.code === 'ER_DUP_FIELDNAME') {
                        console.log(`⚠️  Column ${col.name} already exists`);
                    } else {
                        throw err;
                    }
                }
            } else {
                console.log(`⏭️  Column ${col.name} already exists`);
            }
        }

        console.log('\n✅ Migration completed successfully!');
        console.log('📝 New orders will now store delivery info in separate columns.\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

addDeliveryColumns();
