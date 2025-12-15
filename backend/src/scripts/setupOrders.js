const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function setupOrders() {
    try {
        console.log('📦 Setting up orders tables...');

        // Read SQL file
        const sqlPath = path.join(__dirname, '../database/schema/orders.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(stmt => stmt.trim());

        for (const statement of statements) {
            if (statement.trim()) {
                await db.execute(statement);
            }
        }

        console.log('✅ Orders tables created successfully!');
        console.log('   - orders');
        console.log('   - order_items');
        console.log('   - order_status_history');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting up orders tables:', error);
        process.exit(1);
    }
}

setupOrders();
