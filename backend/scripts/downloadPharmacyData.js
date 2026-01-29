const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Download Pharmacy/Chemist Shop data from OpenStreetMap using Overpass API
 * And refine missing addresses using Nominatim (OpenStreetMap Reverse Geocoding)
 */

const OVERPASS_ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.nchc.org.tw/api/interpreter'
];
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const DATA_DIR = path.join(__dirname, '../data/pharmacies');
const OUTPUT_FILE = path.join(DATA_DIR, 'chemist-shops.json');

// Area names can be passed as arguments: node downloadPharmacyData.js "Mumbai" "Bangalore" "Chennai"
// If no arguments, defaults to Delhi
const AREAS = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ['Delhi'];

const getQuery = (areaName) => `
[out:json][timeout:180];
area["name"="${areaName}"]->.searchArea;
(
  node["amenity"="pharmacy"](area.searchArea);
  node["shop"="pharmacy"](area.searchArea);
  node["shop"="chemist"](area.searchArea);
);
out body;
`;

/**
 * Helper to delay execution (Nominatim requires 1 second per request)
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchFromOverpass(areaName) {
    const query = getQuery(areaName);
    for (const endpoint of OVERPASS_ENDPOINTS) {
        try {
            console.log(`   📥 Trying Overpass API for "${areaName}" at: ${endpoint}...`);
            const response = await axios.post(endpoint, `data=${encodeURIComponent(query)}`, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'AyurvedaHealthcareApp/1.0'
                },
                timeout: 180000 // 3 minute timeout
            });
            if (response.data && response.data.elements) {
                return response.data;
            }
        } catch (error) {
            console.log(`   ⚠️  Endpoint ${endpoint} failed or timed out. Trying next...`);
        }
    }
    throw new Error(`All Overpass API endpoints failed for ${areaName}.`);
}

async function fetchAddressFromNominatim(lat, lon) {
    try {
        const response = await axios.get(NOMINATIM_URL, {
            params: {
                format: 'json',
                lat: lat,
                lon: lon,
                zoom: 18,
                addressdetails: 1
            },
            headers: {
                'User-Agent': 'AyurvedaHealthcareApp/1.0 (Refining medical store addresses)'
            }
        });
        return response.data;
    } catch (e) {
        return null;
    }
}

async function downloadPharmacyData() {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        // Load existing data if it exists
        let allPharmacies = [];
        if (fs.existsSync(OUTPUT_FILE)) {
            try {
                allPharmacies = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
                console.log(`📦 Loaded ${allPharmacies.length} existing pharmacies from file.`);
            } catch (e) {
                console.log('⚠️  Could not parse existing data, starting fresh.');
            }
        }

        for (const areaName of AREAS) {
            console.log(`🚀 Processing city: ${areaName}`);
            const data = await fetchFromOverpass(areaName);

            if (data && data.elements) {
                const elements = data.elements;
                console.log(`   📊 Received ${elements.length} raw elements for ${areaName}.`);

                const newPharmacies = elements
                    .filter(el => el.type === 'node')
                    .map(el => {
                        const tags = el.tags || {};
                        const addrTags = [
                            tags['addr:full'],
                            tags['addr:place'],
                            tags['addr:neighbourhood'],
                            tags['addr:street'],
                            tags['addr:suburb']
                        ].filter(Boolean);

                        let address = addrTags.length > 0 ? addrTags.join(', ') : 'Address not available';

                        if (address === 'Address not available') {
                            const parts = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean);
                            if (parts.length > 0) address = parts.join(', ');
                        }

                        return {
                            osm_id: el.id,
                            name: tags.name || tags['name:en'] || 'Chemist Shop',
                            address: address,
                            city: tags['addr:city'] || tags['addr:district'] || areaName,
                            state: tags['addr:state'] || '',
                            pincode: tags['addr:postcode'] || '',
                            phone: tags.phone || tags['contact:phone'] || tags['contact:mobile'] || 'N/A',
                            latitude: el.lat,
                            longitude: el.lon,
                            opening_hours: tags.opening_hours || 'N/A',
                            brand: tags.brand || tags.operator || 'Independent',
                            data_source: 'OpenStreetMap'
                        };
                    });

                // Dedup based on osm_id
                const existingIds = new Set(allPharmacies.map(p => p.osm_id));
                const uniqueNew = newPharmacies.filter(p => !existingIds.has(p.osm_id));

                allPharmacies = [...allPharmacies, ...uniqueNew];
                console.log(`   ➕ Added ${uniqueNew.length} new unique pharmacies.`);
            }
        }

        console.log(`\n✅ Total pharmacies collected: ${allPharmacies.length}`);

        // --- REFINEMENT STEP ---
        const missingCount = allPharmacies.filter(p => p.address === 'Address not available').length;
        if (missingCount > 0) {
            console.log(`\n🔍 Found ${missingCount} pharmacies with missing addresses across all cities.`);
            console.log(`🔧 Attempting to fill ${Math.min(missingCount, 100)} addresses using Reverse Geocoding...`);
            console.log(`⏳ (This will take a few minutes to respect Nominatim rate limits)`);

            let filled = 0;
            for (let p of allPharmacies) {
                if (p.address === 'Address not available') {
                    const geoData = await fetchAddressFromNominatim(p.latitude, p.longitude);
                    if (geoData && geoData.display_name) {
                        p.address = geoData.display_name;
                        // Update other fields if available
                        if (!p.pincode && geoData.address.postcode) p.pincode = geoData.address.postcode;
                        filled++;
                        process.stdout.write(`\r✅ Filled: ${filled}/${Math.min(missingCount, 100)}`);
                    }
                    await delay(1200);
                }
                if (filled >= 100) break;
            }
            console.log('\n✨ Refinement step completed.');
        }

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allPharmacies, null, 2));
        console.log(`\n✅ SUCCESSFULLY DOWNLOADED AND REFINED ${allPharmacies.length} PHARMACIES!`);
        console.log(`📄 Saved to: ${OUTPUT_FILE}`);
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        if (error.code === 'ECONNABORTED') {
            console.error('❌ ERROR: Request timed out. Try a smaller area or check your connection.');
        }
        if (error.response && error.response.data) {
            console.log('--- API Error Details ---');
            console.log(error.response.data);
        }
    }
}

downloadPharmacyData();
