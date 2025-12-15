const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Connected to database.');

        // Check if column exists
        const [columns] = await conn.query("SHOW COLUMNS FROM users LIKE 'profile_image'");

        if (columns.length === 0) {
            console.log('Adding profile_image column to users table...');
            await conn.query("ALTER TABLE users ADD COLUMN profile_image VARCHAR(255) DEFAULT NULL");
            console.log('Column added successfully.');
        } else {
            console.log('profile_image column already exists.');
        }

        await conn.end();
    } catch (err) {
        console.error('Error updating schema:', err);
    }
})();
