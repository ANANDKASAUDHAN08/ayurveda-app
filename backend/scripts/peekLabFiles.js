const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

// Some versions might require this if it's not a direct function
const parsePDF = typeof pdf === 'function' ? pdf : pdf.default;

const DATA_DIR = path.join(__dirname, '../data/labs');

async function peekXLSX() {
    console.log('--- Peeking into DrLalPathLabs.xlsx ---');
    const workbook = XLSX.readFile(path.join(DATA_DIR, 'DrLalPathLabs.xlsx'));
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log('Headers:', data[0]);
    console.log('First 2 rows:', data.slice(1, 3));
}

async function peekPDF(filename) {
    console.log(`\n--- Peeking into ${filename} ---`);
    if (!fs.existsSync(path.join(DATA_DIR, filename))) {
        console.log(`File ${filename} not found.`);
        return;
    }
    const dataBuffer = fs.readFileSync(path.join(DATA_DIR, filename));
    const data = await parsePDF(dataBuffer);
    console.log('Page Count:', data.numpages);
    console.log('Content Snippet (first 1000 chars):');
    console.log(data.text.substring(0, 1000).replace(/\n/g, ' '));
}

async function run() {
    try {
        await peekXLSX();
        await peekPDF('INSA-LabsList-042024.pdf');
        await peekPDF('list-of-centers-dr-lal-path-labs-pan-india.pdf');
    } catch (err) {
        console.error('Run Error:', err);
    }
}

run();
