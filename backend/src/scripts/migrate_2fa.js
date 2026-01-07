const db = require('../config/database');

async function addColumnIfNotExists(table, column, definition) {
    const [columns] = await db.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = (SELECT DATABASE()) 
        AND TABLE_NAME = ? 
        AND COLUMN_NAME = ?
    `, [table, column]);

    if (columns.length === 0) {
        console.log(`Adding column ${column} to ${table}...`);
        await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    } else {
        console.log(`Column ${column} already exists in ${table}.`);
    }
}

async function migrate() {
    try {
        console.log('🚀 Starting 2FA Migration...');

        const columnsToAdd = [
            { name: 'two_factor_secret', definition: 'VARCHAR(255) DEFAULT NULL' },
            { name: 'two_factor_enabled', definition: 'BOOLEAN DEFAULT FALSE' },
            { name: 'two_factor_temp_secret', definition: 'VARCHAR(255) DEFAULT NULL' }
        ];

        for (const table of ['users', 'doctors']) {
            for (const col of columnsToAdd) {
                await addColumnIfNotExists(table, col.name, col.definition);
            }
        }

        console.log('✅ 2FA Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
