const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function runMigrations() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'healthconnect_db',
        multipleStatements: true
    });

    console.log('✅ Connected to MySQL database');

    try {
        // Read and execute create tables migration
        console.log('\n📋 Creating admin tables...');
        const createTablesSql = fs.readFileSync(
            path.join(__dirname, '../../migrations/create_admin_tables.sql'),
            'utf8'
        );
        await connection.query(createTablesSql);
        console.log('✅ Admin tables created successfully');

        // Read and execute seed data
        console.log('\n🌱 Seeding initial data...');
        const seedDataSql = fs.readFileSync(
            path.join(__dirname, '../../migrations/seed_admin_data.sql'),
            'utf8'
        );
        await connection.query(seedDataSql);
        console.log('✅ Data seeded successfully');

        console.log('\n🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

runMigrations();
