const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Script to clean up existing doctors data and import from doctors.json
 * Works with existing database schema
 * Usage: node scripts/seed_doctors.js
 */

async function seedDoctors() {
    let connection;

    try {
        // Create database connection with SSL support for production
        const connectionConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'healthconnect',
            port: process.env.DB_PORT || 3306,
            multipleStatements: true,
            connectTimeout: 30000, // 30 seconds timeout
        };

        // Add SSL for production/remote databases
        if (process.env.DB_HOST && !process.env.DB_HOST.includes('localhost') && !process.env.DB_HOST.includes('127.0.0.1')) {
            connectionConfig.ssl = {
                rejectUnauthorized: false // For cloud databases like Aiven, AWS RDS, etc.
            };
        }

        connection = await mysql.createConnection(connectionConfig);

        console.log('✅ Connected to database');

        // Read doctors data from JSON file
        const doctorsPath = path.join(__dirname, '../data/doctors/doctors.json');
        const doctorsData = JSON.parse(fs.readFileSync(doctorsPath, 'utf8'));

        console.log(`📄 Found ${doctorsData.length} doctors in JSON file`);

        // Clean up existing data - keep only 2-3 records
        console.log('🧹 Cleaning up existing doctors...');

        // Get count of existing doctors
        const [existingCount] = await connection.query('SELECT COUNT(*) as count FROM doctors');
        console.log(`   Found ${existingCount[0].count} existing doctors`);

        if (existingCount[0].count > 0) {
            // Delete all except first 2
            await connection.query(`
                DELETE FROM doctors 
                WHERE id NOT IN (
                    SELECT * FROM (
                        SELECT id FROM doctors ORDER BY id LIMIT 2
                    ) as temp
                )
            `);
            console.log('   ✅ Cleaned up old doctor records, kept 2 samples');
        }

        // Insert new doctors from JSON
        console.log('📥 Importing new doctors from JSON...');

        let successCount = 0;
        let errorCount = 0;

        for (const doctor of doctorsData) {
            try {
                // Prepare data for existing schema
                const education = Array.isArray(doctor.education)
                    ? doctor.education.join('; ')
                    : doctor.education || '';

                const treatments = Array.isArray(doctor.treatments)
                    ? doctor.treatments.join(', ')
                    : doctor.treatments || '';

                const registrations = Array.isArray(doctor.registrations)
                    ? doctor.registrations.join('; ')
                    : doctor.registrations || '';

                // Extract consultation fee from biography if available
                let consultationFee = 1000; // default
                const feeMatch = doctor.biography?.match(/(?:fee|Fee|consultation fee).*?(?:Rs\\.?|₹)\\s*([0-9,]+)/i);
                if (feeMatch) {
                    consultationFee = parseInt(feeMatch[1].replace(/,/g, ''));
                }

                // Determine medicine_type based on specialty
                let medicineType = 'allopathy'; // default
                if (doctor.specialty?.toLowerCase().includes('ayurved')) {
                    medicineType = 'ayurveda';
                } else if (doctor.specialty?.toLowerCase().includes('homeo')) {
                    medicineType = 'homeopathy';
                }

                // Extract experience as number (e.g., "51 Years" -> 51)
                let experienceYears = 0;
                if (doctor.experience) {
                    const match = doctor.experience.match(/(\d+)/);
                    experienceYears = match ? parseInt(match[1]) : 0;
                }

                // Insert doctor matching your existing schema
                await connection.query(`
                    INSERT INTO doctors (
                        name, specialization, medicine_type, experience, mode, location,
                        about, qualifications, consultationFee, languages, image,
                        isVerified, phone, registration_number, title, awards,
                        clinic_name, clinic_address, clinic_timings, website
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    doctor.name,
                    doctor.specialty || 'General Medicine',
                    medicineType,
                    experienceYears, // Use the extracted number instead of string
                    'both', // online and offline
                    doctor.location || '',
                    doctor.biography || '',
                    education,
                    consultationFee,
                    'English, Hindi', // default languages
                    null, // image - will be added later
                    1, // isVerified
                    null, // phone - can be added later
                    registrations,
                    doctor.designation || '',
                    null, // awards
                    doctor.hospital || '',
                    null, // clinic_address
                    null, // clinic_timings
                    doctor.profileUrl || null
                ]);

                successCount++;
                process.stdout.write(`\r   Imported: ${successCount}/${doctorsData.length}`);
            } catch (error) {
                errorCount++;
                console.error(`\n   ❌ Error inserting doctor ${doctor.name}:`, error.message);
            }
        }

        console.log(`\n\n✅ Import completed!`);
        console.log(`   Successful: ${successCount}`);
        console.log(`   Failed: ${errorCount}`);
        console.log(`   Total: ${doctorsData.length}`);

        // Add default availability for all doctors (Mon-Sat, 10 AM - 5 PM)
        console.log('\n📅 Adding default availability schedules...');

        const [doctors] = await connection.query('SELECT id FROM doctors WHERE id > 2'); // Only for new doctors

        // day_of_week as tinyint: 1=Monday, 2=Tuesday, ..., 6=Saturday
        const days = [1, 2, 3, 4, 5, 6]; // Monday to Saturday

        for (const doctor of doctors) {
            for (const day of days) {
                await connection.query(`
                    INSERT INTO doctor_availability 
                    (doctor_id, day_of_week, start_time, end_time, slot_duration, is_active)
                    VALUES (?, ?, '10:00:00', '17:00:00', 30, 1)
                `, [doctor.id, day]);
            }
        }

        console.log(`   ✅ Added availability for ${doctors.length} new doctors`);

        // Display summary
        const [finalCount] = await connection.query('SELECT COUNT(*) as count FROM doctors');
        const [specialties] = await connection.query(`
            SELECT specialization, COUNT(*) as count 
            FROM doctors 
            GROUP BY specialization 
            ORDER BY count DESC
            LIMIT 10
        `);

        const [medicineTypes] = await connection.query(`
            SELECT medicine_type, COUNT(*) as count 
            FROM doctors 
            GROUP BY medicine_type
        `);

        console.log('\n📊 Final Summary:');
        console.log(`   Total Doctors: ${finalCount[0].count}`);

        console.log(`\n   By Medicine Type:`);
        medicineTypes.forEach(m => {
            console.log(`      ${m.medicine_type}: ${m.count}`);
        });

        console.log(`\n   Top Specialties:`);
        specialties.forEach(s => {
            console.log(`      ${s.specialization}: ${s.count}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n👋 Database connection closed');
        }
    }
}

// Run the seed script
seedDoctors();
