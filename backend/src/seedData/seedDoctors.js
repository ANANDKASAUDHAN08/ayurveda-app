require('dotenv').config();
const Doctor = require('../models/Doctor');
const Slot = require('../models/Slot');
const sequelize = require('../config/database');

// Comprehensive list of medical specializations
const specializations = [
    'Cardiology', 'Orthopedics', 'Dermatology', 'Pediatrics', 'Neurology',
    'Oncology', 'Gastroenterology', 'Nephrology', 'Pulmonology', 'Ophthalmology',
    'ENT', 'General Medicine', 'Gynecology', 'Psychiatry', 'Dentistry',
    'Urology', 'Endocrinology', 'Rheumatology', 'Anesthesiology', 'Radiology',
    'Pathology', 'General Surgery', 'Plastic Surgery', 'Ayurveda', 'Homeopathy'
];

// Common Indian first names
const firstNames = [
    'Rajesh', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Arjun', 'Kavita',
    'Rahul', 'Divya', 'Sanjay', 'Pooja', 'Karthik', 'Meera', 'Arun', 'Lakshmi',
    'Deepak', 'Nisha', 'Suresh', 'Aarti', 'Ravi', 'Swati', 'Manoj', 'Rekha',
    'Ashok', 'Sunita', 'Nitin', 'Geeta', 'Ramesh', 'Anita', 'Sachin', 'Usha',
    'Prakash', 'Shweta', 'Ajay', 'Ritu', 'Sandeep', 'Preeti', 'Naveen', 'Shalini',
    'Vikas', 'Smita', 'Hemant', 'Jyoti', 'Mahesh', 'Neelam', 'Rohit', 'Vandana',
    'Ashish', 'Madhuri', 'Sunil', 'Rani', 'Pankaj', 'Shilpa', 'Vijay', 'Sapna',
    'Dinesh', 'Neha', 'Gaurav', 'Pallavi', 'Vivek', 'Tanvi', 'Manish', 'Archana'
];

const lastNames = [
    'Sharma', 'Gupta', 'Patel', 'Kumar', 'Singh', 'Verma', 'Reddy', 'Rao',
    'Deshmukh', 'Kulkarni', 'Joshi', 'Iyer', 'Nair', 'Menon', 'Pillai', 'Das',
    'Chatterjee', 'Banerjee', 'Mukherjee', 'Roy', 'Kapoor', 'Malhotra', 'Chopra',
    'Mehta', 'Shah', 'Agarwal', 'Jain', 'Saxena', 'Sinha', 'Bose', 'Ghosh',
    'Dutta', 'Choudhury', 'Khan', 'Ahmed', 'Ali', 'Hussain', 'Fernandes', 'D\'Souza'
];

// Cities in India
const cities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
    'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
    'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad',
    'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
    'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar', 'Varanasi'
];

const modes = ['online', 'in-person', 'both'];

const aboutTemplates = [
    'Experienced medical professional dedicated to providing quality healthcare.',
    'Passionate about patient care and preventive medicine.',
    'Committed to evidence-based treatment and patient wellbeing.',
    'Specialist with focus on comprehensive patient care.',
    'Experienced practitioner with patient-centered approach.'
];

// Generate a random doctor
function generateDoctor(index) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const specialization = specializations[Math.floor(Math.random() * specializations.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const experience = Math.floor(Math.random() * 25) + 3; // 3-27 years
    const mode = modes[Math.floor(Math.random() * modes.length)];
    const consultationFee = (Math.floor(Math.random() * 15) + 3) * 100; // 300-1700 in steps of 100
    const about = aboutTemplates[Math.floor(Math.random() * aboutTemplates.length)];

    return {
        name: `Dr. ${firstName} ${lastName}`,
        specialization: specialization,
        experience: experience,
        mode: mode,
        location: city,
        consultationFee: consultationFee,
        about: about,
        qualifications: `MBBS, MD (${specialization})`,
        languages: 'English, Hindi',
        image: `https://i.pravatar.cc/150?img=${(index % 70) + 1}` // Random avatar
    };
}

async function seedDoctors() {
    try {
        // Connect to database
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // Sync models with force: true to clear data
        await sequelize.sync({ force: true });
        console.log('Database synced (cleared).');

        // Generate 100 diverse doctors
        const doctors = [];
        for (let i = 0; i < 100; i++) {
            doctors.push(generateDoctor(i));
        }

        // Bulk create doctors
        const createdDoctors = await Doctor.bulkCreate(doctors);
        console.log(`✅ Successfully seeded ${createdDoctors.length} doctors`);

        // Generate slots for each doctor
        const slots = [];
        const today = new Date();

        for (const doctor of createdDoctors) {
            // Create 5 slots for the next 7 days
            for (let day = 1; day <= 7; day++) {
                const date = new Date(today);
                date.setDate(today.getDate() + day);

                // 5 slots per day: 10am, 11am, 2pm, 3pm, 4pm
                const hours = [10, 11, 14, 15, 16];

                for (const hour of hours) {
                    const startTime = new Date(date);
                    startTime.setHours(hour, 0, 0, 0);

                    const endTime = new Date(startTime);
                    endTime.setMinutes(startTime.getMinutes() + 45); // 45 min slots

                    slots.push({
                        doctorId: doctor.id,
                        startTime: startTime,
                        endTime: endTime,
                        isBooked: false
                    });
                }
            }
        }

        // Bulk create slots
        await Slot.bulkCreate(slots);
        console.log(`✅ Successfully seeded ${slots.length} slots`);

        // Log some examples
        console.log('\nSample doctors created:');
        doctors.slice(0, 5).forEach(doc => {
            console.log(`- ${doc.name} (${doc.specialization}, ${doc.experience} yrs, ${doc.location})`);
        });

        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding doctors:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    seedDoctors();
}

module.exports = { seedDoctors };
