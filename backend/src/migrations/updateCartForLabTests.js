const db = require('../config/database');

async function updateCartTableForLabTests() {
    try {
        console.log('Updating cart table to support lab_test product_type...');

        // Alter the product_type ENUM to include 'lab_test'
        await db.execute(`
            ALTER TABLE cart 
            MODIFY COLUMN product_type ENUM('medicine', 'device', 'lab_test') NOT NULL
        `);

        console.log('✅ Cart table updated successfully to support lab tests');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating cart table:', error);
        process.exit(1);
    }
}

updateCartTableForLabTests();
