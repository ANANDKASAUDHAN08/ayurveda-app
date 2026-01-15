const fs = require('fs');
const path = require('path');

const nabhPath = path.join(__dirname, 'backend/data/hospitals/nabh_accredited_list.json');
const specialtyCsvPath = path.join(__dirname, 'backend/data/hospitals/hospitals_with_specialties.csv');

const specialtySet = new Set();

// Extract from JSON
if (fs.existsSync(nabhPath)) {
    const data = JSON.parse(fs.readFileSync(nabhPath, 'utf8'));
    data.forEach(h => {
        if (h.specialties && Array.isArray(h.specialties)) {
            h.specialties.forEach(s => specialtySet.add(s.trim()));
        } else if (typeof h.specialties === 'string') {
            h.specialties.split(',').forEach(s => specialtySet.add(s.trim()));
        }
    });
}

// Extract from CSV
if (fs.existsSync(specialtyCsvPath)) {
    const csvData = fs.readFileSync(specialtyCsvPath, 'utf8');
    const lines = csvData.split('\n');
    lines.slice(1).forEach(line => {
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // Split by comma outside quotes
        if (parts.length >= 10) {
            const specs = parts[10].replace(/"/g, ''); // Adjust index if needed
            specs.split(',').forEach(s => {
                const clean = s.trim();
                if (clean && clean.length > 2 && clean !== 'NA') {
                    specialtySet.add(clean);
                }
            });
        }
    });
}

const allSpecialties = Array.from(specialtySet).sort();
fs.writeFileSync('all_specialties.json', JSON.stringify(allSpecialties, null, 2));
console.log(`Extracted ${allSpecialties.length} unique specialties.`);
console.log('Sample:', allSpecialties.slice(0, 10));
