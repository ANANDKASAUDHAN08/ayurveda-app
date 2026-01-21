const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateVideoSessionsSchema() {
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

        // Check if columns already exist
        const [columns] = await connection.query('DESCRIBE video_sessions');
        const columnNames = columns.map(col => col.Field);

        if (!columnNames.includes('meeting_link')) {
            console.log('Adding meeting_link column...');
            await connection.query('ALTER TABLE video_sessions ADD COLUMN meeting_link VARCHAR(512) AFTER status');
            console.log('✓ Added meeting_link');
        } else {
            console.log('meeting_link column already exists');
        }

        if (!columnNames.includes('meeting_platform')) {
            console.log('Adding meeting_platform column...');
            await connection.query("ALTER TABLE video_sessions ADD COLUMN meeting_platform ENUM('custom', 'google_meet', 'ms_teams') DEFAULT 'custom' AFTER meeting_link");
            console.log('✓ Added meeting_platform');
        } else {
            console.log('meeting_platform column already exists');
        }

        console.log('\n✅ Video sessions table updated successfully!');

    } catch (error) {
        console.error('❌ Error updating schema:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

updateVideoSessionsSchema();
