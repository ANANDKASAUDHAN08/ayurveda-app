const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergencyController');
const authenticateToken = require('../middleware/auth');

// All emergency routes require authentication
router.use(authenticateToken);

// Emergency Contacts Routes
router.get('/contacts', emergencyController.getEmergencyContacts);
router.post('/contacts', emergencyController.addEmergencyContact);
router.put('/contacts/reorder', emergencyController.reorderEmergencyContacts); // Batch reorder
router.put('/contacts/:id', emergencyController.updateEmergencyContact);
router.delete('/contacts/:id', emergencyController.deleteEmergencyContact);

// Medical Information Routes
router.get('/medical-info', emergencyController.getMedicalInfo);
router.put('/medical-info', emergencyController.updateMedicalInfo);
router.delete('/medical-info', emergencyController.deleteMedicalInfo);

// Emergency Call Logging (optional)
router.post('/log-call', emergencyController.logEmergencyCall);
router.get('/call-history', emergencyController.getEmergencyCallHistory);

module.exports = router;
