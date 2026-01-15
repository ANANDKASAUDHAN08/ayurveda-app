const db = require('../config/database');

async function migrate() {
    try {
        console.log('🚀 Starting Calendar Migration...');

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS calendar_events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                userId INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                start_time DATETIME NOT NULL,
                end_time DATETIME,
                type ENUM('appointment', 'order', 'ritual', 'medication', 'activity', 'vital', 'weather_alert') NOT NULL,
                sub_type ENUM('ayurveda', 'allopathy', 'general') DEFAULT 'general',
                category VARCHAR(100),
                status ENUM('planned', 'completed', 'skipped', 'active') DEFAULT 'planned',
                value VARCHAR(255),
                unit VARCHAR(50),
                is_system_generated BOOLEAN DEFAULT FALSE,
                metadata JSON,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;

        await db.execute(createTableQuery);
        console.log('✅ Table "calendar_events" created or already exists.');

        // Indexing for faster lookups
        await db.execute('CREATE INDEX idx_user_time ON calendar_events(userId, start_time)');
        console.log('✅ Index created on userId and start_time.');

        console.log('🎉 Calendar migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
