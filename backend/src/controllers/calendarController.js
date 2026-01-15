const CalendarEvent = require('../models/CalendarEvent');
const { Op } = require('sequelize');
const sequelize = require('../config/sequelize');
const weatherService = require('../services/weatherService');

exports.getEvents = async (req, res) => {
    try {
        const { start, end, lat, lon } = req.query;
        const userId = req.user.id;

        const where = { userId };
        if (start && end) {
            where.start_time = {
                [Op.between]: [new Date(start), new Date(end)],
            };
        }

        const events = await CalendarEvent.findAll({
            where,
            order: [['start_time', 'ASC']],
        });

        // Add weather-based system suggestions and current weather if lat/lon provided
        let suggestions = [];
        let currentWeather = null;
        if (lat && lon) {
            const [ayuTips, alloTips, rawWeather] = await Promise.all([
                weatherService.getWeatherSuggestions(lat, lon, 'ayurveda'),
                weatherService.getWeatherSuggestions(lat, lon, 'allopathy'),
                weatherService.getRawWeatherData(lat, lon)
            ]);

            suggestions = [...ayuTips, ...alloTips].map(tip => ({
                ...tip,
                id: `system-${Math.random().toString(36).substr(2, 9)}`,
                userId: userId,
                start_time: new Date(),
                is_system_generated: true
            }));

            if (rawWeather) {
                currentWeather = {
                    temp: rawWeather.main.temp,
                    humidity: rawWeather.main.humidity,
                    condition: rawWeather.weather[0].main,
                    icon: rawWeather.weather[0].icon
                };
            }
        }

        res.json({ success: true, data: [...events, ...suggestions], weather: currentWeather });
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch events' });
    }
};

exports.getSymptomHeatmap = async (req, res) => {
    try {
        const { start, end } = req.query;
        const userId = req.user.id;

        const where = {
            userId,
            type: 'vital' // Assuming symptoms are logged as 'vital'
        };

        if (start && end) {
            where.start_time = {
                [Op.between]: [new Date(start), new Date(end)],
            };
        }

        const events = await CalendarEvent.findAll({
            where,
            attributes: [
                [sequelize.fn('DATE', sequelize.col('start_time')), 'date'],
                [sequelize.fn('MAX', sequelize.col('intensity')), 'maxIntensity'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: [sequelize.fn('DATE', sequelize.col('start_time'))],
            order: [[sequelize.fn('DATE', sequelize.col('start_time')), 'ASC']]
        });

        res.json({ success: true, data: events });
    } catch (error) {
        console.error('Error fetching symptom heatmap:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch heatmap' });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const userId = req.user.id;
        const eventData = { ...req.body, userId };

        const event = await CalendarEvent.create(eventData);
        res.status(201).json({ success: true, data: event });
    } catch (error) {
        console.error('Error creating calendar event:', error);
        res.status(500).json({ success: false, message: 'Failed to create event' });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const event = await CalendarEvent.findOne({ where: { id, userId } });
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        await event.update(req.body);
        res.json({ success: true, data: event });
    } catch (error) {
        console.error('Error updating calendar event:', error);
        res.status(500).json({ success: false, message: 'Failed to update event' });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const event = await CalendarEvent.findOne({ where: { id, userId } });
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        await event.destroy();
        res.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting calendar event:', error);
        res.status(500).json({ success: false, message: 'Failed to delete event' });
    }
};

exports.logActivity = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, sub_type, category, value, unit, title, description, metadata, intensity, medication_info } = req.body;

        const event = await CalendarEvent.create({
            userId,
            title: title || `Logged ${type}`,
            description,
            start_time: new Date(),
            type,
            sub_type,
            category,
            status: 'completed',
            value,
            unit,
            intensity,
            medication_info,
            metadata
        });

        res.status(201).json({ success: true, data: event });
    } catch (error) {
        console.error('Error logging activity:', error);
        res.status(500).json({ success: false, message: 'Failed to log activity' });
    }
};
