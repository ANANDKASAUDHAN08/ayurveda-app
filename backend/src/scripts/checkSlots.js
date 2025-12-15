const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSlots() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'healthconnect_db'
        });

        console.log('Connected to database.');

        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM appointment_slots');
        console.log('Total slots:', rows[0].count);

        const [doctors] = await connection.execute('SELECT id, name FROM doctors LIMIT 5');
        console.log('Doctors:', doctors);

        if (doctors.length > 0) {
            const [doctorSlots] = await connection.execute('SELECT COUNT(*) as count FROM appointment_slots WHERE doctor_id = ?', [doctors[0].id]);
            console.log(`Slots for doctor ${doctors[0].name} (ID: ${doctors[0].id}):`, doctorSlots[0].count);
        }

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkSlots();
