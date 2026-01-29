const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data/labs');
const MY_JSON = path.join(DATA_DIR, 'my.json');
const MASTER_JSON = path.join(DATA_DIR, 'private-labs-master.json');

function finalMerge() {
    console.log('--- Final Merge of Laboratory Datasets ---');

    const labs1 = JSON.parse(fs.readFileSync(MY_JSON, 'utf8'));
    const labs2 = JSON.parse(fs.readFileSync(MASTER_JSON, 'utf8'));

    console.log(`Dataset 1 (All Chains): ${labs1.length}`);
    console.log(`Dataset 2 (New Dr Lal): ${labs2.length}`);

    const merged = [...labs1];

    labs2.forEach(newLab => {
        const exists = merged.some(oldLab =>
            oldLab.name.toLowerCase().replace(/\s+/g, '') === newLab.name.toLowerCase().replace(/\s+/g, '') ||
            (oldLab.address.toLowerCase().substring(0, 20) === newLab.address.toLowerCase().substring(0, 20))
        );
        if (!exists) {
            merged.push(newLab);
        }
    });

    fs.writeFileSync(MASTER_JSON, JSON.stringify(merged, null, 2));
    console.log(`✅ Successfully merged! Total laboratories: ${merged.length}`);
}

finalMerge();
