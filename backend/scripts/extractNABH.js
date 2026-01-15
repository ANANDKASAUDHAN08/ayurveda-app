const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

/**
 * NABH Data Extractor v3
 * Designed for manual batch processing.
 * 
 * Usage Examples:
 * node scripts/extractNABH.js --specialties="Ayurveda,Internal Medicine" --state="Andhra Pradesh"
 * node scripts/extractNABH.js --category="Dental Facilities"
 */

const HTML_FILE = path.join(__dirname, 'profiles/temp.html');
const JSON_FILE = path.join(__dirname, '../data/hospitals/nabh_accredited_list.json');

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
    "Ladakh", "Lakshadweep", "Puducherry"
];

function getArgs() {
    const args = {};
    process.argv.slice(2).forEach(val => {
        if (val.startsWith('--')) {
            const split = val.split('=');
            const key = split[0].replace('--', '');
            const value = split.length > 1 ? split[1] : true;
            args[key] = value;
        }
    });
    return args;
}

async function extract() {
    const args = getArgs();

    // Process multiple specialties if provided (comma-separated)
    const manualSpecialties = args.specialties ? args.specialties.split(',').map(s => s.trim()) : [];
    const manualState = args.state;
    const manualCategory = args.category;

    console.log('🔍 Starting Batch NABH Extraction...');

    if (!fs.existsSync(HTML_FILE)) {
        console.error('❌ Error: temp.html not found.');
        return;
    }

    const html = fs.readFileSync(HTML_FILE, 'utf8');
    const $ = cheerio.load(html);
    const newResults = [];

    $('.hp-body-row').each((i, element) => {
        const name = $(element).find('.hs-col-1 a').text().trim();
        const address = $(element).find('.hs-col-2').text().trim();
        const contact = $(element).find('.hs-col-3 .d-none.d-lg-block div').first().text().trim() || 'NA';
        const accNo = $(element).find('.hs-col-4 a').text().trim();
        const status = $(element).find('.certification-icon').text().trim();
        const certLink = $(element).find('.hs-col-4 a').attr('href') || '';
        const websiteLink = $(element).find('.hs-col-3 a[target="_blank"]').attr('href') || null;

        // 1. Detection: State
        let state = manualState || 'Unknown';
        if (state === 'Unknown') {
            for (const s of INDIAN_STATES) {
                if (address.toLowerCase().includes(s.toLowerCase())) {
                    state = s;
                    break;
                }
            }
        }

        // 2. Detection: Category (From URL if not provided)
        let category = manualCategory || 'General';
        if (!manualCategory && certLink) {
            const parts = certLink.split('/');
            if (parts.length > 2) {
                category = decodeURIComponent(parts[parts.length - 2]);
            }
        }

        if (name) {
            newResults.push({
                name,
                address,
                state,
                contact,
                acc_no: accNo,
                status,
                category,
                specialties: manualSpecialties,
                certificate_link: certLink,
                website: websiteLink,
                extracted_at: new Date().toISOString()
            });
        }
    });

    if (newResults.length === 0) {
        console.log('⚠️  No hospitals found in temp.html.');
        return;
    }

    // Load and Merge
    let allData = [];
    if (fs.existsSync(JSON_FILE)) {
        try {
            allData = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
        } catch (e) { allData = []; }
    }

    newResults.forEach(newItem => {
        const existing = allData.find(item => item.acc_no === newItem.acc_no);
        if (existing) {
            // Update fields if they were missing
            if (existing.state === 'Unknown' && newItem.state !== 'Unknown') existing.state = newItem.state;

            // Merge specialties (avoiding duplicates)
            newItem.specialties.forEach(s => {
                if (!existing.specialties.includes(s)) existing.specialties.push(s);
            });
        } else {
            allData.push(newItem);
        }
    });

    fs.writeFileSync(JSON_FILE, JSON.stringify(allData, null, 4));

    console.log(`✅ Success! Processed ${newResults.length} items.`);
    console.log(`🌍 State: ${manualState || 'Auto-detected'}`);
    console.log(`📂 Category: ${manualCategory || 'Auto-detected'}`);
    console.log(`🏷️  Specialties: ${manualSpecialties.join(', ') || 'None'}`);
    console.log(`📊 Total JSON records: ${allData.length}`);
}

extract();
