const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixAppointmentsTable() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'healthconnect_db',
            multipleStatements: true
        });

        console.log('Connected to database');

        // Drop existing appointments table
        console.log('Dropping existing appointments table...');
        await connection.query('DROP TABLE IF EXISTS appointments');
        console.log('✓ Dropped appointments table');

        // Create new appointments table with correct schema
        console.log('Creating appointments table with correct schema...');
        const createTableSQL = `
            CREATE TABLE appointments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                doctor_id INT NOT NULL,
                slot_id INT NOT NULL,
                appointment_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
                FOREIGN KEY (slot_id) REFERENCES appointment_slots(id) ON DELETE CASCADE,
                INDEX idx_user_appointments (user_id, appointment_date),
                INDEX idx_doctor_appointments (doctor_id, appointment_date)
            )
        `;

        await connection.query(createTableSQL);
        console.log('✓ Created appointments table');

        // Verify table structure
        console.log('\nVerifying table structure:');
        const [columns] = await connection.query('DESCRIBE appointments');
        columns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type})`);
        });

        console.log('\n✅ Appointments table fixed successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

fixAppointmentsTable();
