const db = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('🚀 Running Hospital Enrichment Migration...');

        // Read SQL file from argument or default
        const fileName = process.argv[2] || 'create_specialty_hospitals_table.sql';
        const sqlPath = path.join(__dirname, '../migrations', fileName);

        if (!fs.existsSync(sqlPath)) {
            console.error(`❌ SQL file not found: ${sqlPath}`);
            process.exit(1);
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon but ignore ones inside comments or strings (simple version)
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
            try {
                await db.query(statement);
            } catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log('ℹ️  Column already exists, skipping.');
                } else if (error.code === 'ER_DUP_KEYNAME') {
                    console.log('ℹ️  Index already exists, skipping.');
                } else if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                    console.log('ℹ️  Field or key doesn\'t exist, skipping.');
                } else {
                    console.error('❌ Migration statement failed:', error.message);
                    throw error;
                }
            }
        }

        console.log('✅ Migration successful!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
