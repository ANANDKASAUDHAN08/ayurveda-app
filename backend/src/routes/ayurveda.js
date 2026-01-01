const express = require('express');
const router = express.Router();
const ayurvedaController = require('../controllers/ayurvedaController');

// Medicines Routes
router.get('/medicines', ayurvedaController.getMedicines);
router.get('/medicines/:id', ayurvedaController.getMedicineById);

// Exercises Routes (Yoga/Pranayama/Meditation)
router.get('/exercises', ayurvedaController.getExercises);
router.get('/exercises/:id', ayurvedaController.getExerciseById);

// Articles Routes
router.get('/articles', ayurvedaController.getArticles);
router.get('/articles/:id', ayurvedaController.getArticleById);

// Rituals Routes
router.get('/rituals', ayurvedaController.getRituals);

// Herbs Routes
router.get('/herbs', ayurvedaController.getHerbs);

// Yoga Poses Routes
router.get('/yoga-poses', ayurvedaController.getYogaPoses);

// Dashboard Stats
router.get('/stats', ayurvedaController.getDashboardStats);

// Knowledge Base Search
router.get('/knowledge', ayurvedaController.searchKnowledge);

module.exports = router;
