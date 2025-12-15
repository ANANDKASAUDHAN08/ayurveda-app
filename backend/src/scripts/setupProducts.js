require('dotenv').config();
const db = require('../config/database');
const fs = require('fs');
const path = require('path');

async function setupProductTables() {
    try {
        console.log('📦 Setting up product tables...');

        const sqlPath = path.join(__dirname, '../database/schema/products.sql');
        const sqlScript = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon and execute each statement
        const statements = sqlScript
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        for (const statement of statements) {
            await db.execute(statement);
            console.log('✅ Executed statement');
        }

        console.log('✅ Product tables created successfully!');
        console.log('✅ Sample data inserted!');

        // Verify tables
        const [medicines] = await db.execute('SELECT COUNT(*) as count FROM medicines');
        const [devices] = await db.execute('SELECT COUNT(*) as count FROM medical_devices');

        console.log(`📊 ${medicines[0].count} medicines in database`);
        console.log(`📊 ${devices[0].count} devices in database`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting up tables:', error);
        process.exit(1);
    }
}

setupProductTables();
