const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * Download Indian Hospital/Health Facilities Data from GitHub
 * Source: planemad/india_health_facilities (GeoJSON format)
 * Alternative to data.gov.in which had broken links
 */

const GITHUB_GEOJSON_URL = 'https://raw.githubusercontent.com/planemad/india_health_facilities/master/data/india_health_facilities.geojson';
const DATA_DIR = path.join(__dirname, '../data');
const OUTPUT_FILE = path.join(DATA_DIR, 'indian-hospitals.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('✅ Created data directory');
}

console.log('📥 Downloading Indian Health Facilities Data from GitHub...');
console.log(`Source: ${GITHUB_GEOJSON_URL}`);
console.log(`Destination: ${OUTPUT_FILE}`);

const file = fs.createWriteStream(OUTPUT_FILE);

https.get(GITHUB_GEOJSON_URL, (response) => {
    // Handle redirects
    if (response.statusCode === 301 || response.statusCode === 302) {
        console.log('Following redirect...');
        https.get(response.headers.location, handleResponse);
        return;
    }

    handleResponse(response);
});

function handleResponse(response) {
    if (response.statusCode !== 200) {
        console.error(`❌ Failed to download: HTTP ${response.statusCode}`);
        console.log('\n💡 Alternative: Use dummy hospital data for now');
        console.log('💡 Or manually create a CSV file with hospital data');
        process.exit(1);
    }

    let downloadedBytes = 0;
    const totalBytes = parseInt(response.headers['content-length'], 10);

    response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes) {
            const progress = ((downloadedBytes / totalBytes) * 100).toFixed(2);
            process.stdout.write(`\rProgress: ${progress}% (${(downloadedBytes / 1024).toFixed(2)} KB / ${(totalBytes / 1024).toFixed(2)} KB)`);
        } else {
            process.stdout.write(`\rDownloaded: ${(downloadedBytes / 1024).toFixed(2)} KB`);
        }
    });

    response.pipe(file);

    file.on('finish', () => {
        file.close();
        console.log('\n✅ Download complete!');
        console.log(`📄 File saved to: ${OUTPUT_FILE}`);
        console.log(`📊 Size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB`);

        console.log('\n🚀 Next step: Run the import script');
        console.log('💡 Command: node backend/scripts/importHospitals.js');
    });
}

process.on('unhandledRejection', (error) => {
    console.error(`❌ Download failed: ${error.message}`);
    fs.unlink(OUTPUT_FILE, () => { });
    process.exit(1);
});
