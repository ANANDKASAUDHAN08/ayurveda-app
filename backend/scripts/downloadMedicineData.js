const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * Download Indian Medicine Dataset from GitHub
 * Source: https://github.com/junioralive/Indian-Medicine-Dataset
 * Updated: December 10, 2024
 */

const DATASET_URL = 'https://raw.githubusercontent.com/junioralive/Indian-Medicine-Dataset/main/DATA/indian_medicine_data.csv';
const DATA_DIR = path.join(__dirname, '../data');
const OUTPUT_FILE = path.join(DATA_DIR, 'indian-medicines.csv');

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('✅ Created data directory');
}

console.log('📥 Downloading Indian Medicine Dataset...');
console.log(`Source: ${DATASET_URL}`);
console.log(`Destination: ${OUTPUT_FILE}`);

const file = fs.createWriteStream(OUTPUT_FILE);

https.get(DATASET_URL, (response) => {
    if (response.statusCode !== 200) {
        console.error(`❌ Failed to download: HTTP ${response.statusCode}`);
        process.exit(1);
    }

    let downloadedBytes = 0;
    const totalBytes = parseInt(response.headers['content-length'], 10);

    response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes) {
            const progress = ((downloadedBytes / totalBytes) * 100).toFixed(2);
            process.stdout.write(`\rProgress: ${progress}% (${(downloadedBytes / 1024 / 1024).toFixed(2)} MB / ${(totalBytes / 1024 / 1024).toFixed(2)} MB)`);
        } else {
            process.stdout.write(`\rDownloaded: ${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`);
        }
    });

    response.pipe(file);

    file.on('finish', () => {
        file.close();
        console.log('\n✅ Download complete!');
        console.log(`📄 File saved to: ${OUTPUT_FILE}`);
        console.log(`📊 Size: ${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB`);

        // Show row count estimate
        const content = fs.readFileSync(OUTPUT_FILE, 'utf-8');
        const lines = content.split('\n').length - 1;
        console.log(`📋 Estimated rows: ${lines.toLocaleString()}`);

        console.log('\n🚀 Next step: Run the import script');
        console.log('💡 Command: node backend/scripts/importMedicines.js');
    });
}).on('error', (err) => {
    fs.unlink(OUTPUT_FILE, () => { });
    console.error(`❌ Download failed: ${err.message}`);
    process.exit(1);
});
