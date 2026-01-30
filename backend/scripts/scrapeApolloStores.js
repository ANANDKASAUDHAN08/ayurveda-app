const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

/**
 * APOLLO PHARMACY STORE SCRAPER
 * 
 * This script crawls the Apollo Pharmacy sitemaps to extract all 6,000+ store details.
 * It handles pagination, rate limiting (with delays), and extracts:
 * - Name, Address, City
 * - Phone, Latitude, Longitude, Opening Hours
 */

const BASE_URL = 'https://www.apollopharmacy.in';
const SITEMAP_URL = `${BASE_URL}/static/store-details-sitemap`;
const OUTPUT_FILE = path.join(__dirname, '../data/pharmacies/apollo-stores-full.json');

// User-Agent to avoid simple blocks
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeStore(url) {
    try {
        const { data } = await axios.get(url, { headers: HEADERS });
        const $ = cheerio.load(data);

        // Name
        const nameText = $('h1[class*="StoreInfoCard_sdtitle"]').text().trim();

        // Address
        const address = $('span[class*="StoreInfoCard_addressTextInner"]').text().trim();

        // Coordinates from Maps Link
        const mapsLink = $('a[class*="StoreInfoCard_btnTxt"]').attr('href');
        let latitude = null, longitude = null;
        if (mapsLink) {
            try {
                const urlParams = new URL(mapsLink).searchParams;
                const destination = urlParams.get('destination');
                if (destination) {
                    const [lat, lng] = destination.split(',');
                    latitude = parseFloat(lat);
                    longitude = parseFloat(lng);
                }
            } catch (e) { }
        }

        // Hours & Phone
        const hours = $('span[class*="StoreInfoCard_storeInfoCardContentItemAddressHoursItemText"]').first().text().trim();
        const phone = $('span[class*="StoreInfoCard_storeInfoCardContentItemAddressHoursItemPhoneTextInner"]').text().trim();

        // City (usually the last word in the title)
        let city = 'N/A';
        if (nameText.includes(' ')) {
            const parts = nameText.split(' ');
            city = parts[parts.length - 1];
        }

        return { url, name: nameText, address, city, phone, latitude, longitude, opening_hours: hours };
    } catch (error) {
        process.stdout.write(`\r❌ Error scraping ${url.substring(0, 50)}...: ${error.message}\n`);
        return null;
    }
}

async function getUrlsFromSitemap(page) {
    try {
        const { data } = await axios.get(`${SITEMAP_URL}?page=${page}`, { headers: HEADERS });
        const $ = cheerio.load(data);
        const urls = [];
        $('a[href*="/medical-stores/"]').each((i, el) => {
            const href = $(el).attr('href');
            if (href) urls.push(href.startsWith('http') ? href : `${BASE_URL}${href}`);
        });
        return urls;
    } catch (error) {
        console.error(`\n❌ Sitemap Page ${page} Error:`, error.message);
        return [];
    }
}

async function main() {
    console.log('🚀 Starting Full Apollo Pharmacy Store Scrape...');
    let allStores = [];

    // Load existing data if any
    if (fs.existsSync(OUTPUT_FILE)) {
        allStores = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
        console.log(`📂 Loaded ${allStores.length} existing stores.`);
    }

    const startPage = 1;
    const endPage = 20; // Adjust based on discovery; earlier we saw ID 17621 on some page.

    for (let p = startPage; p <= endPage; p++) {
        console.log(`\n📄 Processing Sitemap Page ${p}...`);
        const urls = await getUrlsFromSitemap(p);

        if (urls.length === 0) {
            console.log('🏁 No more URLs found or error occurred.');
            break;
        }

        for (let i = 0; i < urls.length; i++) {
            // Check if already scraped
            if (allStores.some(s => s.url === urls[i])) continue;

            const storeData = await scrapeStore(urls[i]);
            if (storeData) {
                allStores.push(storeData);
                // Save incrementally every 10 stores
                if (allStores.length % 10 === 0) {
                    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allStores, null, 2));
                }
            }

            process.stdout.write(`\r🏠 Stores Scraped: ${allStores.length} | Progress: ${Math.round(((i + 1) / urls.length) * 100)}% `);
            await delay(500); // Respectful delay
        }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allStores, null, 2));
    console.log(`\n\n✨ SCROLL FINISHED! Total Stores: ${allStores.length}`);
    console.log(`📄 Data saved to ${OUTPUT_FILE}`);
}

main();
