const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const auth = require('../middleware/auth');

/**
 * Chatbot Routes
 * All routes require authentication
 */

// Start new chat session
router.post('/start', auth, chatbotController.startSession);

// Send message
router.post('/message', auth, chatbotController.handleMessage);

// Get chat history
router.get('/history', auth, chatbotController.getHistory);

// Session Management Routes
router.get('/sessions', auth, chatbotController.getSessions);
router.post('/sessions/new', auth, chatbotController.createNewSession);
router.get('/sessions/:sessionId/messages', auth, chatbotController.getSessionMessages);
router.patch('/sessions/:sessionId', auth, chatbotController.updateSession);
router.delete('/sessions', auth, chatbotController.clearAllSessions);
router.delete('/sessions/:sessionId', auth, chatbotController.deleteSession);

// End session
router.post('/end', auth, chatbotController.endSession);

module.exports = router;
