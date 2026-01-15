const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const auth = require('../middleware/auth');

// All calendar routes require authentication
router.use(auth);

router.get('/events', calendarController.getEvents);
router.get('/heatmap', calendarController.getSymptomHeatmap);
router.post('/events', calendarController.createEvent);
router.put('/events/:id', calendarController.updateEvent);
router.delete('/events/:id', calendarController.deleteEvent);

// Specialized logging endpoint
router.post('/log-activity', calendarController.logActivity);

module.exports = router;
