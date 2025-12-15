const db = require('../config/database');

async function createDateExceptionsTable() {
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS doctor_date_exceptions (
            id INT PRIMARY KEY AUTO_INCREMENT,
            doctor_id INT NOT NULL,
            exception_date DATE NOT NULL,
            is_available BOOLEAN DEFAULT FALSE,
            start_time TIME NULL,
            end_time TIME NULL,
            slot_duration INT DEFAULT 30,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
            UNIQUE KEY unique_doctor_date (doctor_id, exception_date),
            INDEX idx_doctor_date (doctor_id, exception_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    try {
        await db.query(createTableSQL);
        console.log('✓ doctor_date_exceptions table created or already exists');
        process.exit(0);
    } catch (error) {
        console.error('Error creating doctor_date_exceptions table:', error);
        process.exit(1);
    }
}

createDateExceptionsTable();
