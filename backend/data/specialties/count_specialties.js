const fs = require('fs');
const path = require('path');

const nabhPath = path.join(__dirname, 'backend/data/hospitals/nabh_accredited_list.json');
const specialtyCsvPath = path.join(__dirname, 'backend/data/hospitals/hospitals_with_specialties.csv');

const specialtyCounts = {};

function addSpecialty(name) {
    const clean = name.trim();
    if (clean && clean.length > 2 && clean !== 'NA') {
        specialtyCounts[clean] = (specialtyCounts[clean] || 0) + 1;
    }
}

// Extract from JSON
if (fs.existsSync(nabhPath)) {
    const data = JSON.parse(fs.readFileSync(nabhPath, 'utf8'));
    data.forEach(h => {
        if (h.specialties && Array.isArray(h.specialties)) {
            h.specialties.forEach(addSpecialty);
        } else if (typeof h.specialties === 'string') {
            h.specialties.split(',').forEach(addSpecialty);
        }
    });
}

// Extract from CSV
if (fs.existsSync(specialtyCsvPath)) {
    const csvData = fs.readFileSync(specialtyCsvPath, 'utf8');
    const lines = csvData.split('\n');
    lines.slice(1).forEach(line => {
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (parts.length >= 10) {
            const specs = parts[10].replace(/"/g, '');
            specs.split(',').forEach(addSpecialty);
        }
    });
}

const sortedSpecialties = Object.entries(specialtyCounts)
    .sort((a, b) => b[1] - a[1]);

fs.writeFileSync('specialty_frequencies.json', JSON.stringify(sortedSpecialties, null, 2));
console.log('Top 20 Specialties:');
console.log(sortedSpecialties.slice(0, 20));
