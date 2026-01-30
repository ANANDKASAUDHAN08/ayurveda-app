const fs = require('fs');
const path = require('path');

// Comprehensive India city to state mapping
const CITY_TO_STATE = {
    // Major cities
    'mumbai': 'Maharashtra', 'pune': 'Maharashtra', 'nagpur': 'Maharashtra', 'nashik': 'Maharashtra', 'thane': 'Maharashtra', 'aurangabad': 'Maharashtra',
    'delhi': 'Delhi', 'new delhi': 'Delhi',
    'bangalore': 'Karnataka', 'bengaluru': 'Karnataka', 'mysore': 'Karnataka', 'mangalore': 'Karnataka', 'hubli': 'Karnataka', 'belgaum': 'Karnataka',
    'hyderabad': 'Telangana', 'warangal': 'Telangana', 'nizamabad': 'Telangana', 'karimnagar': 'Telangana',
    'chennai': 'Tamil Nadu', 'coimbatore': 'Tamil Nadu', 'madurai': 'Tamil Nadu', 'tiruchirappalli': 'Tamil Nadu', 'salem': 'Tamil Nadu', 'tiruppur': 'Tamil Nadu',
    'kolkata': 'West Bengal', 'howrah': 'West Bengal', 'durgapur': 'West Bengal', 'asansol': 'West Bengal', 'siliguri': 'West Bengal',
    'ahmedabad': 'Gujarat', 'surat': 'Gujarat', 'vadodara': 'Gujarat', 'rajkot': 'Gujarat', 'bhavnagar': 'Gujarat', 'jamnagar': 'Gujarat',
    'jaipur': 'Rajasthan', 'jodhpur': 'Rajasthan', 'kota': 'Rajasthan', 'bikaner': 'Rajasthan', 'udaipur': 'Rajasthan', 'ajmer': 'Rajasthan',
    'lucknow': 'Uttar Pradesh', 'kanpur': 'Uttar Pradesh', 'ghaziabad': 'Uttar Pradesh', 'agra': 'Uttar Pradesh', 'meerut': 'Uttar Pradesh',
    'varanasi': 'Uttar Pradesh', 'allahabad': 'Uttar Pradesh', 'prayagraj': 'Uttar Pradesh', 'bareilly': 'Uttar Pradesh', 'aligarh': 'Uttar Pradesh',
    'moradabad': 'Uttar Pradesh', 'noida': 'Uttar Pradesh', 'greater noida': 'Uttar Pradesh', 'faridabad': 'Haryana', 'gurgaon': 'Haryana',
    'gurugram': 'Haryana', 'panipat': 'Haryana', 'ambala': 'Haryana', 'yamunanagar': 'Haryana', 'rohtak': 'Haryana',
    'chandigarh': 'Chandigarh', 'ludhiana': 'Punjab', 'amritsar': 'Punjab', 'jalandhar': 'Punjab', 'patiala': 'Punjab', 'bathinda': 'Punjab',
    'bhopal': 'Madhya Pradesh', 'indore': 'Madhya Pradesh', 'jabalpur': 'Madhya Pradesh', 'gwalior': 'Madhya Pradesh', 'ujjain': 'Madhya Pradesh',
    'patna': 'Bihar', 'gaya': 'Bihar', 'bhagalpur': 'Bihar', 'muzaffarpur': 'Bihar', 'purnia': 'Bihar',
    'ranchi': 'Jharkhand', 'jamshedpur': 'Jharkhand', 'dhanbad': 'Jharkhand', 'bokaro': 'Jharkhand',
    'bhubaneswar': 'Odisha', 'cuttack': 'Odisha', 'rourkela': 'Odisha', 'brahmapur': 'Odisha',
    'visakhapatnam': 'Andhra Pradesh', 'vijayawada': 'Andhra Pradesh', 'guntur': 'Andhra Pradesh', 'nellore': 'Andhra Pradesh', 'tirupati': 'Andhra Pradesh',
    'thiruvananthapuram': 'Kerala', 'kochi': 'Kerala', 'kozhikode': 'Kerala', 'thrissur': 'Kerala', 'kollam': 'Kerala',
    'guwahati': 'Assam', 'silchar': 'Assam', 'dibrugarh': 'Assam', 'jorhat': 'Assam',
    'imphal': 'Manipur', 'agartala': 'Tripura', 'aizawl': 'Mizoram', 'kohima': 'Nagaland', 'shillong': 'Meghalaya', 'itanagar': 'Arunachal Pradesh',
    'gangtok': 'Sikkim', 'port blair': 'Andaman and Nicobar Islands', 'panaji': 'Goa', 'margao': 'Goa',
    'shimla': 'Himachal Pradesh', 'dharamshala': 'Himachal Pradesh', 'manali': 'Himachal Pradesh',
    'jammu': 'Jammu and Kashmir', 'srinagar': 'Jammu and Kashmir', 'leh': 'Ladakh',
    'dehradun': 'Uttarakhand', 'haridwar': 'Uttarakhand', 'rishikesh': 'Uttarakhand', 'nainital': 'Uttarakhand',
    'raipur': 'Chhattisgarh', 'bilaspur': 'Chhattisgarh', 'durg': 'Chhattisgarh', 'bhilai': 'Chhattisgarh',
    'puducherry': 'Puducherry', 'pondicherry': 'Puducherry', 'karaikal': 'Puducherry',
    'daman': 'Dadra and Nagar Haveli and Daman and Diu', 'diu': 'Dadra and Nagar Haveli and Daman and Diu',
    'silvassa': 'Dadra and Nagar Haveli and Daman and Diu',

    // Additional cities
    'navi mumbai': 'Maharashtra', 'kalyan': 'Maharashtra', 'vasai': 'Maharashtra', 'solapur': 'Maharashtra', 'amravati': 'Maharashtra',
    'sangli': 'Maharashtra', 'malegaon': 'Maharashtra', 'kolhapur': 'Maharashtra', 'nanded': 'Maharashtra', 'pimpri-chinchwad': 'Maharashtra',
    'mulund': 'Maharashtra', 'mulund east': 'Maharashtra', 'mulund (east)': 'Maharashtra',
    'magarpatta city': 'Maharashtra', 'magarpatta': 'Maharashtra', 'junnar': 'Maharashtra', 'dehuroad': 'Maharashtra',
    'hinjawadi': 'Maharashtra', 'yewalewadi': 'Maharashtra', 'wagholi': 'Maharashtra',
    'secunderabad': 'Telangana', 'khammam': 'Telangana', 'ramagundam': 'Telangana', 'patancheru': 'Telangana',
    'saidapet': 'Tamil Nadu', 'vellore': 'Tamil Nadu', 'erode': 'Tamil Nadu', 'thanjavur': 'Tamil Nadu', 'dindigul': 'Tamil Nadu', 'tirunelveli': 'Tamil Nadu',
    'darbhanga': 'Bihar', 'arrah': 'Bihar', 'begusarai': 'Bihar', 'katihar': 'Bihar', 'munger': 'Bihar', 'chapra': 'Bihar',
    'mathura': 'Uttar Pradesh', 'rampur': 'Uttar Pradesh', 'shahjahanpur': 'Uttar Pradesh', 'farrukhabad': 'Uttar Pradesh',
    'firozabad': 'Uttar Pradesh', 'jhansi': 'Uttar Pradesh', 'muzaffarnagar': 'Uttar Pradesh', 'saharanpur': 'Uttar Pradesh',
    'gorakhpur': 'Uttar Pradesh', 'azamgarh': 'Uttar Pradesh', 'jaunpur': 'Uttar Pradesh', 'rae bareli': 'Uttar Pradesh',
    'sitapur': 'Uttar Pradesh', 'etawah': 'Uttar Pradesh', 'orai': 'Uttar Pradesh', 'sambhal': 'Uttar Pradesh',
    'hisar': 'Haryana', 'karnal': 'Haryana', 'sonipat': 'Haryana', 'panchkula': 'Haryana',
    'sagar': 'Madhya Pradesh', 'satna': 'Madhya Pradesh', 'dewas': 'Madhya Pradesh', 'korba': 'Madhya Pradesh',
    'ratlam': 'Madhya Pradesh', 'rewa': 'Madhya Pradesh', 'katni': 'Madhya Pradesh', 'singrauli': 'Madhya Pradesh',
    'belgavi': 'Karnataka', 'gulbarga': 'Karnataka', 'kalaburagi': 'Karnataka', 'davangere': 'Karnataka', 'bellary': 'Karnataka',
    'bijapur': 'Karnataka', 'shimoga': 'Karnataka', 'tumkur': 'Karnataka', 'raichur': 'Karnataka',
    'anantapur': 'Andhra Pradesh', 'kurnool': 'Andhra Pradesh', 'kadapa': 'Andhra Pradesh', 'rajahmundry': 'Andhra Pradesh',
    'kakinada': 'Andhra Pradesh', 'eluru': 'Andhra Pradesh', 'ongole': 'Andhra Pradesh', 'nandyal': 'Andhra Pradesh',
    'tiruppur': 'Tamil Nadu', 'nagercoil': 'Tamil Nadu', 'tuticorin': 'Tamil Nadu', 'karur': 'Tamil Nadu', 'kumbakonam': 'Tamil Nadu',
    'sikar': 'Rajasthan', 'alwar': 'Rajasthan', 'bharatpur': 'Rajasthan', 'pali': 'Rajasthan', 'sri ganganagar': 'Rajasthan',
    'gandhinagar': 'Gujarat', 'anand': 'Gujarat', 'nadiad': 'Gujarat', 'morbi': 'Gujarat', 'surendranagar': 'Gujarat',
    'gandhidham': 'Gujarat', 'junagadh': 'Gujarat', 'veraval': 'Gujarat', 'porbandar': 'Gujarat',
    'kannur': 'Kerala', 'alappuzha': 'Kerala', 'palakkad': 'Kerala', 'malappuram': 'Kerala', 'kottayam': 'Kerala',
    'sambalpur': 'Odisha', 'berhampur': 'Odisha', 'puri': 'Odisha', 'balasore': 'Odisha',
    'tinsukia': 'Assam', 'nagaon': 'Assam', 'bongaigaon': 'Assam', 'tezpur': 'Assam',
    'bilaspur': 'Himachal Pradesh', 'solan': 'Himachal Pradesh', 'mandi': 'Himachal Pradesh', 'kullu': 'Himachal Pradesh',
    'haldwani': 'Uttarakhand', 'roorkee': 'Uttarakhand', 'rudrapur': 'Uttarakhand', 'kashipur': 'Uttarakhand'
};

function getStateFromCity(city) {
    if (!city) return null;

    const cityLower = city.toLowerCase().trim();

    // Direct lookup
    if (CITY_TO_STATE[cityLower]) {
        return CITY_TO_STATE[cityLower];
    }

    // Check if city name contains any known city
    for (const [knownCity, state] of Object.entries(CITY_TO_STATE)) {
        if (cityLower.includes(knownCity) || knownCity.includes(cityLower)) {
            return state;
        }
    }

    return null;
}

function fixUnknownStates() {
    const dataDir = path.join(__dirname, '../data/pharmacies');

    if (!fs.existsSync(dataDir)) {
        console.error(`❌ Directory not found: ${dataDir}`);
        return;
    }

    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));

    console.log(`📁 Processing ${files.length} JSON file(s)\n`);

    let totalFixed = 0;
    let stillUnknown = [];

    files.forEach(file => {
        const filePath = path.join(dataDir, file);
        console.log(`Processing: ${file}`);

        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            if (!Array.isArray(data)) {
                console.warn(`  ⚠️  Skipping ${file} - not an array`);
                return;
            }

            let fixedInFile = 0;

            const updatedData = data.map(pharmacy => {
                if (pharmacy.state === 'Unknown' && pharmacy.city) {
                    const inferredState = getStateFromCity(pharmacy.city);

                    if (inferredState) {
                        fixedInFile++;
                        totalFixed++;
                        console.log(`  ✓ Fixed: ${pharmacy.city} -> ${inferredState}`);
                        return {
                            ...pharmacy,
                            state: inferredState
                        };
                    } else {
                        stillUnknown.push({
                            file: file,
                            name: pharmacy.name,
                            city: pharmacy.city
                        });
                    }
                }
                return pharmacy;
            });

            if (fixedInFile > 0) {
                // Write back to file
                fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), 'utf8');
                console.log(`  ✅ Fixed ${fixedInFile} records in ${file}\n`);
            } else {
                console.log(`  ℹ️  No records to fix in ${file}\n`);
            }

        } catch (error) {
            console.error(`  ✗ Error processing ${file}:`, error.message);
        }
    });

    console.log('═══════════════════════════════════════');
    console.log(`✅ Total records fixed: ${totalFixed}`);
    console.log('═══════════════════════════════════════');

    if (stillUnknown.length > 0) {
        console.log(`\n⚠️  Still Unknown (${stillUnknown.length} records):`);
        stillUnknown.forEach(item => {
            console.log(`  • ${item.city} (${item.name}) in ${item.file}`);
        });
    }
}

// Run the script
if (require.main === module) {
    fixUnknownStates();
}

module.exports = { fixUnknownStates };
