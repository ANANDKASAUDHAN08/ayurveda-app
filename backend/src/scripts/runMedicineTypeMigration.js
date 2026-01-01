const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function runMedicineTypeMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'healthconnect_db',
        multipleStatements: true
    });

    console.log('✅ Connected to MySQL database');

    try {
        // Read and execute medicine type migration
        console.log('\n📋 Running Medicine Type System migration...');
        const migrationSql = fs.readFileSync(
            path.join(__dirname, '../../migrations/012_add_medicine_type_system.sql'),
            'utf8'
        );
        await connection.query(migrationSql);
        console.log('✅ Medicine Type System migration completed successfully!');

        // Verify changes
        console.log('\n📊 Verifying schema changes...');

        const [doctorsCols] = await connection.query(`
            SHOW COLUMNS FROM doctors LIKE 'medicine_type'
        `);
        console.log('✅ Doctors table:', doctorsCols.length > 0 ? 'medicine_type column added' : '❌ Failed');

        const [medicinesCols] = await connection.query(`
            SHOW COLUMNS FROM medicines LIKE 'medicine_type'
        `);
        console.log('✅ Medicines table:', medicinesCols.length > 0 ? 'medicine_type column added' : '❌ Failed');

        const [appointmentsCols] = await connection.query(`
            SHOW COLUMNS FROM appointments LIKE 'medicine_type'
        `);
        console.log('✅ Appointments table:', appointmentsCols.length > 0 ? 'medicine_type column added' : '❌ Failed');

        const [prefTable] = await connection.query(`
            SHOW TABLES LIKE 'user_medicine_preference'
        `);
        console.log('✅ User preference table:', prefTable.length > 0 ? 'created' : '❌ Failed');

        const [contentTable] = await connection.query(`
            SHOW TABLES LIKE 'medicine_type_content'
        `);
        console.log('✅ Content table:', contentTable.length > 0 ? 'created' : '❌ Failed');

        // Show stats
        console.log('\n📊 Medicine Type Statistics:');
        const [stats] = await connection.query('SELECT * FROM medicine_type_stats');
        console.table(stats);

        console.log('\n🎉 Migration verification completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Full error:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

runMedicineTypeMigration();
