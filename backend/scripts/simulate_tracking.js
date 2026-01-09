const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
const ORDER_ID = process.argv[2]; // Pass order ID as argument

if (!ORDER_ID) {
    console.error('Please provide an Order ID: node simulate_tracking.js <ID>');
    process.exit(1);
}

// Delhi Coordinates
const start = { lat: 28.6139, lng: 77.2090 };
const end = { lat: 28.6239, lng: 77.2239 };

async function simulate() {
    console.log(`🚀 Starting simulation for Order #${ORDER_ID}...`);

    let currentLat = start.lat;
    let currentLng = start.lng;
    const steps = 20;
    const dLat = (end.lat - start.lat) / steps;
    const dLng = (end.lng - start.lng) / steps;

    for (let i = 0; i <= steps; i++) {
        try {
            // We use the internal simulate endpoint
            await axios.post(`${API_URL}/orders/${ORDER_ID}/tracking/simulate`, {
                lat: currentLat,
                lng: currentLng
            });

            console.log(`📍 Step ${i}/${steps}: Driver at [${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}]`);

            currentLat += dLat;
            currentLng += dLng;

            await new Promise(r => setTimeout(r, 2000));
        } catch (e) {
            console.error('Simulation step failed:', e.message);
        }
    }

    console.log('✅ Simulation complete!');
}

simulate();
