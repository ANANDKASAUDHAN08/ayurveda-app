const db = require('../config/database');

async function createLabTestsTable() {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS lab_tests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category ENUM('Popular', 'Preventive', 'Diagnostic', 'Specialized', 'Wellness') NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                discounted_price DECIMAL(10, 2),
                description TEXT,
                includes VARCHAR(255),
                parameters_count INT,
                is_popular BOOLEAN DEFAULT FALSE,
                sample_type VARCHAR(100),
                fasting_required BOOLEAN DEFAULT FALSE,
                report_time VARCHAR(50) DEFAULT '24 hours',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_category (category),
                INDEX idx_popular (is_popular),
                INDEX idx_price (discounted_price)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;

        await db.execute(createTableQuery);
        console.log('✅ Lab tests table created successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating lab tests table:', error);
        process.exit(1);
    }
}

createLabTestsTable();
