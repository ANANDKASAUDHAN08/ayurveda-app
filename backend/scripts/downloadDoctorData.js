const { chromium } = require('playwright');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.edhacare.com/doctors';
const DATA_DIR = path.join(__dirname, '../data');
const OUTPUT_FILE = path.join(DATA_DIR, 'doctors.json');

// Global browser instance
let browser;
let context;

/**
 * Initialize headless browser
 */
async function initBrowser() {
    if (!browser) {
        browser = await chromium.launch({ headless: true });
        context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        });
    }
}

/**
 * Close browser
 */
async function closeBrowser() {
    if (browser) {
        await browser.close();
        browser = null;
    }
}

/**
 * Fetch HTML using a real browser to bypass bot detection
 */
async function fetchHtmlWithBrowser(url) {
    await initBrowser();
    const page = await context.newPage();
    try {
        console.log(`   🌐 Opening browser for: ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        // Wait a bit for any dynamic content
        await delay(2000);
        return await page.content();
    } finally {
        await page.close();
    }
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Delay helper to be polite to the server
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Load existing data to support resuming
 */
function loadExistingData() {
    if (fs.existsSync(OUTPUT_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
        } catch (e) {
            console.error('Error loading existing data:', e.message);
            return [];
        }
    }
    return [];
}

/**
 * Save data to file
 */
function saveData(data) {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
}

const SCRIPTS_DIR = path.join(__dirname);
const PROFILES_DIR = path.join(__dirname, 'profiles');

// Ensure profiles directory exists
if (!fs.existsSync(PROFILES_DIR)) {
    fs.mkdirSync(PROFILES_DIR, { recursive: true });
}

/**
 * Helper to parse profile HTML content
 */
async function parseProfileHtml(html) {
    const $ = cheerio.load(html);
    const details = {
        biography: '',
        education: [],
        specialInterest: '',
        registrations: [],
        treatments: []
    };

    // Biography - Find the h2 containing "Biography", go to its row, and get p tags in the next row
    const bioHeading = $('h2:contains("Biography")');
    if (bioHeading.length > 0) {
        bioHeading.closest('.row').next('.row').find('p').each((i, el) => {
            details.biography += $(el).text().trim() + ' ';
        });
    }
    details.biography = details.biography.trim().replace(/\s+/g, ' ');

    // Education
    $(':contains("Education")').filter('h2, h3').first().next('ul').find('li').each((i, el) => {
        details.education.push($(el).text().trim().replace(/\s+/g, ' '));
    });

    // Special Interest
    const siHeading = $('h2:contains("Special Interest"), h3:contains("Special Interest")');
    details.specialInterest = siHeading.next('p').text().trim().replace(/\s+/g, ' ');

    // Registrations
    $(':contains("Registrations")').filter('h2, h3').first().next('ul').find('li').each((i, el) => {
        details.registrations.push($(el).text().trim().replace(/\s+/g, ' '));
    });

    // Treatments - Support both simple links and list items
    const treatmentHeading = $('h3:contains("List of Treatments"), h4:contains("List of Treatments")');
    treatmentHeading.parent().find('a').each((i, el) => {
        const text = $(el).text().trim().replace(/\s+/g, ' ');
        if (text && !details.treatments.includes(text)) {
            details.treatments.push(text);
        }
    });

    return details;
}

/**
 * Scrape individual doctor profile
 */
async function scrapeDoctorProfile(profileUrl) {
    if (!profileUrl) return null;

    // Ensure absolute URL
    const fullUrl = profileUrl.startsWith('http') ? profileUrl : `https://www.edhacare.com${profileUrl.startsWith('/') ? '' : '/'}${profileUrl}`;
    const slug = fullUrl.split('/').pop();
    const localFile = path.join(PROFILES_DIR, `${slug}.html`);

    console.log(`   🔍 Scraping profile: ${fullUrl}`);

    try {
        let html;
        if (fs.existsSync(localFile)) {
            console.log(`      📂 Loading manual profile HTML from: ${localFile}`);
            html = fs.readFileSync(localFile, 'utf-8');
        } else {
            html = await fetchHtmlWithBrowser(fullUrl);
        }

        return await parseProfileHtml(html);
    } catch (error) {
        console.error(`   ❌ Failed to scrape profile ${fullUrl}: ${error.message}`);
        return null;
    }
}

/**
 * Main Scraper
 */
async function run() {
    const args = process.argv.slice(2);
    const limitPages = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : null;
    const extractProfileFile = args.includes('--extract-profile') ? args[args.indexOf('--extract-profile') + 1] : null;
    const extractUrl = args.includes('--url') ? args[args.indexOf('--url') + 1] : null;
    const urlsFile = args.includes('--file') ? args[args.indexOf('--file') + 1] : null;

    try {
        if (extractProfileFile || extractUrl || urlsFile) {
            console.log(`🔍 Manual/Bulk Extraction Mode: ${extractProfileFile || extractUrl || urlsFile}`);

            let tasks = [];
            if (urlsFile) {
                if (!fs.existsSync(urlsFile)) {
                    console.error(`❌ List file not found: ${urlsFile}`);
                    return;
                }
                const lines = fs.readFileSync(urlsFile, 'utf-8').split('\n')
                    .map(u => u.trim())
                    .filter(u => u.length > 0);
                tasks = lines.map(u => ({ type: u.startsWith('http') ? 'url' : 'file', value: u }));
                console.log(`🔍 Bulk Mode: Found ${tasks.length} items in ${urlsFile}`);
            } else if (extractUrl) {
                tasks = [{ type: 'url', value: extractUrl }];
            } else {
                tasks = [{ type: 'file', value: extractProfileFile }];
            }

            for (const task of tasks) {
                try {
                    let html, profileUrl;
                    if (task.type === 'url') {
                        console.log(`\n📄 Processing URL: ${task.value}`);
                        html = await fetchHtmlWithBrowser(task.value);
                        profileUrl = task.value;
                    } else {
                        console.log(`\n📁 Processing File: ${task.value}`);
                        let targetPath = task.value;
                        if (!fs.existsSync(targetPath)) {
                            const fallback = path.join(PROFILES_DIR, task.value);
                            if (fs.existsSync(fallback)) targetPath = fallback;
                        }
                        if (!fs.existsSync(targetPath)) {
                            console.error(`❌ File not found: ${task.value}`);
                            continue;
                        }
                        html = fs.readFileSync(targetPath, 'utf-8');
                        const $temp = cheerio.load(html);
                        profileUrl = $temp('link[rel="canonical"]').attr('href') || `manual://${path.basename(targetPath)}`;
                    }

                    const $ = cheerio.load(html);
                    const name = $('.breadcrumb-item.active').last().text().trim() || $('h1').first().text().trim();
                    console.log(`   👤 Doctor: ${name}`);

                    const basicInfo = {
                        name,
                        profileUrl,
                        designation: $('.designation').text().trim().replace(/[()]/g, '').replace(/\s+/g, ' '),
                        specialty: $('.dr_assets .list_title:contains("Specialty")').next('p').text().trim().replace(/\s+/g, ' '),
                        hospital: $('.dr_assets .list_title:contains("Hospital")').next('p').text().trim().replace(/\s+/g, ' '),
                        experience: $('.dr_assets .list_title:contains("Experience")').next('p').text().trim().replace(/\s+/g, ' '),
                        location: $('.dr_assets .list_title:contains("Location")').next('p').text().trim().replace(/\s+/g, ' '),
                    };

                    const details = await parseProfileHtml(html);
                    const fullRecord = { ...basicInfo, ...details };

                    let allDoctors = loadExistingData();
                    const existingIdx = allDoctors.findIndex(d => d.name === name);
                    if (existingIdx > -1) {
                        allDoctors[existingIdx] = fullRecord;
                        console.log(`   🔄 Updated existing record.`);
                    } else {
                        allDoctors.push(fullRecord);
                        console.log(`   ➕ Added new record.`);
                    }

                    saveData(allDoctors);
                    console.log(`   ✅ Saved ${name}`);
                    if (tasks.length > 1) await delay(1500);
                } catch (err) {
                    console.error(`   ❌ Failed task: ${err.message}`);
                }
            }
            return;
        }

        console.log('🚀 Starting EdhaCare Doctor Scraper (Browser Mode)...');
        let allDoctors = loadExistingData();
        console.log(`📦 Loaded ${allDoctors.length} existing records.`);

        const scrapedUrls = new Set(allDoctors.map(d => d.profileUrl));
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            if (limitPages && page > limitPages) break;

            console.log(`\n📄 Processing Page ${page}...`);
            let html;

            // Check manual fallback first
            const manualFile = path.join(__dirname, `page_${page}.html`);
            if (fs.existsSync(manualFile)) {
                console.log(`   📂 Loading manual HTML from: ${manualFile}`);
                html = fs.readFileSync(manualFile, 'utf-8');
            } else {
                const url = `${BASE_URL}?page=${page}`;
                html = await fetchHtmlWithBrowser(url);
            }

            const $ = cheerio.load(html);
            const doctorCards = $('.dr_page_list_wrap');

            if (doctorCards.length === 0) {
                console.log('🏁 No more doctors found or page failed to load.');
                hasMore = false;
                break;
            }

            for (let i = 0; i < doctorCards.length; i++) {
                const card = $(doctorCards[i]);
                const name = card.find('.dr_name h3, .dr_name h2').first().text().trim();
                let profileUrl = card.find('.view_more_btn a, .dr_name a').first().attr('href');

                if (!profileUrl || profileUrl.includes('javascript:void(0)')) continue;

                // Absolute URL
                if (!profileUrl.startsWith('http')) {
                    profileUrl = `https://www.edhacare.com${profileUrl.startsWith('/') ? '' : '/'}${profileUrl}`;
                }

                if (scrapedUrls.has(profileUrl)) {
                    console.log(`   ⏭️ Skipping already scraped: ${name}`);
                    continue;
                }

                // Extract basic info from list view
                const assets = card.find('.dr_assets p');
                const basicInfo = {
                    name,
                    profileUrl,
                    specialty: $(assets[0]).text().trim().replace(/\s+/g, ' '),
                    hospital: $(assets[1]).text().trim().replace(/\s+/g, ' '),
                    experience: $(assets[2]).text().trim().replace(/\s+/g, ' '),
                    location: $(assets[3]).text().trim().replace(/\s+/g, ' '),
                    designation: '',
                };

                // Deep scrape profile
                const profileDetails = await scrapeDoctorProfile(profileUrl);
                if (profileDetails) {
                    const fullRecord = { ...basicInfo, ...profileDetails };
                    allDoctors.push(fullRecord);
                    scrapedUrls.add(profileUrl);
                    saveData(allDoctors);
                    console.log(`   ✅ Saved: ${name}`);
                }

                await delay(1000);
            }

            page++;
        }

        console.log(`\n🎉 Web Scraping Complete! Total doctors: ${allDoctors.length}`);
    } catch (error) {
        console.error(`❌ Global Error: ${error.message}`);
    } finally {
        await closeBrowser();
    }
}

run();
