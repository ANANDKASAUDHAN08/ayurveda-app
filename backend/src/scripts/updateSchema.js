const db = require('../config/database');

async function updateSchema() {
    console.log('🚀 Starting schema update...');

    const userColumns = [
        "ADD COLUMN gender ENUM('Male', 'Female', 'Other') NULL",
        "ADD COLUMN dob DATE NULL",
        "ADD COLUMN blood_group VARCHAR(10) NULL",
        "ADD COLUMN address TEXT NULL",
        "ADD COLUMN emergency_contact_name VARCHAR(100) NULL",
        "ADD COLUMN emergency_contact_phone VARCHAR(20) NULL",
        "ADD COLUMN height DECIMAL(5,2) NULL",
        "ADD COLUMN weight DECIMAL(5,2) NULL",
        "ADD COLUMN allergies TEXT NULL"
    ];

    const doctorColumns = [
        "ADD COLUMN registration_number VARCHAR(100) NULL",
        "ADD COLUMN title VARCHAR(100) NULL",
        "ADD COLUMN awards TEXT NULL",
        "ADD COLUMN clinic_name VARCHAR(100) NULL",
        "ADD COLUMN clinic_address TEXT NULL",
        "ADD COLUMN clinic_timings VARCHAR(100) NULL",
        "ADD COLUMN website VARCHAR(255) NULL",
        "ADD COLUMN linkedin VARCHAR(255) NULL"
    ];

    // Update Users Table
    console.log('\nUpdating Users table...');
    for (const col of userColumns) {
        try {
            await db.execute(`ALTER TABLE users ${col}`);
            console.log(`✅ Executed: ALTER TABLE users ${col}`);
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log(`⚠️ Column already exists: ${col.split(' ')[2]}`);
            } else {
                console.error(`❌ Error adding column to users: ${err.message}`);
            }
        }
    }

    // Update Doctors Table
    console.log('\nUpdating Doctors table...');
    for (const col of doctorColumns) {
        try {
            await db.execute(`ALTER TABLE doctors ${col}`);
            console.log(`✅ Executed: ALTER TABLE doctors ${col}`);
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log(`⚠️ Column already exists: ${col.split(' ')[2]}`);
            } else {
                console.error(`❌ Error adding column to doctors: ${err.message}`);
            }
        }
    }

    console.log('\n✨ Schema update completed!');
    process.exit();
}

updateSchema();
