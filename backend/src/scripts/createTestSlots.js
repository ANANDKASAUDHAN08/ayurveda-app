const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTestSlots() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ayurveda_app'
    });

    try {
        console.log('Connected to database...');

        // Get all doctors
        const [doctors] = await connection.execute('SELECT id, name FROM doctors LIMIT 10');
        console.log(`Found ${doctors.length} doctors`);

        if (doctors.length === 0) {
            console.log('No doctors found. Please add doctors first.');
            return;
        }

        // For each doctor, create availability and slots for next 30 days
        for (const doctor of doctors) {
            console.log(`\nCreating slots for Dr. ${doctor.name} (ID: ${doctor.id})...`);

            // Delete existing availability and slots
            await connection.execute('DELETE FROM doctor_availability WHERE doctor_id = ?', [doctor.id]);
            await connection.execute('DELETE FROM appointment_slots WHERE doctor_id = ?', [doctor.id]);

            // Create availability (Monday to Friday, 9 AM to 5 PM, 30-min slots)
            const availability = [
                [doctor.id, 1, '09:00:00', '17:00:00', 30, true], // Monday
                [doctor.id, 2, '09:00:00', '17:00:00', 30, true], // Tuesday
                [doctor.id, 3, '09:00:00', '17:00:00', 30, true], // Wednesday
                [doctor.id, 4, '09:00:00', '17:00:00', 30, true], // Thursday
                [doctor.id, 5, '09:00:00', '17:00:00', 30, true], // Friday
            ];

            await connection.query(
                `INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration, is_active) VALUES ?`,
                [availability]
            );

            // Generate slots for next 30 days
            const slots = [];
            const today = new Date();

            for (let i = 1; i <= 30; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                const dayOfWeek = date.getDay();

                // Only create slots for weekdays (Monday=1 to Friday=5)
                if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                    const dateStr = date.toISOString().split('T')[0];

                    // Create slots from 9 AM to 5 PM (30-min intervals)
                    for (let hour = 9; hour < 17; hour++) {
                        for (let min = 0; min < 60; min += 30) {
                            const startHour = hour.toString().padStart(2, '0');
                            const startMin = min.toString().padStart(2, '0');
                            const endTime = new Date(2000, 0, 1, hour, min + 30);
                            const endHour = endTime.getHours().toString().padStart(2, '0');
                            const endMin = endTime.getMinutes().toString().padStart(2, '0');

                            slots.push([
                                doctor.id,
                                dateStr,
                                `${startHour}:${startMin}:00`,
                                `${endHour}:${endMin}:00`,
                                false
                            ]);
                        }
                    }
                }
            }

            if (slots.length > 0) {
                await connection.query(
                    `INSERT INTO appointment_slots (doctor_id, slot_date, start_time, end_time, is_booked) VALUES ?`,
                    [slots]
                );
                console.log(`Created ${slots.length} slots for Dr. ${doctor.name}`);
            }
        }

        console.log('\n✅ Test slots created successfully!');
    } catch (error) {
        console.error('Error creating test slots:', error);
    } finally {
        await connection.end();
    }
}

createTestSlots();
