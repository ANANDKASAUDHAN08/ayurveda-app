const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const doctorController = require('../controllers/doctorController');
const userController = require('../controllers/userController');
const slotController = require('../controllers/slotController');
const appointmentController = require('../controllers/appointmentController');
const slotControllerNew = require('../controllers/slotControllerNew');
const appointmentControllerNew = require('../controllers/appointmentControllerNew');
const labTestController = require('../controllers/labTestController');
const auth = require('../middleware/auth');

// Auth
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/users/resend-verification', authController.resendVerification);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.get('/auth/verify-reset-token/:token', authController.verifyResetToken);

// Users
router.get('/users/profile', auth, userController.getProfile);
router.put('/users/profile', auth, userController.updateProfile);
router.put('/users/change-password', auth, userController.changePassword);
router.put('/users/enable-2fa', auth, userController.enable2FA);
router.delete('/users/profile', auth, userController.deleteAccount);

// Doctors
router.post('/doctors/register', doctorController.registerDoctor);
router.post('/doctors/resend-verification', doctorController.resendVerification);
router.post('/doctors/forgot-password', doctorController.forgotPassword);
router.post('/doctors/reset-password', doctorController.resetPassword);
router.get('/doctors/verify-reset-token/:token', doctorController.verifyResetToken);
router.put('/doctors/profile', auth, doctorController.updateDoctorProfile);
router.put('/doctors/change-password', auth, doctorController.changePassword);
router.put('/doctors/enable-2fa', auth, doctorController.enable2FA);
router.delete('/doctors/profile', auth, doctorController.deleteAccount);
router.get('/doctors', doctorController.getDoctors);
router.get('/doctors/:id', doctorController.getDoctorById);

// Legacy Slots (keep for backward compatibility)
router.get('/slots', slotController.getSlots);
router.post('/slots/lock', auth, slotController.lockSlot);

// New Appointment Slots Management
router.get('/doctors/:doctorId/slots', slotControllerNew.getAvailableSlots);
router.get('/doctors/:doctorId/slots/range', slotControllerNew.getSlotsByDateRange);
router.get('/doctors/:doctorId/availability', slotControllerNew.getDoctorAvailability);
router.post('/doctors/availability', auth, slotControllerNew.setAvailability);

// Date-Specific Exceptions
router.post('/doctors/availability/exceptions', auth, slotControllerNew.setDateExceptions);
router.get('/doctors/my-availability/exceptions', auth, slotControllerNew.getMyDateExceptions); // Authenticated endpoint
router.get('/doctors/:doctorId/availability/exceptions', slotControllerNew.getDateExceptions); // Public endpoint for patients
router.delete('/doctors/availability/exceptions/:date', auth, slotControllerNew.deleteDateException);

// Legacy Appointments (keep for backward compatibility)
router.post('/appointments', auth, appointmentController.bookAppointment);
router.get('/appointments', auth, appointmentController.getMyAppointments);
router.post('/appointments/:id/cancel', auth, appointmentController.cancelAppointment);

// Appointment Stats and Activity Feed
router.get('/appointments/stats', auth, appointmentController.getStats);
router.get('/appointments/activity-feed', auth, appointmentController.getActivityFeed);

// New Enhanced Appointments
router.post('/appointments/book', auth, appointmentControllerNew.bookAppointment);
router.get('/appointments/user', auth, appointmentControllerNew.getUserAppointments);
router.get('/appointments/doctor', auth, appointmentControllerNew.getDoctorAppointments);
router.put('/appointments/:id/cancel', auth, appointmentControllerNew.cancelAppointment);

// Lab Tests
router.get('/lab-tests', labTestController.getLabTests);
router.get('/lab-tests/categories', labTestController.getCategories);

// Nearby Services
const nearbyController = require('../controllers/nearbyController');
router.get('/nearby/hospitals', nearbyController.getNearbyHospitals);
router.get('/nearby/pharmacies', nearbyController.getNearbyPharmacies);
router.get('/nearby/doctors', nearbyController.getNearbyDoctors);

module.exports = router;
