const db = require('../config/database');

async function checkSchema() {
    try {
        console.log('--- Users Table ---');
        const [usersDesc] = await db.execute('DESCRIBE users');
        console.table(usersDesc);

        console.log('\n--- Doctors Table ---');
        const [doctorsDesc] = await db.execute('DESCRIBE doctors');
        console.table(doctorsDesc);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
