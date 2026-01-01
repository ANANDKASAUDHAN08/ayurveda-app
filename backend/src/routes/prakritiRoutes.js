const express = require('express');
const router = express.Router();
const prakritiController = require('../controllers/prakritiController');

// @route   GET /api/prakriti/questions
// @desc    Get structured questions for the Prakriti quiz
router.get('/questions', prakritiController.getQuizQuestions);

// @route   POST /api/prakriti/evaluate
// @desc    Calculate user Dosha based on quiz answers
router.post('/evaluate', prakritiController.evaluatePrakriti);

module.exports = router;
