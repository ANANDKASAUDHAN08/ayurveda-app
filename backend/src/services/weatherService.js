const axios = require('axios');

// For production, this should be in .env
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

exports.getRawWeatherData = async (lat, lon) => {
    try {
        if (!WEATHER_API_KEY) return null;

        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`);
        return response.data;
    } catch (error) {
        console.error('Weather Fetch Error:', error);
        return null;
    }
};

exports.getWeatherSuggestions = async (lat, lon, subType = 'ayurveda') => {
    try {
        if (!WEATHER_API_KEY) {
            console.warn('Weather API Key missing. Returning default wellness tips.');
            return getDefaultTips(subType);
        }

        const weatherData = await exports.getRawWeatherData(lat, lon);
        if (!weatherData) return getDefaultTips(subType);

        const { main, weather } = weatherData;
        const temp = main.temp;
        const humidity = main.humidity;

        const suggestions = [];

        if (subType === 'ayurveda') {
            // Pitta Spike (Heat)
            if (temp > 30) {
                suggestions.push({
                    title: 'Pitta-Spike Alert',
                    description: 'High heat detected! Avoid intense exercise. Try cooling foods like cucumber or coconut water.',
                    type: 'weather_alert',
                    sub_type: 'ayurveda',
                    category: 'ritual',
                    metadata: { temp, humidity, icon: 'fire' }
                });
            }
            // Kapha Spike (Dampness)
            if (humidity > 70) {
                suggestions.push({
                    title: 'Kapha-Dampness Alert',
                    description: 'Damp weather detected. Favor warm, spicy foods today to keep your Agni strong.',
                    type: 'weather_alert',
                    sub_type: 'ayurveda',
                    category: 'ritual',
                    metadata: { temp, humidity, icon: 'cloud-showers-heavy' }
                });
            }
        } else {
            // Allopathy/General
            if (temp > 35) {
                suggestions.push({
                    title: 'Heatstroke Warning',
                    description: 'Excessive heat. Stay hydrated (2-3L water) and avoid direct sun peak hours.',
                    type: 'weather_alert',
                    sub_type: 'allopathy',
                    category: 'vitals',
                    metadata: { temp, humidity, icon: 'exclamation-triangle' }
                });
            }
            if (weather[0].main === 'Rain') {
                suggestions.push({
                    title: 'Flu Season Shift',
                    description: 'Rainy weather increase risk of respiratory issues. Keep warm and maintain Vitamin C intake.',
                    type: 'weather_alert',
                    sub_type: 'allopathy',
                    category: 'medication',
                    metadata: { temp, humidity, icon: 'umbrella' }
                });
            }
        }

        return suggestions;
    } catch (error) {
        console.error('Weather Suggestion Error:', error);
        return getDefaultTips(subType);
    }
};

function getDefaultTips(subType) {
    if (subType === 'ayurveda') {
        return [{
            title: 'Equilibrium Check',
            description: 'Balance your Doshas today with mindful breathing.',
            type: 'ritual',
            sub_type: 'ayurveda',
            category: 'ritual'
        }];
    }
    return [{
        title: 'Daily Vitality',
        description: 'Ensure you take your prescribed vitamins on time.',
        type: 'medication',
        sub_type: 'allopathy',
        category: 'medication'
    }];
}
