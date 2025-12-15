const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdminUser() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'healthconnect_db'
    });

    try {
        // Check if admin user already exists
        const [existing] = await connection.execute(
            'SELECT * FROM users WHERE email = ?',
            ['admin@healthconnect.com']
        );

        if (existing.length > 0) {
            console.log('⚠️  Admin user already exists.');
            console.log('Updating password to match bcrypt hash...');

            // Recreate with proper bcrypt hash
            const password = 'admin123';
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await connection.execute(
                'UPDATE users SET password = ? WHERE email = ?',
                [hashedPassword, 'admin@healthconnect.com']
            );

            console.log('✅ Admin password updated!');
        } else {
            // Create admin user with bcrypt hashed password
            const password = 'admin123';
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await connection.execute(
                `INSERT INTO users (name, email, password, role, phone) 
         VALUES (?, ?, ?, ?, ?)`,
                ['Admin User', 'admin@healthconnect.com', hashedPassword, 'admin', '+1234567890']
            );

            console.log('✅ Admin user created successfully!');
        }

        console.log('\n📧 Login Credentials:');
        console.log('Email: admin@healthconnect.com');
        console.log('Password: admin123');
        console.log('\n🔗 Next Steps:');
        console.log('1. Open http://localhost:4200/admin');
        console.log('2. Login with the above credentials');
        console.log('3. You\'ll be redirected to the admin dashboard');
        console.log('\n✨ Admin panel is ready to use!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\nTroubleshooting:');
        console.log('- Ensure MySQL is running');
        console.log('- Verify database exists: healthconnect_db');
        console.log('- Check .env file has correct DB credentials');
    } finally {
        await connection.end();
    }
}

createAdminUser();
