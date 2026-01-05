const db = require('../config/database');

const labTests = [
    {
        name: 'Complete Blood Count (CBC)',
        category: 'Diagnostic',
        price: 299,
        discounted_price: 249,
        description: 'Measures different components of your blood including RBC, WBC, platelets, and hemoglobin.',
        includes: '22 parameters',
        parameters_count: 22,
        is_popular: true,
        sample_type: 'Blood',
        fasting_required: false,
        report_time: '24 hours'
    },
    {
        name: 'Diabetes Wellness Package',
        category: 'Preventive',
        price: 1499,
        discounted_price: 899,
        description: 'Comprehensive screening for diabetes risk and management including HbA1c and glucose levels.',
        includes: 'HbA1c, Fasting Glucose, Lipid Profile',
        parameters_count: 15,
        is_popular: true,
        sample_type: 'Blood',
        fasting_required: true,
        report_time: '24 hours'
    },
    {
        name: 'Thyroid Profile (T3, T4, TSH)',
        category: 'Diagnostic',
        price: 599,
        discounted_price: 449,
        description: 'Complete thyroid function test to check T3, T4, and TSH hormone levels.',
        includes: '3 key hormones',
        parameters_count: 3,
        is_popular: false,
        sample_type: 'Blood',
        fasting_required: false,
        report_time: '24 hours'
    },
    {
        name: 'Full Body Health Checkup',
        category: 'Wellness',
        price: 3999,
        discounted_price: 1999,
        description: 'Master health screening package covering all major organs and systems for comprehensive health assessment.',
        includes: 'Complete wellness package',
        parameters_count: 80,
        is_popular: true,
        sample_type: 'Blood & Urine',
        fasting_required: true,
        report_time: '48 hours'
    },
    {
        name: 'Vitamin D (25-OH)',
        category: 'Specialized',
        price: 1200,
        discounted_price: 799,
        description: 'Monitor your vitamin D levels essential for bone health and immunity.',
        includes: 'Serum 25-OH Vitamin D',
        parameters_count: 1,
        is_popular: false,
        sample_type: 'Blood',
        fasting_required: false,
        report_time: '48 hours'
    },
    {
        name: 'Liver Function Test (LFT)',
        category: 'Diagnostic',
        price: 899,
        discounted_price: 599,
        description: 'Comprehensive liver health assessment including bilirubin, enzymes, and proteins.',
        includes: 'Bilirubin, ALT, AST, ALP, Total Protein',
        parameters_count: 11,
        is_popular: false,
        sample_type: 'Blood',
        fasting_required: true,
        report_time: '24 hours'
    },
    {
        name: 'Kidney Function Test (KFT)',
        category: 'Diagnostic',
        price: 699,
        discounted_price: 499,
        description: 'Evaluate kidney function and detect early signs of kidney disease.',
        includes: 'Urea, Creatinine, Uric Acid, Electrolytes',
        parameters_count: 8,
        is_popular: true,
        sample_type: 'Blood',
        fasting_required: false,
        report_time: '24 hours'
    },
    {
        name: 'Lipid Profile',
        category: 'Preventive',
        price: 599,
        discounted_price: 399,
        description: 'Check cholesterol and triglyceride levels to assess heart disease risk.',
        includes: 'Total Cholesterol, HDL, LDL, VLDL, Triglycerides',
        parameters_count: 8,
        is_popular: true,
        sample_type: 'Blood',
        fasting_required: true,
        report_time: '24 hours'
    },
    {
        name: 'HbA1c (Glycated Hemoglobin)',
        category: 'Diagnostic',
        price: 499,
        discounted_price: 349,
        description: 'Average blood sugar control over the past 3 months for diabetes monitoring.',
        includes: 'HbA1c percentage',
        parameters_count: 1,
        is_popular: true,
        sample_type: 'Blood',
        fasting_required: false,
        report_time: '24 hours'
    },
    {
        name: 'Vitamin B12',
        category: 'Specialized',
        price: 899,
        discounted_price: 649,
        description: 'Detect vitamin B12 deficiency which can cause anemia and neurological issues.',
        includes: 'Serum B12 levels',
        parameters_count: 1,
        is_popular: false,
        sample_type: 'Blood',
        fasting_required: false,
        report_time: '24 hours'
    },
    {
        name: 'Iron Studies',
        category: 'Diagnostic',
        price: 1099,
        discounted_price: 799,
        description: 'Complete iron profile for detecting anemia and iron deficiency.',
        includes: 'Serum Iron, TIBC, Ferritin, Transferrin',
        parameters_count: 4,
        is_popular: false,
        sample_type: 'Blood',
        fasting_required: true,
        report_time: '24 hours'
    },
    {
        name: 'Cancer Marker (PSA) - Male',
        category: 'Specialized',
        price: 799,
        discounted_price: 599,
        description: 'Prostate cancer screening test for men above 40 years.',
        includes: 'PSA Total & Free',
        parameters_count: 2,
        is_popular: false,
        sample_type: 'Blood',
        fasting_required: false,
        report_time: '24 hours'
    },
    {
        name: 'Women Wellness Package',
        category: 'Wellness',
        price: 2499,
        discounted_price: 1499,
        description: 'Comprehensive health checkup designed specifically for women including hormones and vitamins.',
        includes: 'Hormones, Vitamins, CBC, Thyroid, Iron',
        parameters_count: 45,
        is_popular: true,
        sample_type: 'Blood',
        fasting_required: true,
        report_time: '48 hours'
    },
    {
        name: 'Urine Routine & Microscopy',
        category: 'Diagnostic',
        price: 299,
        discounted_price: 199,
        description: 'Detect urinary tract infections, kidney disease, and diabetes through urine analysis.',
        includes: 'Physical, Chemical, Microscopic examination',
        parameters_count: 15,
        is_popular: false,
        sample_type: 'Urine',
        fasting_required: false,
        report_time: '24 hours'
    },
    {
        name: 'Cardiac Risk Markers',
        category: 'Specialized',
        price: 1799,
        discounted_price: 1199,
        description: 'Advanced cardiac risk assessment including inflammatory markers and lipid ratios.',
        includes: 'hs-CRP, Homocysteine, Lipid Profile, Apo B',
        parameters_count: 12,
        is_popular: false,
        sample_type: 'Blood',
        fasting_required: true,
        report_time: '48 hours'
    }
];

async function seedLabTests() {
    try {
        // Check if table has data
        const [existing] = await db.execute('SELECT COUNT(*) as count FROM lab_tests');

        if (existing[0].count > 0) {
            console.log('⚠️  Lab tests table already has data. Skipping seed.');
            process.exit(0);
        }

        // Insert all tests
        for (const test of labTests) {
            await db.execute(
                `INSERT INTO lab_tests (name, category, price, discounted_price, description, includes, parameters_count, is_popular, sample_type, fasting_required, report_time) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    test.name,
                    test.category,
                    test.price,
                    test.discounted_price,
                    test.description,
                    test.includes,
                    test.parameters_count,
                    test.is_popular,
                    test.sample_type,
                    test.fasting_required,
                    test.report_time
                ]
            );
        }

        console.log(`✅ Successfully seeded ${labTests.length} lab tests`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
}

seedLabTests();
