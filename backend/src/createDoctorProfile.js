require('dotenv').config();
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const sequelize = require('./config/database');

async function createDoctorProfile() {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        await sequelize.sync();
        console.log('Database synced.');

        // Find the test user
        const user = await User.findOne({ where: { email: 'test@example.com' } });

        if (!user) {
            console.error('❌ Test user not found. Please run createTestUser.js first.');
            process.exit(1);
        }

        // Check if doctor profile already exists
        let doctor = await Doctor.findOne({ where: { userId: user.id } });

        if (doctor) {
            console.log('✅ Doctor profile already exists for test user');
            console.log('Doctor ID:', doctor.id);
            console.log('Name:', doctor.name);
            process.exit(0);
        }

        // Create doctor profile
        doctor = await Doctor.create({
            userId: user.id,
            name: user.name,
            specialization: 'General Medicine',
            mode: 'both',
            experience: 5,
            about: 'Experienced medical professional dedicated to providing quality healthcare.',
            qualifications: 'MBBS, MD',
            consultationFee: 500,
            languages: 'English, Hindi',
            image: 'https://i.pravatar.cc/150?img=1',
            location: 'Mumbai'
        });

        console.log('✅ Doctor profile created successfully!');
        console.log('');
        console.log('Doctor Details:');
        console.log('  ID:', doctor.id);
        console.log('  Name:', doctor.name);
        console.log('  Specialization:', doctor.specialization);
        console.log('  User ID:', doctor.userId);
        console.log('');
        console.log('You can now update the profile from the Doctor Dashboard.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating doctor profile:', error);
        process.exit(1);
    }
}

createDoctorProfile();
