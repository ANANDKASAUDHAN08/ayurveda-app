require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const sequelize = require('./config/database');

async function createTestUser() {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        await sequelize.sync();
        console.log('Database synced.');

        // Check if test user already exists
        let user = await User.findOne({ where: { email: 'test@example.com' } });

        if (user) {
            console.log('✅ Test user already exists');
            console.log('Email: test@example.com');
            console.log('Password: password123');
            process.exit(0);
        }

        // Create test user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        user = await User.create({
            name: 'Test User',
            email: 'test@example.com',
            password: hashedPassword,
            role: 'user'
        });

        console.log('✅ Test user created successfully!');
        console.log('');
        console.log('Login credentials:');
        console.log('  Email: test@example.com');
        console.log('  Password: password123');
        console.log('');
        console.log('Use these credentials to log in and book appointments.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating test user:', error);
        process.exit(1);
    }
}

createTestUser();
