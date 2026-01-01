const db = require('./config/database');

const sampleRecords = [
    {
        user_id: 1,
        type: 'prescription',
        document_name: 'Annual Checkup Prescription',
        provider_name: 'City General Hospital',
        record_date: '2024-11-20',
        note: 'Daily multivitamin and rest recommended.'
    },
    {
        user_id: 1,
        type: 'lab_report',
        document_name: 'Blood Work - Complete Profiling',
        provider_name: 'Precision Labs',
        record_date: '2024-12-05',
        note: 'All parameters within normal range.'
    },
    {
        user_id: 1,
        type: 'radiology',
        document_name: 'Chest X-Ray',
        provider_name: 'Diagnostic Imaging Center',
        record_date: '2024-10-15',
        note: 'Clear - no significant findings.'
    }
];

async function seedClinicalData() {
    try {
        console.log('🌱 Seeding clinical data...');

        for (const record of sampleRecords) {
            await db.execute(
                `INSERT INTO medical_records (user_id, type, document_name, provider_name, record_date, note) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [record.user_id, record.type, record.document_name, record.provider_name, record.record_date, record.note]
            );
        }

        console.log('✅ Clinical data seeded successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
}

seedClinicalData();
