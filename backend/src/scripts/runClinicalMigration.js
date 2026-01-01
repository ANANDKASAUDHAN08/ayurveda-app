const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function runClinicalMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'healthconnect_db',
        multipleStatements: true
    });

    console.log('✅ Connected to MySQL database');

    try {
        console.log('\n📋 Running Clinical Enhancement migration...');
        const migrationSql = fs.readFileSync(
            path.join(__dirname, '../../migrations/013_create_medical_records.sql'),
            'utf8'
        );
        await connection.query(migrationSql);
        console.log('✅ Clinical Enhancement migration completed successfully!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

runClinicalMigration();
