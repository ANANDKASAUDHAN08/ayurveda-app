const db = require('./src/config/database');

async function fixShippingAddress() {
    try {
        console.log('🔄 Making shipping_address column nullable...\n');

        await db.execute(`
            ALTER TABLE orders 
            MODIFY COLUMN shipping_address TEXT NULL
        `);

        console.log('✅ shipping_address is now nullable!');
        console.log('📝 New orders will use separate delivery columns.');
        console.log('   Old orders still have data in shipping_address.\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixShippingAddress();
