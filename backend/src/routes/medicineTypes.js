const express = require('express');
const router = express.Router();
const medicineTypeController = require('../controllers/medicineTypeController');

// Get all medicine types
router.get('/', medicineTypeController.getAllMedicineTypes);

// Get statistics for all medicine types
router.get('/stats', medicineTypeController.getMedicineTypeStats);

// Get single medicine type by ID
router.get('/:id', medicineTypeController.getMedicineTypeById);

// Get doctors by medicine type
router.get('/:id/doctors', medicineTypeController.getDoctorsByMedicineType);

module.exports = router;
