const mysql = require('mysql2/promise');
require('dotenv').config();

async function createNewslettersTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'healthConnect_db',
        port: process.env.DB_PORT || 3306,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });

    try {
        console.log('Creating newsletters table...');

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS newsletters (
                id INT PRIMARY KEY AUTO_INCREMENT,
                email VARCHAR(255) NOT NULL UNIQUE,
                subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status ENUM('active', 'unsubscribed') DEFAULT 'active',
                unsubscribe_token VARCHAR(255) UNIQUE,
                INDEX idx_email (email),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('✅ Newsletters table created successfully!');
    } catch (error) {
        console.error('❌ Error creating newsletters table:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

// Run migration
createNewslettersTable()
    .then(() => {
        console.log('Migration completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
