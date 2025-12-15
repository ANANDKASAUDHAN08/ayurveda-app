const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function createTestUser() {
    try {
        const email = 'testdoc@example.com';
        const password = 'password123';

        // Check if user exists
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

        let userId;
        if (users.length > 0) {
            console.log('✅ Test user already exists');
            userId = users[0].id;
        } else {
            console.log('👤 Creating test user...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const [result] = await db.execute(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                ['Test Doctor', email, hashedPassword, 'doctor']
            );
            userId = result.insertId;
            console.log('✅ Test user created');
        }

        // Check if doctor profile exists
        const [doctors] = await db.execute('SELECT * FROM doctors WHERE userId = ?', [userId]);

        if (doctors.length > 0) {
            console.log('✅ Doctor profile already exists');
        } else {
            console.log('👨‍⚕️ Creating doctor profile...');
            await db.execute(
                `INSERT INTO doctors (userId, name, specialization, mode, experience, about, qualifications, consultationFee, languages, image) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, 'Dr. Test Doctor', 'General Medicine', 'both', 5, 'A test doctor profile', 'MBBS', 500, 'English', 'https://i.pravatar.cc/150?img=1']
            );
            console.log('✅ Doctor profile created');
        }

        console.log('\n🎉 Test Account Ready:');
        console.log('   Email: testdoc@example.com');
        console.log('   Password: password123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createTestUser();
