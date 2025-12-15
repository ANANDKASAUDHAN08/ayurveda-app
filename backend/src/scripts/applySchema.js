const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function applySchema() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'healthconnect_db',
            multipleStatements: true
        });

        console.log('Connected to database.');

        const schemaPath = path.join(__dirname, '../database/appointments_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Applying schema...');
        await connection.query(schemaSql);
        console.log('Schema applied successfully.');

        await connection.end();
    } catch (error) {
        console.error('Error applying schema:', error);
    }
}

applySchema();
