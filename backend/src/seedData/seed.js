const sequelize = require('../config/database');
const Doctor = require('../models/Doctor');
const Slot = require('../models/Slot');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        await sequelize.sync({ force: true }); // Reset DB

        // Create Admin/User
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('password', salt);

        await User.create({
            name: 'Test User',
            email: 'test@example.com',
            password: password,
            role: 'user'
        });

        // Create Doctors
        const doctors = await Doctor.bulkCreate([
            {
                name: 'Dr. Sharma',
                specialization: 'Panchakarma',
                mode: 'both',
                experience: 10,
                image: 'https://via.placeholder.com/150'
            },
            {
                name: 'Dr. Gupta',
                specialization: 'Dermatology',
                mode: 'online',
                experience: 5,
                image: 'https://via.placeholder.com/150'
            },
            {
                name: 'Dr. Iyer',
                specialization: 'General',
                mode: 'in-person',
                experience: 15,
                image: 'https://via.placeholder.com/150'
            }
        ]);

        // Create Slots for next 3 days
        const slots = [];
        const now = new Date();

        for (const doctor of doctors) {
            for (let i = 1; i <= 3; i++) {
                const date = new Date(now);
                date.setDate(date.getDate() + i);
                date.setHours(10, 0, 0, 0); // Start at 10 AM

                for (let j = 0; j < 5; j++) { // 5 slots per day
                    const startTime = new Date(date);
                    startTime.setMinutes(startTime.getMinutes() + j * 60); // Hourly slots
                    const endTime = new Date(startTime);
                    endTime.setMinutes(endTime.getMinutes() + 45); // 45 min duration

                    slots.push({
                        doctorId: doctor.id,
                        startTime,
                        endTime
                    });
                }
            }
        }

        await Slot.bulkCreate(slots);

        console.log('Database seeded successfully');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seed();
