const { sequelize } = require('./models/index');
const Doctor = require('./models/Doctor');
const Slot = require('./models/Slot');
const { seedDoctors } = require('./seedDoctors');

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database');

        await sequelize.sync({ force: true });
        console.log('Database synced');

        await seedDoctors();

        // Seed slots for all doctors
        const doctors = await Doctor.findAll();
        const slotsToCreate = [];

        for (const doctor of doctors) {
            // Create 10 slots per doctor (next 10 days)
            for (let i = 1; i <= 10; i++) {
                const date = new Date();
                date.setDate(date.getDate() + i);
                date.setHours(10, 0, 0, 0);

                slotsToCreate.push({
                    doctorId: doctor.id,
                    startTime: date,
                    endTime: new Date(date.getTime() + 30 * 60000),
                    isBooked: false
                });
            }
        }

        await Slot.bulkCreate(slotsToCreate);
        console.log(`Created ${slotsToCreate.length} slots`);

        console.log('\n✅ All seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
