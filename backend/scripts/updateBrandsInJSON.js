const fs = require('fs');
const path = require('path');

// Brand mapping: patterns to canonical brand names
const BRAND_MAPPING = [
    { patterns: ['apollo pharmacy', 'apollo'], canonical: 'Apollo Pharmacy' },
    { patterns: ['tata 1mg', '1mg'], canonical: 'Tata 1mg' },
    { patterns: ['wellness forever', 'wellness'], canonical: 'Wellness Forever' },
    { patterns: ['medplus'], canonical: 'MedPlus' },
    { patterns: ['pharmeasy'], canonical: 'PharmEasy' },
    { patterns: ['netmeds'], canonical: 'Netmeds' },
    { patterns: ['healthkart'], canonical: 'HealthKart' },
    { patterns: ['guardian pharmacy', 'guardian'], canonical: 'Guardian Pharmacy' },
    { patterns: ['fortis healthworld', 'fortis'], canonical: 'Fortis Healthworld' },
    { patterns: ['max health', 'max'], canonical: 'Max Healthcare' },
    { patterns: ['medlife'], canonical: 'Medlife' },
    { patterns: ['cipla'], canonical: 'Cipla' },
    { patterns: ['dr. reddy', 'dr reddy'], canonical: 'Dr. Reddy\'s' },
    { patterns: ['sun pharma'], canonical: 'Sun Pharma' },
    { patterns: ['zeelab pharmacy', 'zeelab'], canonical: 'Zeelab Pharmacy' },
    { patterns: ['chemist shop'], canonical: 'Chemist Shop' },
    { patterns: ['medical store'], canonical: 'Medical Store' },
    { patterns: ['medicine shop'], canonical: 'Medicine Shop' },
    { patterns: ['medicos'], canonical: 'Medicos' },
    { patterns: ['chemist'], canonical: 'Chemist' },
    { patterns: ['pharmacy'], canonical: 'Pharmacy' }
];

/**
 * Extract brand from pharmacy name
 */
function extractBrandFromName(name) {
    if (!name) return 'Independent';

    const nameLower = name.toLowerCase();

    // Check brand mappings in order (more specific first)
    for (const brandMap of BRAND_MAPPING) {
        for (const pattern of brandMap.patterns) {
            if (nameLower.includes(pattern)) {
                return brandMap.canonical;
            }
        }
    }

    return 'Independent';
}

/**
 * Update brand field in all pharmacy JSON files
 */
function updateBrandsInJSON() {
    const dataDir = path.join(__dirname, '../data/pharmacies');

    if (!fs.existsSync(dataDir)) {
        console.error(`❌ Directory not found: ${dataDir}`);
        return;
    }

    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));

    console.log(`📁 Found ${files.length} JSON file(s) to update\n`);

    let totalProcessed = 0;
    const brandCounts = new Map();

    files.forEach(file => {
        const filePath = path.join(dataDir, file);
        console.log(`Processing: ${file}`);

        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            if (!Array.isArray(data)) {
                console.warn(`  ⚠️  Skipping ${file} - not an array`);
                return;
            }

            const updatedData = data.map(pharmacy => {
                totalProcessed++;

                // Extract brand from name
                const brand = extractBrandFromName(pharmacy.name);

                // Count brands
                brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);

                // Update pharmacy object
                return {
                    ...pharmacy,
                    brand: brand
                };
            });

            // Write back to file with proper formatting
            fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), 'utf8');

            console.log(`  ✓ Updated ${data.length} records\n`);

        } catch (error) {
            console.error(`  ✗ Error processing ${file}:`, error.message);
        }
    });

    // Display brand statistics
    console.log('═══════════════════════════════════════');
    console.log('📊 Brand Distribution in JSON Files:');
    console.log('═══════════════════════════════════════');

    // Filter brands appearing 2+ times (excluding Independent)
    const popularBrands = Array.from(brandCounts.entries())
        .filter(([brand, count]) => count >= 2 && brand !== 'Independent')
        .sort((a, b) => b[1] - a[1]);

    console.log('\nPopular Brands (appearing 2+ times):');
    popularBrands.forEach(([brand, count]) => {
        console.log(`  • ${brand.padEnd(30)} ${count} locations`);
    });

    const independentCount = brandCounts.get('Independent') || 0;
    console.log(`\n  • ${'Independent'.padEnd(30)} ${independentCount} locations`);
    console.log('\n═══════════════════════════════════════');
    console.log(`\nTotal pharmacies processed: ${totalProcessed}`);
    console.log('✅ All JSON files updated successfully!');
}

// Run the script
if (require.main === module) {
    updateBrandsInJSON();
}

module.exports = {
    extractBrandFromName,
    updateBrandsInJSON
};
