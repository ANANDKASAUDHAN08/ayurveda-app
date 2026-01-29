const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../src/config/database');

const JSON_FILE = path.join(__dirname, '../data/lab-tests/lab-tests-master.json');

async function importEnrichedLabTests() {
    try {
        if (!fs.existsSync(JSON_FILE)) {
            console.error('❌ Data file not found. Run downloadLabTestData.js first.');
            process.exit(1);
        }

        const data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
        console.log(`🚀 Starting enriched import of ${data.length} lab tests...`);

        // Clear existing data
        await db.execute("SET FOREIGN_KEY_CHECKS = 0");
        await db.execute("TRUNCATE TABLE lab_tests");
        await db.execute("SET FOREIGN_KEY_CHECKS = 1");

        const query = `
            INSERT INTO lab_tests (
                name, category, price, discounted_price, description, 
                purpose, preparation, sample_type, parameters_list, 
                parameters_count, reference_range, clinical_utility, 
                loinc_code, is_popular, report_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        let count = 0;
        for (const test of data) {
            const discountedPrice = Math.round(test.standard_price * 0.8); // 20% default discount
            const parametersCount = test.parameters ? test.parameters.length : 0;
            const parametersList = test.parameters ? JSON.stringify(test.parameters) : '[]';
            const referenceRange = test.reference_range ? JSON.stringify(test.reference_range) : '{}';

            await db.execute(query, [
                test.name,
                test.category,
                test.standard_price,
                discountedPrice,
                test.description,
                test.purpose || null,
                test.preparation || null,
                test.sample_type || 'Blood',
                parametersList,
                parametersCount,
                referenceRange,
                test.clinical_utility || null,
                test.loinc_code || null,
                test.is_popular ? 1 : 0,
                test.report_time || '24 hours'
            ]);
            count++;
        }

        console.log(`✅ Successfully imported ${count} enriched lab tests.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error importing enriched lab tests:', error);
        process.exit(1);
    }
}

importEnrichedLabTests();
