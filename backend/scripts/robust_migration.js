const db = require('../src/config/database');

async function migrate() {
    try {
        console.log('🔍 Checking current schema...');
        const [columns] = await db.query('SHOW COLUMNS FROM hospitals');
        const columnNames = columns.map(c => c.Field);

        const adds = [];

        if (!columnNames.includes('description')) {
            adds.push('ADD COLUMN description TEXT AFTER address');
        }
        if (!columnNames.includes('website')) {
            adds.push('ADD COLUMN website VARCHAR(255) AFTER email');
        }
        if (!columnNames.includes('data_source')) {
            adds.push('ADD COLUMN data_source VARCHAR(50) DEFAULT "manual" AFTER rating');
        }
        if (!columnNames.includes('facility_type')) {
            adds.push('ADD COLUMN facility_type VARCHAR(100) AFTER type');
        }
        if (!columnNames.includes('ownership')) {
            adds.push('ADD COLUMN ownership VARCHAR(100) AFTER facility_type');
        }

        if (adds.length > 0) {
            console.log(`🚀 Adding ${adds.length} missing columns...`);
            await db.query(`ALTER TABLE hospitals ${adds.join(', ')}`);
        }

        console.log('🔄 Relaxing NOT NULL constraints for national data...');
        await db.query(`ALTER TABLE hospitals MODIFY COLUMN address TEXT NULL`);
        await db.query(`ALTER TABLE hospitals MODIFY COLUMN city VARCHAR(100) NULL`);
        await db.query(`ALTER TABLE hospitals MODIFY COLUMN state VARCHAR(100) NULL`);
        await db.query(`ALTER TABLE hospitals MODIFY COLUMN pincode VARCHAR(10) NULL`);
        await db.query(`ALTER TABLE hospitals MODIFY COLUMN phone VARCHAR(100) NULL`);
        await db.query(`ALTER TABLE hospitals MODIFY COLUMN emergency_phone VARCHAR(100) NULL`);

        console.log('🔄 Updating "type" enum...');
        await db.query(`ALTER TABLE hospitals MODIFY COLUMN type ENUM('government', 'private', 'public', 'charitable') DEFAULT 'private'`);

        console.log('⚡ Checking index...');
        const [indexes] = await db.query('SHOW INDEX FROM hospitals');
        if (!indexes.some(i => i.Key_name === 'idx_data_source')) {
            await db.query('CREATE INDEX idx_data_source ON hospitals(data_source)');
            console.log('✅ Index created.');
        }

        console.log('✨ Schema is up to date!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

migrate();
