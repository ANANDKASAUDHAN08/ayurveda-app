const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const csvPath = path.join(__dirname, '../data/hospitals/geocode_health_centre.csv');

async function verify() {
    let lineCount = 0;
    let validCoords = 0;
    let missingCoords = 0;
    let outOfBounds = 0;
    let duplicates = new Set();
    let duplicateCount = 0;

    const statsByState = {};
    const statsByType = {};

    console.log('Starting verification of health centre data...');

    fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
            lineCount++;

            const state = row['State Name'];
            const district = row['District Name'];
            const facilityName = row['Facility Name'];
            const facilityType = row['Facility Type'];
            const lat = parseFloat(row['Latitude']);
            const lng = parseFloat(row['Longitude']);

            if (isNaN(lat) || isNaN(lng)) {
                missingCoords++;
            } else {
                // India bounds approx: 6.7 to 37.1 Lat, 68.1 to 97.4 Lng
                if (lat < 6 || lat > 38 || lng < 68 || lng > 98) {
                    outOfBounds++;
                } else {
                    validCoords++;
                }
            }

            const id = `${state}|${district}|${facilityName}`;
            if (duplicates.has(id)) {
                duplicateCount++;
            } else {
                duplicates.add(id);
            }

            if (state) statsByState[state] = (statsByState[state] || 0) + 1;
            if (facilityType) statsByType[facilityType] = (statsByType[facilityType] || 0) + 1;
        })
        .on('end', () => {
            console.log('\n--- Verification Results ---');
            console.log(`Total Facilities: ${lineCount}`);
            console.log(`Valid Coordinates: ${validCoords}`);
            console.log(`Missing/Invalid Coordinates: ${missingCoords}`);
            console.log(`Out of Bounds (Outside India): ${outOfBounds}`);
            console.log(`Duplicates (Name+District+State): ${duplicateCount}`);

            console.log('\nStats by Facility Type:');
            console.table(statsByType);

            console.log('\nStats by State:');
            console.table(statsByState);

            console.log('\nVerification Complete.');
        })
        .on('error', (error) => {
            console.error('Error during verification:', error);
        });
}

verify();
