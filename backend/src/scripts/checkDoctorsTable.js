const pool = require('../config/database');

async function checkDoctorsTable() {
    try {
        // Check what columns exist in doctors table
        const [columns] = await pool.query("SHOW COLUMNS FROM doctors");
        console.log('\n📋 Doctors Table Columns:');
        console.log('========================');
        columns.forEach(col => {
            console.log(`- ${col.Field} (${col.Type})`);
        });

        // Check if there are any doctors
        const [doctors] = await pool.query("SELECT COUNT(*) as count FROM doctors");
        console.log(`\n👨‍⚕️ Total doctors in database: ${doctors[0].count}`);

        // Check featured_doctors table
        const [featuredCols] = await pool.query("SHOW COLUMNS FROM featured_doctors");
        console.log('\n⭐ Featured Doctors Table Columns:');
        console.log('==================================');
        featuredCols.forEach(col => {
            console.log(`- ${col.Field} (${col.Type})`);
        });

        const [featured] = await pool.query("SELECT COUNT(*) as count FROM featured_doctors");
        console.log(`\n⭐ Total featured doctors: ${featured[0].count}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkDoctorsTable();
