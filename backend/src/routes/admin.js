const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

// Admin authentication middleware - checks if user is admin
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }
};

// Apply auth and admin check to all admin routes
router.use(auth);
router.use(requireAdmin);

// ==================== FEATURED DOCTORS ====================
router.get('/featured-doctors', adminController.getFeaturedDoctors);
router.post('/featured-doctors', adminController.addFeaturedDoctor);
router.put('/featured-doctors/:id', adminController.updateFeaturedDoctor);
router.delete('/featured-doctors/:id', adminController.deleteFeaturedDoctor);

// ==================== HEALTH ARTICLES ====================
router.get('/articles', adminController.getHealthArticles);
router.post('/articles', adminController.addHealthArticle);
router.put('/articles/:id', adminController.updateHealthArticle);
router.delete('/articles/:id', adminController.deleteHealthArticle);

// ==================== HOSPITALS ====================
router.get('/hospitals', adminController.getHospitals);
router.post('/hospitals', adminController.addHospital);
router.put('/hospitals/:id', adminController.updateHospital);
router.delete('/hospitals/:id', adminController.deleteHospital);

// ==================== PHARMACIES ====================
router.get('/pharmacies', adminController.getPharmacies);
router.post('/pharmacies', adminController.addPharmacy);
router.put('/pharmacies/:id', adminController.updatePharmacy);
router.delete('/pharmacies/:id', adminController.deletePharmacy);

// ==================== DOCTORS MANAGEMENT ====================
router.post('/doctors', adminController.addDoctor);
router.put('/doctors/:id', adminController.updateDoctor);
router.delete('/doctors/:id', adminController.deleteDoctor);

// ==================== STATIC PAGES ====================
router.get('/static-pages', adminController.getStaticPages);
router.put('/static-pages/:id', adminController.updateStaticPage);

module.exports = router;
