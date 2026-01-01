const prakritiService = require('../services/prakritiService');

exports.getQuizQuestions = async (req, res) => {
    try {
        const structure = await prakritiService.getQuizStructure();
        res.status(200).json({
            success: true,
            data: structure
        });
    } catch (error) {
        console.error('Error fetching quiz questions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load Prakriti quiz questions'
        });
    }
};

exports.evaluatePrakriti = async (req, res) => {
    try {
        const userAnswers = req.body.answers;
        if (!userAnswers || Object.keys(userAnswers).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No answers provided for evaluation'
            });
        }

        const result = await prakritiService.predictDosha(userAnswers);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error evaluating Prakriti:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to evaluate Prakriti'
        });
    }
};
