const db = require('../src/config/database');

/**
 * Verify Database Connection and Tables
 * Checks what tables exist in your database
 */

async function verifyDatabase() {
    console.log('🔍 Database Verification Tool');
    console.log('================================\n');

    try {
        // Step 1: Test connection
        console.log('📡 Testing database connection...');
        await db.execute('SELECT 1');
        console.log('✅ Connected successfully!\n');

        // Step 2: Show current database
        const [dbInfo] = await db.execute('SELECT DATABASE() as db_name');
        console.log(`📊 Current database: ${dbInfo[0].db_name}\n`);

        // Step 3: List all tables
        console.log('📋 Tables in database:');
        console.log('─────────────────────────────');

        const [tables] = await db.execute('SHOW TABLES');

        if (tables.length === 0) {
            console.log('⚠️  No tables found in database!');
            console.log('   The database is empty.\n');
        } else {
            tables.forEach((table, index) => {
                const tableName = Object.values(table)[0];
                console.log(`${index + 1}. ${tableName}`);
            });
            console.log(`\n✅ Total tables: ${tables.length}\n`);
        }

        // Step 4: Check specifically for health_centres
        console.log('🏥 Checking health_centres table...');
        console.log('─────────────────────────────');

        const healthCentresExists = tables.some(table =>
            Object.values(table)[0] === 'health_centres'
        );

        if (healthCentresExists) {
            console.log('✅ health_centres table EXISTS!\n');

            // Get row count
            const [count] = await db.execute('SELECT COUNT(*) as count FROM health_centres');
            console.log(`   Records: ${count[0].count.toLocaleString()}\n`);

            // Show sample data
            if (count[0].count > 0) {
                console.log('   Sample record:');
                const [sample] = await db.execute('SELECT * FROM health_centres LIMIT 1');
                console.log('   ', JSON.stringify(sample[0], null, 2));
            }
        } else {
            console.log('❌ health_centres table NOT FOUND!\n');
            console.log('💡 To create it, run:');
            console.log('   npm run init:health-centres\n');
        }

        // Step 5: Check other important tables
        console.log('\n📊 Other Important Tables:');
        console.log('─────────────────────────────');

        const importantTables = [
            'users',
            'doctors',
            'appointments',
            'chat_sessions',
            'chat_messages',
            'subscriptions'
        ];

        for (const tableName of importantTables) {
            const exists = tables.some(table => Object.values(table)[0] === tableName);
            if (exists) {
                try {
                    const [count] = await db.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
                    console.log(`✅ ${tableName.padEnd(20)} (${count[0].count} records)`);
                } catch (error) {
                    console.log(`⚠️  ${tableName.padEnd(20)} (error reading)`);
                }
            } else {
                console.log(`❌ ${tableName.padEnd(20)} (not found)`);
            }
        }

        console.log('\n================================');
        console.log('✅ Verification complete!');
        console.log('================================\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\n💡 Troubleshooting:');
        console.error('   1. Check your .env file has correct DB credentials');
        console.error('   2. Verify Aiven database is running');
        console.error('   3. Check DB_HOST, DB_USER, DB_PASSWORD, DB_NAME\n');
        process.exit(1);
    }
}

verifyDatabase();
