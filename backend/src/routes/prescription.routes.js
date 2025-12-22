const express = require('express');
const router = express.Router();
const PrescriptionController = require('../controllers/prescription.controller');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/prescriptions/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'prescription-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only images (JPEG, PNG) and PDF files are allowed'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter
});

// Initialize tables on server start
// PrescriptionController.initializeTables();

// Prescription Routes
router.get('/prescriptions', authMiddleware, PrescriptionController.getAllPrescriptions);
router.get('/prescriptions/:id', authMiddleware, PrescriptionController.getPrescriptionById);
router.post('/prescriptions/upload', authMiddleware, upload.single('prescription_file'), PrescriptionController.uploadPrescription);
router.post('/prescriptions/digital', authMiddleware, PrescriptionController.createDigitalPrescription);
router.put('/prescriptions/:id', authMiddleware, PrescriptionController.updatePrescription);
router.delete('/prescriptions/:id', authMiddleware, PrescriptionController.deletePrescription);

// Refill Routes
router.post('/prescriptions/:id/refills', authMiddleware, PrescriptionController.requestRefill);
router.get('/prescriptions/:id/refills', authMiddleware, PrescriptionController.getRefillHistory);

// PDF Routes
router.post('/prescriptions/:id/generate-pdf', authMiddleware, PrescriptionController.generatePDF);
router.get('/prescriptions/:id/download-pdf', authMiddleware, PrescriptionController.downloadPDF);
router.get('/prescriptions/:id/download-history', authMiddleware, PrescriptionController.getDownloadHistory);

// QR Code Routes
router.post('/prescriptions/:id/qrcode', authMiddleware, PrescriptionController.generateQRCode);

// Prescription Ordering Routes
const PrescriptionOrderController = require('../controllers/prescription-order.controller');
router.get('/prescriptions/:id/medicines-for-order', authMiddleware, PrescriptionOrderController.getMedicinesForOrder);
router.post('/prescriptions/:id/add-to-cart', authMiddleware, PrescriptionOrderController.addPrescriptionToCart);

module.exports = router;

