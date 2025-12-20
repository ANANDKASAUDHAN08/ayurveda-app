const fs = require('fs');
const path = require('path');

// Quick script to check CSV column headers
const CSV_FILE = path.join(__dirname, '../data/indian-medicines.csv');

const content = fs.readFileSync(CSV_FILE, 'utf-8');
const lines = content.split('\n').slice(0, 3);

console.log('=== CSV FILE STRUCTURE ===\n');
console.log('Header Row:');
console.log(lines[0]);
console.log('\nSample Data Row:');
console.log(lines[1]);
console.log('\nColumn Names:');
const headers = lines[0].split(',');
headers.forEach((h, i) => {
    console.log(`  [${i}] ${h.trim()}`);
});
