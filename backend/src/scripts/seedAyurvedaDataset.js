const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../config/database');

async function seedAyurvedaDataset() {
    try {
        console.log('🌱 Starting Ayurveda Dataset Seeding...');

        // 1. Create the table with 34 columns
        await db.execute(`
            CREATE TABLE IF NOT EXISTS ayurveda_knowledge (
                id INT AUTO_INCREMENT PRIMARY KEY,
                disease VARCHAR(255),
                hindi_name VARCHAR(255),
                marathi_name VARCHAR(255),
                symptoms TEXT,
                diagnosis_tests TEXT,
                severity VARCHAR(100),
                treatment_duration VARCHAR(255),
                medical_history TEXT,
                current_medications TEXT,
                risk_factors TEXT,
                environmental_factors TEXT,
                sleep_patterns TEXT,
                stress_levels TEXT,
                physical_activity TEXT,
                family_history TEXT,
                dietary_habits TEXT,
                allergies TEXT,
                seasonal_variation TEXT,
                age_group VARCHAR(100),
                gender VARCHAR(100),
                occupation_lifestyle TEXT,
                cultural_preferences TEXT,
                herbal_remedies TEXT,
                ayurvedic_herbs TEXT,
                formulation TEXT,
                doshas TEXT,
                constitution_prakriti TEXT,
                diet_lifestyle_recommendations TEXT,
                yoga_physical_therapy TEXT,
                medical_intervention TEXT,
                prevention TEXT,
                prognosis TEXT,
                complications TEXT,
                patient_recommendations TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('✅ Table ayurveda_knowledge created or already exists.');

        // 2. Clear existing data to avoid duplicates (optional but usually preferred for seeds)
        await db.execute('TRUNCATE TABLE ayurveda_knowledge');
        console.log('🧹 Existing data cleared.');

        // 3. Parse CSV and Insert
        const csvFilePath = path.join(__dirname, '../../data/ayurveda/AyurGenixAI_Dataset.csv');
        const results = [];

        fs.createReadStream(csvFilePath)
            .pipe(csv({
                mapHeaders: ({ header }) => header.replace(/^\ufeff/, '').trim()
            }))
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                console.log(`📄 CSV parsed. Total rows: ${results.length}`);

                const barLength = 20;
                let inserted = 0;

                let isFirstRow = true;
                for (const row of results) {
                    if (isFirstRow) {
                        console.log('🔍 First row keys:', Object.keys(row));
                        isFirstRow = false;
                    }
                    try {
                        const getValue = (key) => {
                            const val = row[key];
                            return (val === undefined || val === '') ? null : val;
                        };

                        const params = [
                            getValue('Disease'),
                            getValue('Hindi Name'),
                            getValue('Marathi Name'),
                            getValue('Symptoms'),
                            getValue('Diagnosis & Tests'),
                            getValue('Symptom Severity'),
                            getValue('Duration of Treatment'),
                            getValue('Medical History'),
                            getValue('Current Medications'),
                            getValue('Risk Factors'),
                            getValue('Environmental Factors'),
                            getValue('Sleep Patterns'),
                            getValue('Stress Levels'),
                            getValue('Physical Activity Levels'),
                            getValue('Family History'),
                            getValue('Dietary Habits'),
                            getValue('Allergies (Food/Env)'),
                            getValue('Seasonal Variation'),
                            getValue('Age Group'),
                            getValue('Gender'),
                            getValue('Occupation and Lifestyle'),
                            getValue('Cultural Preferences'),
                            getValue('Herbal/Alternative Remedies'),
                            getValue('Ayurvedic Herbs'),
                            getValue('Formulation'),
                            getValue('Doshas'),
                            getValue('Constitution/Prakriti'),
                            getValue('Diet and Lifestyle Recommendations'),
                            getValue('Yoga & Physical Therapy'),
                            getValue('Medical Intervention'),
                            getValue('Prevention'),
                            row['Prognosis'] === undefined ? null : row['Prognosis'], // manual check for one
                            getValue('Complications'),
                            getValue('Patient Recommendations')
                        ];

                        // Ensure all elements are either string, number or null (not undefined)
                        const sanitizedParams = params.map(p => p === undefined ? null : p);

                        await db.execute(`
                            INSERT INTO ayurveda_knowledge (
                                disease, hindi_name, marathi_name, symptoms, diagnosis_tests, 
                                severity, treatment_duration, medical_history, current_medications, 
                                risk_factors, environmental_factors, sleep_patterns, stress_levels, 
                                physical_activity, family_history, dietary_habits, allergies, 
                                seasonal_variation, age_group, gender, occupation_lifestyle, 
                                cultural_preferences, herbal_remedies, ayurvedic_herbs, formulation, 
                                doshas, constitution_prakriti, diet_lifestyle_recommendations, 
                                yoga_physical_therapy, medical_intervention, prevention, 
                                prognosis, complications, patient_recommendations
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, sanitizedParams);

                        inserted++;
                        if (inserted % 50 === 0 || inserted === results.length) {
                            const progress = Math.round((inserted / results.length) * barLength);
                            const bar = '█'.repeat(progress) + '░'.repeat(barLength - progress);
                            process.stdout.write(`\rProgress: [${bar}] ${inserted}/${results.length}`);
                        }
                    } catch (err) {
                        console.error(`\n❌ Error inserting row ${inserted + 1} (${row['Disease'] || 'Unknown'}):`, err);
                        console.error('Row data:', row);
                        process.exit(1);
                    }
                }

                console.log('\n✅ Dataset seeded successfully!');
                process.exit(0);
            });

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedAyurvedaDataset();
