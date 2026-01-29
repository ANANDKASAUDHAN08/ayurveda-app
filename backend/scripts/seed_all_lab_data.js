const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../src/config/database');

const LABS_JSON = path.join(__dirname, '../data/labs/private-labs-master.json');
const TESTS_JSON = path.join(__dirname, '../data/lab-tests/lab-tests-master.json');

async function seedData() {
    try {
        console.log('🚀 Starting combined seeding process...');

        // 1. Seed Lab Tests
        if (fs.existsSync(TESTS_JSON)) {
            const testsData = JSON.parse(fs.readFileSync(TESTS_JSON, 'utf8'));
            console.log(`📝 Importing ${testsData.length} lab tests...`);

            await db.execute("SET FOREIGN_KEY_CHECKS = 0");
            await db.execute("TRUNCATE TABLE lab_tests");
            await db.execute("SET FOREIGN_KEY_CHECKS = 1");

            const testQuery = `
                INSERT INTO lab_tests (
                    name, category, price, discounted_price, description, 
                    purpose, preparation, sample_type, parameters_list, 
                    parameters_count, reference_range, clinical_utility, 
                    loinc_code, is_popular, report_time
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            for (const test of testsData) {
                const discountedPrice = Math.round(test.standard_price * 0.8); // 20% discount
                const paramsList = test.parameters ? JSON.stringify(test.parameters) : '[]';
                const refRange = test.reference_range ? JSON.stringify(test.reference_range) : '{}';

                await db.execute(testQuery, [
                    test.name,
                    test.category,
                    test.standard_price,
                    discountedPrice,
                    test.description || '',
                    test.purpose || null,
                    test.preparation || null,
                    test.sample_type || 'Blood',
                    paramsList,
                    test.parameters ? test.parameters.length : 0,
                    refRange,
                    test.clinical_utility || null,
                    test.loinc_code || null,
                    test.is_popular ? 1 : 0,
                    test.report_time || '24 Hours'
                ]);
            }
            console.log('✅ Lab tests seeded successfully');
        } else {
            console.warn('⚠️ Lab tests JSON not found, skipping...');
        }

        // 2. Seed Laboratories
        if (fs.existsSync(LABS_JSON)) {
            const labsData = JSON.parse(fs.readFileSync(LABS_JSON, 'utf8'));
            console.log(`📝 Importing ${labsData.length} laboratories...`);

            await db.execute("SET FOREIGN_KEY_CHECKS = 0");
            await db.execute("TRUNCATE TABLE laboratories");
            await db.execute("SET FOREIGN_KEY_CHECKS = 1");

            const labQuery = `
                INSERT INTO laboratories (
                    name, address, city, state, pincode, phone, 
                    website, latitude, longitude, timings, services, 
                    is_nabl_accredited, is_cghs_empanelled, rating, data_source
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            for (const lab of labsData) {
                await db.execute(labQuery, [
                    lab.name,
                    lab.address,
                    lab.city,
                    lab.state,
                    lab.pincode || null,
                    lab.phone || null,
                    lab.website || null,
                    lab.latitude || null,
                    lab.longitude || null,
                    lab.timings || null,
                    lab.services ? JSON.stringify(lab.services) : '[]',
                    lab.is_nabl_accredited ? 1 : 0,
                    lab.is_cghs_empanelled ? 1 : 0,
                    lab.rating || 0.0,
                    lab.data_source || 'Manual Import'
                ]);
            }
            console.log('✅ Laboratories seeded successfully');
        } else {
            console.warn('⚠️ Laboratories JSON not found, skipping...');
        }

        console.log('✨ All data seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedData();
