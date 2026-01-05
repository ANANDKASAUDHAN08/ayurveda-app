const db = require('../config/database');

const specializations = [
    'Cardiology', 'Orthopedics', 'Dermatology', 'Pediatrics', 'Neurology',
    'Oncology', 'Gastroenterology', 'Nephrology', 'Pulmonology', 'Ophthalmology',
    'ENT', 'General Medicine', 'Gynecology', 'Psychiatry', 'Dentistry',
    'Urology', 'Endocrinology', 'Rheumatology', 'Anesthesiology', 'Radiology',
    'Pathology', 'General Surgery', 'Plastic Surgery', 'Ayurveda', 'Homeopathy'
];

const firstNames = [
    'Rajesh', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Arjun', 'Kavita',
    'Rahul', 'Divya', 'Sanjay', 'Pooja', 'Karthik', 'Meera', 'Arun', 'Lakshmi',
    'Deepak', 'Nisha', 'Suresh', 'Aarti', 'Ravi', 'Swati', 'Manoj', 'Rekha',
    'Ashok', 'Sunita', 'Nitin', 'Geeta', 'Ramesh', 'Anita', 'Sachin', 'Usha',
    'Prakash', 'Shweta', 'Ajay', 'Ritu', 'Sandeep', 'Preeti', 'Naveen', 'Shalini',
    'Vikas', 'Smita', 'Hemant', 'Jyoti', 'Mahesh', 'Neelam', 'Rohit', 'Vandana'
];

const lastNames = [
    'Sharma', 'Gupta', 'Patel', 'Kumar', 'Singh', 'Verma', 'Reddy', 'Rao',
    'Deshmukh', 'Kulkarni', 'Joshi', 'Iyer', 'Nair', 'Menon', 'Pillai', 'Das',
    'Chatterjee', 'Banerjee', 'Mukherjee', 'Roy', 'Kapoor', 'Malhotra', 'Chopra',
    'Mehta', 'Shah', 'Agarwal', 'Jain', 'Saxena', 'Sinha', 'Bose'
];

const cities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
    'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur'
];

const modes = ['online', 'in-person', 'both'];

function generateDoctor(index) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const specialization = specializations[Math.floor(Math.random() * specializations.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const experience = Math.floor(Math.random() * 25) + 3;
    const mode = modes[Math.floor(Math.random() * modes.length)];

    return [
        `Dr. ${firstName} ${lastName}`,
        specialization,
        experience,
        mode,
        city,
        `https://i.pravatar.cc/150?img=${(index % 70) + 1}`,
        500, // consultationFee
        'English, Hindi' // languages
    ];
}

async function seed() {
    try {
        console.log('🌱 Starting seeding process...');

        // Check if doctors already exist
        const [rows] = await db.execute('SELECT COUNT(*) as count FROM doctors');
        const existingDoctorCount = rows[0].count;

        if (existingDoctorCount > 0) {
            console.log(`⚠️ ${existingDoctorCount} doctors already exist. Skipping seeding.`);
            process.exit(0);
        }

        // Generate 100 doctors
        const doctors = [];
        for (let i = 0; i < 100; i++) {
            doctors.push(generateDoctor(i));
        }

        // Bulk Insert Doctors
        // Note: mysql2 doesn't support bulk insert with array of arrays directly in execute
        // We need to construct the query string or use query() instead of execute() for multiple values
        // Or loop. For 100 records, a loop or constructing a large query is fine.
        // Let's construct a large query for efficiency.

        const placeholders = doctors.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
        const flatValues = doctors.flat();

        const insertDoctorsQuery = `
            INSERT INTO doctors (name, specialization, experience, mode, location, image, consultationFee, languages) 
            VALUES ${placeholders}
        `;

        await db.execute(insertDoctorsQuery, flatValues);
        console.log(`✅ Created ${doctors.length} doctors`);

        // Fetch all created doctors to get their IDs
        const [allDoctors] = await db.execute('SELECT id FROM doctors');

        // Generate Slots
        const slots = [];
        for (const doctor of allDoctors) {
            // Create 10 slots per doctor
            for (let i = 1; i <= 10; i++) {
                const date = new Date();
                date.setDate(date.getDate() + i);
                date.setHours(10, 0, 0, 0);

                const startTime = date;
                const endTime = new Date(date.getTime() + 30 * 60000); // 30 mins later

                slots.push([doctor.id, startTime, endTime, false]);
            }
        }

        // Bulk Insert Slots
        // Splitting into chunks to avoid query size limits if necessary, but 1000 slots should be fine
        const slotPlaceholders = slots.map(() => '(?, ?, ?, ?)').join(', ');
        const flatSlotValues = slots.flat();

        const insertSlotsQuery = `
            INSERT INTO slots (doctorId, startTime, endTime, isBooked) 
            VALUES ${slotPlaceholders}
        `;

        await db.execute(insertSlotsQuery, flatSlotValues);
        console.log(`✅ Created ${slots.length} slots`);

        console.log('\n🎉 Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
