const https = require('https');
const fs = require('fs');
const path = require('path');

const DATA_SOURCES = [
    {
        name: 'hospitals_covid_viz.csv',
        url: 'https://raw.githubusercontent.com/OneFourthLabs/CoViD19-Viz/master/hospitals.csv',
        description: 'Contains private/public classification and contact info'
    },
    {
        name: 'hospitals_with_specialties.csv',
        url: 'https://raw.githubusercontent.com/AtriSaxena/HospitalsAPI/master/Hospital_with_discipline_jul_15.csv',
        description: 'Private hospitals with specialization categories'
    },
    {
        name: 'nin_health_facilities.csv',
        url: 'https://raw.githubusercontent.com/gkalyan04/HealthX/master/nin-health-facilities.csv',
        description: 'National Identification Number (NIN) health facilities with high detail'
    }
];

const DATA_DIR = path.join(__dirname, '../data/hospitals');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

console.log('📥 Downloading Private Hospital Datasets...\n');

async function downloadFile(source) {
    const filePath = path.join(DATA_DIR, source.name);
    const file = fs.createWriteStream(filePath);

    return new Promise((resolve, reject) => {
        https.get(source.url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${source.name}: ${response.statusCode}`));
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`✅ Downloaded: ${source.name}`);
                console.log(`   Description: ${source.description}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filePath, () => { });
            reject(err);
        });
    });
}

async function run() {
    for (const source of DATA_SOURCES) {
        try {
            await downloadFile(source);
        } catch (error) {
            console.error(`❌ Error downloading ${source.name}: ${error.message}`);
        }
    }
    console.log('\n🚀 Downloads complete. Files are in backend/data/private_hospitals/');
}

run();
