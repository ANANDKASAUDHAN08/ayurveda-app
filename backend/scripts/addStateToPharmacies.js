const fs = require('fs');
const path = require('path');

// Comprehensive city to state mapping for India
const cityToState = {
    // Tamil Nadu
    'chennai': 'Tamil Nadu',
    'coimbatore': 'Tamil Nadu',
    'madurai': 'Tamil Nadu',
    'tiruchirappalli': 'Tamil Nadu',
    'trichy': 'Tamil Nadu',
    'salem': 'Tamil Nadu',
    'tirunelveli': 'Tamil Nadu',
    'erode': 'Tamil Nadu',
    'vellore': 'Tamil Nadu',
    'thoothukudi': 'Tamil Nadu',
    'dindigul': 'Tamil Nadu',
    'thanjavur': 'Tamil Nadu',
    'kanchipuram': 'Tamil Nadu',
    'hosur': 'Tamil Nadu',
    'nagercoil': 'Tamil Nadu',
    'kumbakonam': 'Tamil Nadu',
    'tiruppur': 'Tamil Nadu',

    // Maharashtra
    'mumbai': 'Maharashtra',
    'pune': 'Maharashtra',
    'nagpur': 'Maharashtra',
    'thane': 'Maharashtra',
    'nashik': 'Maharashtra',
    'kalyan': 'Maharashtra',
    'vasai': 'Maharashtra',
    'solapur': 'Maharashtra',
    'mira-bhayandar': 'Maharashtra',
    'bhiwandi': 'Maharashtra',
    'amravati': 'Maharashtra',
    'nanded': 'Maharashtra',
    'kolhapur': 'Maharashtra',
    'aurangabad': 'Maharashtra',
    'sangli': 'Maharashtra',

    // Karnataka
    'bangalore': 'Karnataka',
    'bengaluru': 'Karnataka',
    'mysore': 'Karnataka',
    'mysuru': 'Karnataka',
    'hubli': 'Karnataka',
    'mangalore': 'Karnataka',
    'belgaum': 'Karnataka',
    'davangere': 'Karnataka',
    'bellary': 'Karnataka',
    'bijapur': 'Karnataka',
    'shimoga': 'Karnataka',
    'tumkur': 'Karnataka',
    'raichur': 'Karnataka',
    'bidar': 'Karnataka',

    // Delhi & NCR
    'delhi': 'Delhi',
    'new delhi': 'Delhi',
    'noida': 'Uttar Pradesh',
    'greater noida': 'Uttar Pradesh',
    'ghaziabad': 'Uttar Pradesh',
    'faridabad': 'Haryana',
    'gurugram': 'Haryana',
    'gurgaon': 'Haryana',

    // Uttar Pradesh
    'lucknow': 'Uttar Pradesh',
    'kanpur': 'Uttar Pradesh',
    'agra': 'Uttar Pradesh',
    'varanasi': 'Uttar Pradesh',
    'meerut': 'Uttar Pradesh',
    'allahabad': 'Uttar Pradesh',
    'prayagraj': 'Uttar Pradesh',
    'bareilly': 'Uttar Pradesh',
    'aligarh': 'Uttar Pradesh',
    'moradabad': 'Uttar Pradesh',
    'saharanpur': 'Uttar Pradesh',
    'gorakhpur': 'Uttar Pradesh',

    // Gujarat
    'ahmedabad': 'Gujarat',
    'surat': 'Gujarat',
    'vadodara': 'Gujarat',
    'rajkot': 'Gujarat',
    'bhavnagar': 'Gujarat',
    'jamnagar': 'Gujarat',
    'junagadh': 'Gujarat',
    'gandhinagar': 'Gujarat',
    'anand': 'Gujarat',

    // Rajasthan
    'jaipur': 'Rajasthan',
    'jodhpur': 'Rajasthan',
    'kota': 'Rajasthan',
    'bikaner': 'Rajasthan',
    'udaipur': 'Rajasthan',
    'ajmer': 'Rajasthan',
    'bhilwara': 'Rajasthan',
    'alwar': 'Rajasthan',

    // West Bengal
    'kolkata': 'West Bengal',
    'howrah': 'West Bengal',
    'durgapur': 'West Bengal',
    'asansol': 'West Bengal',
    'siliguri': 'West Bengal',

    // Telangana
    'hyderabad': 'Telangana',
    'warangal': 'Telangana',
    'nizamabad': 'Telangana',
    'karimnagar': 'Telangana',
    'khammam': 'Telangana',

    // Andhra Pradesh
    'visakhapatnam': 'Andhra Pradesh',
    'vijayawada': 'Andhra Pradesh',
    'guntur': 'Andhra Pradesh',
    'nellore': 'Andhra Pradesh',
    'kurnool': 'Andhra Pradesh',
    'tirupati': 'Andhra Pradesh',
    'rajahmundry': 'Andhra Pradesh',

    // Kerala
    'thiruvananthapuram': 'Kerala',
    'kochi': 'Kerala',
    'cochin': 'Kerala',
    'kozhikode': 'Kerala',
    'calicut': 'Kerala',
    'thrissur': 'Kerala',
    'kollam': 'Kerala',
    'kannur': 'Kerala',

    // Madhya Pradesh
    'indore': 'Madhya Pradesh',
    'bhopal': 'Madhya Pradesh',
    'jabalpur': 'Madhya Pradesh',
    'gwalior': 'Madhya Pradesh',
    'ujjain': 'Madhya Pradesh',

    // Punjab
    'ludhiana': 'Punjab',
    'amritsar': 'Punjab',
    'jalandhar': 'Punjab',
    'patiala': 'Punjab',
    'bathinda': 'Punjab',

    // Haryana
    'chandigarh': 'Chandigarh',
    'panipat': 'Haryana',
    'ambala': 'Haryana',
    'yamunanagar': 'Haryana',
    'rohtak': 'Haryana',

    // Bihar
    'patna': 'Bihar',
    'gaya': 'Bihar',
    'bhagalpur': 'Bihar',
    'muzaffarpur': 'Bihar',

    // Odisha
    'bhubaneswar': 'Odisha',
    'cuttack': 'Odisha',
    'rourkela': 'Odisha',

    // Assam
    'guwahati': 'Assam',
    'silchar': 'Assam',
    'dibrugarh': 'Assam',

    // Jharkhand
    'ranchi': 'Jharkhand',
    'jamshedpur': 'Jharkhand',
    'dhanbad': 'Jharkhand',

    // Uttarakhand
    'dehradun': 'Uttarakhand',
    'haridwar': 'Uttarakhand',
    'roorkee': 'Uttarakhand',

    // Chhattisgarh
    'raipur': 'Chhattisgarh',
    'bhilai': 'Chhattisgarh',

    // Goa
    'panaji': 'Goa',
    'margao': 'Goa',
    'vasco da gama': 'Goa',

    // Himachal Pradesh
    'shimla': 'Himachal Pradesh',
    'dharamshala': 'Himachal Pradesh',

    // Jammu & Kashmir
    'srinagar': 'Jammu and Kashmir',
    'jammu': 'Jammu and Kashmir',

    // Puducherry
    'puducherry': 'Puducherry',
    'pondicherry': 'Puducherry'
};

/**
 * Extract state from address string if present
 * @param {string} address - The pharmacy address
 * @returns {string|null} - State name if found, null otherwise
 */
function extractStateFromAddress(address) {
    if (!address) return null;

    const addressLower = address.toLowerCase();

    // Common state patterns in addresses
    const statePatterns = [
        'tamil nadu', 'maharashtra', 'karnataka', 'delhi', 'uttar pradesh',
        'gujarat', 'rajasthan', 'west bengal', 'telangana', 'andhra pradesh',
        'kerala', 'madhya pradesh', 'punjab', 'haryana', 'bihar', 'odisha',
        'assam', 'jharkhand', 'uttarakhand', 'chhattisgarh', 'goa',
        'himachal pradesh', 'jammu and kashmir', 'puducherry', 'chandigarh'
    ];

    for (const state of statePatterns) {
        if (addressLower.includes(state)) {
            // Return proper case
            return state.split(' ').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
        }
    }

    return null;
}

/**
 * Get state from city name
 * @param {string} city - The city name
 * @returns {string|null} - State name if found, null otherwise
 */
function getStateFromCity(city) {
    if (!city) return null;

    const cityLower = city.toLowerCase().trim();
    return cityToState[cityLower] || null;
}

/**
 * Process a pharmacy record and add state field
 * @param {Object} pharmacy - Pharmacy object
 * @returns {Object} - Updated pharmacy object with state field
 */
function addStateToPharmacy(pharmacy) {
    // First try to extract state from address
    let state = extractStateFromAddress(pharmacy.address);

    // If not found in address, infer from city
    if (!state) {
        state = getStateFromCity(pharmacy.city);
    }

    // Return pharmacy with state field
    return {
        ...pharmacy,
        state: state || 'Unknown'
    };
}

/**
 * Process all pharmacy JSON files in the data directory
 */
function processPharmacyFiles() {
    const dataDir = path.join(__dirname, '../data/pharmacies');

    if (!fs.existsSync(dataDir)) {
        console.error(`Directory not found: ${dataDir}`);
        return;
    }

    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));

    console.log(`Found ${files.length} JSON file(s) to process\n`);

    let totalProcessed = 0;
    let totalWithState = 0;
    let totalFromCity = 0;
    let totalUnknown = 0;

    files.forEach(file => {
        const filePath = path.join(dataDir, file);
        console.log(`Processing: ${file}`);

        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            if (!Array.isArray(data)) {
                console.warn(`  ⚠️  Skipping ${file} - not an array`);
                return;
            }

            let fileWithState = 0;
            let fileFromCity = 0;
            let fileUnknown = 0;

            const updatedData = data.map(pharmacy => {
                totalProcessed++;

                const stateFromAddress = extractStateFromAddress(pharmacy.address);
                const stateFromCity = getStateFromCity(pharmacy.city);

                if (stateFromAddress) {
                    fileWithState++;
                    totalWithState++;
                } else if (stateFromCity) {
                    fileFromCity++;
                    totalFromCity++;
                } else {
                    fileUnknown++;
                    totalUnknown++;
                }

                return addStateToPharmacy(pharmacy);
            });

            // Write back to file with proper formatting
            fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), 'utf8');

            console.log(`  ✓ Processed ${data.length} records`);
            console.log(`    - From address: ${fileWithState}`);
            console.log(`    - From city: ${fileFromCity}`);
            console.log(`    - Unknown: ${fileUnknown}\n`);

        } catch (error) {
            console.error(`  ✗ Error processing ${file}:`, error.message);
        }
    });

    console.log('═══════════════════════════════════════');
    console.log('Summary:');
    console.log(`Total pharmacies processed: ${totalProcessed}`);
    console.log(`State from address: ${totalWithState}`);
    console.log(`State inferred from city: ${totalFromCity}`);
    console.log(`State unknown: ${totalUnknown}`);
    console.log('═══════════════════════════════════════');
}

// Run the script
if (require.main === module) {
    processPharmacyFiles();
}

module.exports = {
    addStateToPharmacy,
    extractStateFromAddress,
    getStateFromCity,
    cityToState
};
