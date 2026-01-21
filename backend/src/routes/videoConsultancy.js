const express = require('express');
const router = express.Router();
const videoConsultancyController = require('../controllers/videoConsultancyController');
const auth = require('../middleware/auth');

// Payment - Create Razorpay order
router.post('/payment/create-order', auth, videoConsultancyController.createPaymentOrder);

// Appointments
router.post('/appointments/book', auth, videoConsultancyController.bookAppointment);
router.get('/appointments', auth, videoConsultancyController.getUserAppointments);
router.get('/appointments/:id', auth, videoConsultancyController.getAppointmentById);
router.put('/appointments/:id/cancel', auth, videoConsultancyController.cancelAppointment);

// Reviews
router.post('/reviews', auth, videoConsultancyController.addReview);

module.exports = router;
