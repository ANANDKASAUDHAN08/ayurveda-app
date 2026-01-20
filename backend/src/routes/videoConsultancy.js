const express = require('express');
const router = express.Router();
const videoConsultancyController = require('../controllers/videoConsultancyController');
const auth = require('../middleware/auth');

/**
 * Video Consultancy Routes
 * All routes for appointment booking and payment
 */

// Payment - Create Razorpay order
router.post('/payment/create-order', auth, videoConsultancyController.createPaymentOrder);

// Appointments
router.post('/appointments/book', auth, videoConsultancyController.bookAppointment);
router.get('/appointments', auth, videoConsultancyController.getUserAppointments);
router.get('/appointments/:id', auth, videoConsultancyController.getAppointmentById);
router.put('/appointments/:id/cancel', auth, videoConsultancyController.cancelAppointment);

// Reviews
router.post('/reviews', auth, videoConsultancyController.addReview);

// Video Sessions
const videoSessionController = require('../controllers/videoSessionController');
router.get('/video-session/:appointment_id', auth, videoSessionController.getVideoSession);
router.post('/video-session/:appointment_id/start', auth, videoSessionController.startVideoCall);
router.post('/video-session/:appointment_id/end', auth, videoSessionController.endVideoCall);
router.get('/video-session/:appointment_id/status', auth, videoSessionController.getSessionStatus);
router.get('/video-sessions/active', auth, videoSessionController.getActiveSessions);
router.post('/video-session/:appointment_id/recording', auth, videoSessionController.saveRecording);

module.exports = router;
