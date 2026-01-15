const db = require('../config/database');
const aiService = require('../services/ai.service');

/**
 * Chatbot Controller
 * Handles AI health assistant conversations
 * Supports freemium model with usage limits
 */

class ChatbotController {
    constructor() {
        this.startSession = this.startSession.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.getHistory = this.getHistory.bind(this);
        this.endSession = this.endSession.bind(this);
        this.getSessions = this.getSessions.bind(this);
        this.createNewSession = this.createNewSession.bind(this);
        this.getSessionMessages = this.getSessionMessages.bind(this);
        this.updateSession = this.updateSession.bind(this);
        this.deleteSession = this.deleteSession.bind(this);
        this.clearAllSessions = this.clearAllSessions.bind(this);
    }

    /**
     * Start a new chat session
     */
    async startSession(req, res) {
        try {
            const userId = req.user.id;

            // Generate unique session ID
            const sessionId = `session_${userId}_${Date.now()}`;

            // Create session in database
            await db.execute(
                `INSERT INTO chat_sessions (user_id, session_id, context) VALUES (?, ?, ?)`,
                [userId, sessionId, JSON.stringify({ started: new Date() })]
            );

            // Get user info for personalized welcome
            const [users] = await db.execute(
                'SELECT subscription_tier, name, chat_messages_today FROM users WHERE id = ?',
                [userId]
            );

            const user = users[0];
            const welcomeMessage = this.getWelcomeMessage(user);

            res.json({
                success: true,
                sessionId,
                welcomeMessage,
                tier: user.subscription_tier,
                remaining: user.subscription_tier === 'free' ? 10 - user.chat_messages_today : 'unlimited'
            });

        } catch (error) {
            console.error('Start session error:', error);
            res.status(500).json({ error: 'Failed to start chat session' });
        }
    }

    /**
     * Handle incoming chat message
     */
    async handleMessage(req, res) {
        try {
            const { sessionId, message } = req.body;
            const userId = req.user.id;

            if (!sessionId || !message) {
                return res.status(400).json({ error: 'Session ID and message are required' });
            }

            // Check daily message limit
            const canChat = await this.checkChatLimit(userId);
            if (!canChat.allowed) {
                return res.json({
                    success: true,
                    response: {
                        type: 'LIMIT_REACHED',
                        message: canChat.message,
                        action: 'UPGRADE_PROMPT',
                        upgradeMessage: 'Get unlimited conversations',
                        price: 4.99
                    },
                    remaining: 0
                });
            }

            // Save user message
            await this.saveMessage(sessionId, 'user', message);

            let response;

            // TRY AI SERVICE FIRST (If enabled)
            if (aiService.isEnabled && !message.startsWith('action:')) {
                // Get user info for context (tier)
                const [users] = await db.execute(
                    'SELECT subscription_tier FROM users WHERE id = ?',
                    [userId]
                );
                const tier = users[0].subscription_tier;

                // Get history for context (last 10 messages)
                const [history] = await db.execute(
                    'SELECT sender, message FROM chat_messages WHERE session_id = ? ORDER BY timestamp DESC LIMIT 10',
                    [sessionId]
                );

                const chat = await aiService.startChat(history.reverse());

                // Define tool handlers for this controller
                const toolHandlers = {
                    search_doctors: async (args) => await this.aiSearchDoctors(args),
                    search_medicines: async (args) => await this.aiSearchMedicines(args),
                    search_ayurveda_terms: async (args) => await this.handleNAMCQuery(args.term),
                    get_website_features: () => this.getWebsiteFeatures()
                };

                response = await aiService.processMessage(chat, message, toolHandlers, { tier });
            } else {
                // FALLBACK TO OLD INTENT DETECTION (Or handled as action)
                const intent = this.detectIntent(message.replace('action:', ''));
                response = await this.processIntent(intent, message.replace('action:', ''), userId, sessionId);
            }

            // Save bot response
            await this.saveMessage(sessionId, 'bot', JSON.stringify(response));

            // Update usage counter
            await this.incrementChatUsage(userId);

            // Get remaining messages
            const [users] = await db.execute(
                'SELECT chat_messages_today, subscription_tier FROM users WHERE id = ?',
                [userId]
            );

            const remaining = users[0].subscription_tier === 'free'
                ? 10 - users[0].chat_messages_today
                : 'unlimited';

            res.json({
                success: true,
                response,
                remaining
            });

        } catch (error) {
            console.error('Handle message error:', error);
            res.status(500).json({ error: 'Failed to process message' });
        }
    }

    /**
     * Check if user can send more messages today
     */
    async checkChatLimit(userId) {
        const [users] = await db.execute(
            'SELECT subscription_tier, chat_messages_today, last_reset_date FROM users WHERE id = ?',
            [userId]
        );

        const user = users[0];

        // Reset counter if new day
        const today = new Date().toISOString().split('T')[0];
        if (user.last_reset_date !== today) {
            await db.execute(
                'UPDATE users SET chat_messages_today = 0, last_reset_date = ? WHERE id = ?',
                [today, userId]
            );
            user.chat_messages_today = 0;
        }

        // Check limits for free users
        if (user.subscription_tier === 'free' && user.chat_messages_today >= 10) {
            return {
                allowed: false,
                message: "You've reached your daily limit of 10 messages! 😊\n\nUpgrade to Premium for unlimited conversations at just $4.99/month.",
                remaining: 0
            };
        }

        return {
            allowed: true,
            remaining: user.subscription_tier === 'free' ? 10 - user.chat_messages_today : 'unlimited'
        };
    }

    /**
     * Detect user intent from message
     */
    detectIntent(message) {
        const lower = message.toLowerCase();

        // Check symptoms patterns
        if (lower.match(/symptom|pain|ache|feel|sick|ill|hurt|disease|diagnosis|headache|fever|cough/)) {
            return 'CHECK_SYMPTOMS';
        }

        // Booking patterns
        if (lower.match(/book|appointment|doctor|consult|visit|schedule/)) {
            return 'BOOK_APPOINTMENT';
        }

        // Emergency patterns
        if (lower.match(/emergency|urgent|help|911|ambulance|serious/)) {
            return 'EMERGENCY';
        }

        // Treatment info
        if (lower.match(/treatment|medicine|drug|remedy|cure|medication/)) {
            return 'TREATMENT_INFO';
        }

        // Prakriti quiz
        if (lower.match(/prakriti|dosha|vata|pitta|kapha|ayurveda|constitution/)) {
            return 'PRAKRITI_QUIZ';
        }

        // Greeting
        if (lower.match(/^(hi|hello|hey|start|greet)/)) {
            return 'GREETING';
        }

        // NAMC Lookup
        if (lower.match(/what is|meaning of|define|tell me about|info on/) && (lower.includes('ayurveda') || lower.includes('namc') || lower.length < 50)) {
            return 'NAMC_LOOKUP';
        }

        return 'GENERAL_QUERY';
    }

    /**
     * Process user intent and generate response
     */
    async processIntent(intent, message, userId, sessionId) {
        switch (intent) {
            case 'GREETING':
                return this.handleGreeting();

            case 'CHECK_SYMPTOMS':
                return await this.handleSymptomCheck(userId);

            case 'BOOK_APPOINTMENT':
                return this.handleBooking();

            case 'EMERGENCY':
                return this.handleEmergency();

            case 'TREATMENT_INFO':
                return this.handleTreatmentQuery(message);

            case 'PRAKRITI_QUIZ':
                return this.handlePrakritiQuiz();

            case 'NAMC_LOOKUP':
                return await this.handleNAMCQuery(message);

            default:
                return this.handleGeneralQuery(message);
        }
    }

    /**
     * Handle greeting
     */
    handleGreeting() {
        return {
            type: 'OPTIONS',
            message: "Hi! 👋 I'm your AI Health Assistant. How can I help you today?",
            options: [
                { id: 1, text: "🔍 Check my symptoms", action: "CHECK_SYMPTOMS" },
                { id: 2, text: "📅 Book a doctor", action: "BOOK_APPOINTMENT" },
                { id: 3, text: "🧘 Take Prakriti Quiz", action: "PRAKRITI_QUIZ" },
                { id: 4, text: "🚨 Emergency help", action: "EMERGENCY" }
            ]
        };
    }

    /**
     * Handle symptom check request
     */
    async handleSymptomCheck(userId) {
        // Check symptom limits
        const [users] = await db.execute(
            'SELECT subscription_tier, symptom_checks_this_month FROM users WHERE id = ?',
            [userId]
        );

        const user = users[0];

        if (user.subscription_tier === 'free' && user.symptom_checks_this_month >= 10) {
            return {
                type: 'UPGRADE_PROMPT',
                message: "You've used all 10 free symptom checks this month! 😊",
                upgradeMessage: "Upgrade to Premium for unlimited checks",
                price: 4.99,
                options: [
                    { text: "View Premium Plans", action: "SHOW_PRICING" },
                    { text: "Maybe later", action: "DISMISS" }
                ]
            };
        }

        return {
            type: 'REDIRECT',
            message: "I'll help you identify what might be wrong. Let me guide you through symptom selection.",
            action: "OPEN_SYMPTOM_CHECKER",
            metadata: {
                remaining: user.subscription_tier === 'free' ? 10 - user.symptom_checks_this_month : 'unlimited'
            }
        };
    }

    /**
     * Handle booking request
     */
    handleBooking() {
        return {
            type: 'REDIRECT',
            message: "Great! Let me help you book an appointment with a doctor.",
            action: "OPEN_BOOKING",
            options: [
                { text: "🌿 Ayurvedic Doctor", action: "FILTER_AYURVEDA" },
                { text: "💊 Allopathic Doctor", action: "FILTER_ALLOPATHY" },
                { text: "Browse all doctors", action: "SHOW_ALL" }
            ]
        };
    }

    /**
     * Handle emergency
     */
    handleEmergency() {
        return {
            type: 'EMERGENCY',
            message: "⚠️ This seems urgent! Please call emergency services immediately.\n\n" +
                "Emergency Numbers:\n" +
                "🚨 Ambulance: 102/108\n" +
                "🏥 Emergency: 112\n\n" +
                "Would you also like to:",
            options: [
                { text: "Find nearest hospital", action: "NEARBY_HOSPITALS" },
                { text: "Call emergency contact", action: "EMERGENCY_CONTACT" },
                { text: "False alarm", action: "DISMISS" }
            ],
            priority: 'HIGH'
        };
    }

    /**
     * Handle Prakriti quiz request
     */
    handlePrakritiQuiz() {
        return {
            type: 'REDIRECT',
            message: "The Prakriti Quiz will help you understand your unique mind-body constitution according to Ayurveda.",
            action: "OPEN_PRAKRITI_QUIZ",
            info: "This takes about 5 minutes and is completely FREE!"
        };
    }

    /**
     * Handle treatment query
     */
    handleTreatmentQuery(message) {
        return {
            type: 'TEXT',
            message: "I can help you with treatment information!\n\n" +
                "For specific recommendations:\n" +
                "1. First, complete symptom check to get a diagnosis\n" +
                "2. Then I can suggest both Ayurvedic and Allopathic treatments\n\n" +
                "Would you like to:",
            options: [
                { text: "Check symptoms first", action: "CHECK_SYMPTOMS" },
                { text: "Talk to a doctor", action: "BOOK_APPOINTMENT" },
                { text: "General health info", action: "BROWSE" }
            ]
        };
    }

    /**
     * Handle general query
     */
    handleGeneralQuery(message) {
        return {
            type: 'TEXT',
            message: "I'm here to help with health-related queries. I can:\n\n" +
                "• Check your symptoms\n" +
                "• Book doctor appointments\n" +
                "• Help with emergency situations\n" +
                "• Guide you through Ayurveda & Allopathy options\n\n" +
                "What would you like to do?",
            options: [
                { text: "Check symptoms", action: "CHECK_SYMPTOMS" },
                { text: "Book appointment", action: "BOOK_APPOINTMENT" },
                { text: "Browse services", action: "BROWSE" }
            ]
        };
    }

    /**
     * Get personalized welcome message
     */
    getWelcomeMessage(user) {
        const greeting = `Hi ${user.name || 'there'}! 👋`;

        const tierMessages = {
            'free': `${greeting} I'm your AI Health Assistant. You have 10 free messages and symptom checks today.`,
            'premium': `${greeting} Welcome back, Premium member! 🌟 You have unlimited access to all features.`,
            'premium_plus': `${greeting} Welcome back, Premium Plus member! ⭐ You have 2 free consultations remaining this month.`
        };

        return tierMessages[user.subscription_tier] || tierMessages.free;
    }

    /**
     * Save message to database
     */
    async saveMessage(sessionId, sender, message) {
        await db.execute(
            'INSERT INTO chat_messages (session_id, sender, message) VALUES (?, ?, ?)',
            [sessionId, sender, message]
        );

        // Update message count
        await db.execute(
            'UPDATE chat_sessions SET message_count = message_count + 1 WHERE session_id = ?',
            [sessionId]
        );
    }

    /**
     * Increment chat usage counter
     */
    async incrementChatUsage(userId) {
        await db.execute(
            'UPDATE users SET chat_messages_today = chat_messages_today + 1 WHERE id = ?',
            [userId]
        );
    }

    /**
     * Get chat history
     */
    async getHistory(req, res) {
        try {
            const userId = req.user.id;
            const { limit = 50 } = req.query;

            const [messages] = await db.execute(
                `SELECT cm.*, cs.started_at 
         FROM chat_messages cm
         JOIN chat_sessions cs ON cm.session_id = cs.session_id
         WHERE cs.user_id = ?
         ORDER BY cm.timestamp DESC
         LIMIT ?`,
                [userId, parseInt(limit)]
            );

            res.json({
                success: true,
                messages
            });

        } catch (error) {
            console.error('Get history error:', error);
            res.status(500).json({ error: 'Failed to fetch chat history' });
        }
    }

    /**
     * Handle NAMC query
     */
    async handleNAMCQuery(message) {
        try {
            // Clean message to get search term
            const searchTerm = message.replace(/what is|meaning of|define|tell me about|info on|ayurveda|namc|\?|!/gi, '').trim();
            console.log(`[Chatbot] NAMC Lookup for: "${searchTerm}"`);

            if (!searchTerm) {
                return {
                    type: 'TEXT',
                    message: "I can help you look up Ayurvedic morbidity codes! What term would you like to know about?"
                };
            }

            const [results] = await db.query(`
                SELECT * FROM ayurveda_morbidity_codes
                WHERE namc_term LIKE ? OR namc_term_devanagari LIKE ? OR namc_code = ?
                LIMIT 1
            `, [`%${searchTerm}%`, `%${searchTerm}%`, searchTerm]);

            console.log(`[Chatbot] Found ${results.length} direct matches.`);

            if (results.length === 0) {
                // Try fulltext search if direct like fails
                try {
                    const [ftResults] = await db.query(`
                        SELECT * FROM ayurveda_morbidity_codes
                        WHERE MATCH(namc_term, namc_term_devanagari, short_definition, long_definition) AGAINST(?)
                        LIMIT 1
                    `, [searchTerm]);

                    if (ftResults.length > 0) {
                        console.log(`[Chatbot] Found ${ftResults.length} fulltext matches for "${searchTerm}".`);
                        return this.formatNAMCResponse(ftResults[0]);
                    }
                } catch (ftError) {
                    console.error('[Chatbot] Fulltext search for NAMC failed:', ftError);
                }

                return {
                    type: 'TEXT',
                    message: `I couldn't find a specific Ayurvedic morbidity code for "${searchTerm}". Would you like to check your symptoms instead?`,
                    options: [
                        { text: "🔍 Check symptoms", action: "CHECK_SYMPTOMS" },
                        { text: "📚 Browse Dictionary", action: "OPEN_DICTIONARY" }
                    ]
                };
            }

            return this.formatNAMCResponse(results[0]);

        } catch (error) {
            console.error('Handle NAMC query error:', error);
            return { type: 'TEXT', message: "Sorry, I had trouble looking up that term." };
        }
    }

    /**
     * Clean and format ontology branches
     */
    formatOntology(ontology) {
        if (!ontology) return null;

        // Remove technical tags like #san@ and identifiers like #[ED-2]
        let cleaned = ontology
            .replace(/#san@/g, '')
            .replace(/#\[([A-Z0-9-]+)\]/g, '($1)')
            .replace(/Classifed/g, 'Classified'); // Fix typo in dataset

        // Final trim and cleanup
        return cleaned.trim();
    }

    /**
     * Format NAMC response for chatbot
     */
    formatNAMCResponse(code) {
        const formattedTerm = code.namc_term.toLowerCase().trim();
        const displayTerm = formattedTerm.charAt(0).toUpperCase() + formattedTerm.slice(1);

        let message = `**${displayTerm}** (${code.namc_term_devanagari})\n`;
        message += `*NAMC Code: ${code.namc_code}*\n\n`;

        if (code.short_definition && code.short_definition !== '(') {
            message += `> ${code.short_definition}\n\n`;
        }

        if (code.long_definition) {
            message += `${code.long_definition}\n\n`;
        } else {
            message += `*No detailed clinical characteristics available.*\n\n`;
        }

        if (code.ontology_branches) {
            message += `*Category: ${this.formatOntology(code.ontology_branches)}*`;
        }

        return {
            type: 'TEXT',
            message,
            metadata: {
                namc_id: code.namc_id,
                source: 'NAMC'
            },
            options: [
                { text: "📖 View in Dictionary", action: "VIEW_CODE", id: code.namc_id },
                { text: "🔙 Back to options", action: "GREETING" }
            ]
        };
    }

    /**
     * AI Search Doctors Tool Handler
     */
    async aiSearchDoctors(args) {
        try {
            const { specialization, search, medicine_type } = args;
            let query = 'SELECT id, name, specialization, experience, consultationFee, image, medicine_type FROM doctors WHERE 1=1';
            const params = [];

            if (medicine_type) {
                query += ' AND medicine_type = ?';
                params.push(medicine_type);
            }

            if (specialization) {
                query += ' AND specialization LIKE ?';
                params.push(`%${specialization}%`);
            }

            if (search) {
                query += ' AND (name LIKE ? OR specialization LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            query += ' LIMIT 3';
            const [doctors] = await db.execute(query, params);
            return { doctors };
        } catch (error) {
            console.error('AI search doctors error:', error);
            return { error: 'Failed to search doctors' };
        }
    }

    /**
     * AI Search Medicines Tool Handler
     */
    async aiSearchMedicines(args) {
        try {
            const { search, category, medicine_type } = args;
            // Revised query based on products.sql schema
            // image_url -> image, category -> medicine_type, description -> description
            let query = 'SELECT id, name, category, price, image_url as image, category as medicine_type, description FROM medicines WHERE 1=1';
            const params = [];

            if (medicine_type) {
                // If filtering by specific type, use category or exact match if you had a type column
                // For now, assume medicine_type arg maps to category
                query += ' AND category LIKE ?';
                params.push(`%${medicine_type}%`);
            }

            if (category) {
                query += ' AND category LIKE ?';
                params.push(`%${category}%`);
            }

            if (search) {
                // Search in name, category, and description
                query += ' AND (name LIKE ? OR category LIKE ? OR description LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }

            query += ' LIMIT 3';
            const [medicines] = await db.execute(query, params);
            return { medicines };
        } catch (error) {
            console.error('AI search medicines error:', error);
            return { error: 'Failed to search medicines' };
        }
    }

    /**
     * Get Website Features Tool Handler
     */
    getWebsiteFeatures() {
        return {
            features: [
                { name: "Symptom Checker", link: "/symptom-checker", icon: "stethoscope", description: "Identify health issues based on symptoms." },
                { name: "Doctor Booking", link: "/find-doctors", icon: "calendar-check", description: "Book appointments with specialists." },
                { name: "Prakriti Quiz", link: "/ayurveda/prakriti", icon: "vihara", description: "Discover your Ayurvedic body type." },
                { name: "Emergency Hub", link: "/emergency", icon: "ambulance", description: "Quick access to emergency services." },
                { name: "Medicine Store", link: "/medicines", icon: "pills", description: "Browse and buy healthcare products." },
                { name: "NAMC Dictionary", link: "/ayurveda/morbidity", icon: "book-medical", description: "Ayurvedic clinical dictionary." }
            ]
        };
    }

    /**
     * Get all chat sessions for a user
     */
    async getSessions(req, res) {
        try {
            const userId = req.user.id;

            const [sessions] = await db.execute(`
                SELECT 
                    cs.session_id,
                    cs.started_at as created_at,
                    cs.status,
                    cs.pinned,
                    cs.custom_name,
                    (SELECT message FROM chat_messages 
                     WHERE session_id = cs.session_id AND sender = 'user' 
                     ORDER BY timestamp ASC LIMIT 1) as first_message,
                    (SELECT timestamp FROM chat_messages 
                     WHERE session_id = cs.session_id 
                     ORDER BY timestamp DESC LIMIT 1) as last_message_at,
                    (SELECT COUNT(*) FROM chat_messages 
                     WHERE session_id = cs.session_id) as message_count
                FROM chat_sessions cs
                WHERE cs.user_id = ?
                ORDER BY cs.pinned DESC, cs.started_at DESC
            `, [userId]);

            res.json({
                success: true,
                sessions: sessions.map(s => ({
                    sessionId: s.session_id,
                    createdAt: s.created_at,
                    lastMessageAt: s.last_message_at || s.created_at,
                    firstMessage: s.custom_name || s.first_message || 'New Chat',
                    messageCount: s.message_count,
                    status: s.status,
                    pinned: !!s.pinned
                }))
            });

        } catch (error) {
            console.error('Get sessions error:', error);
            res.status(500).json({ error: 'Failed to get chat sessions' });
        }
    }

    /**
     * Create a new chat session
     */
    async createNewSession(req, res) {
        try {
            const userId = req.user.id;
            const sessionId = `session_${userId}_${Date.now()}`;

            await db.execute(
                `INSERT INTO chat_sessions (user_id, session_id, context) VALUES (?, ?, ?)`,
                [userId, sessionId, JSON.stringify({ started: new Date() })]
            );

            res.json({
                success: true,
                sessionId
            });

        } catch (error) {
            console.error('Create new session error:', error);
            res.status(500).json({ error: 'Failed to create new session' });
        }
    }

    /**
     * Get messages for a specific session
     */
    async getSessionMessages(req, res) {
        try {
            const userId = req.user.id;
            const { sessionId } = req.params;

            // Verify session belongs to user
            const [sessions] = await db.execute(
                'SELECT * FROM chat_sessions WHERE session_id = ? AND user_id = ?',
                [sessionId, userId]
            );

            if (sessions.length === 0) {
                return res.status(404).json({ error: 'Session not found' });
            }

            const [messages] = await db.execute(
                `SELECT message, sender, intent as type, metadata, timestamp as created_at 
                 FROM chat_messages 
                 WHERE session_id = ? 
                 ORDER BY timestamp ASC`,
                [sessionId]
            );

            res.json({
                success: true,
                messages: messages.map(m => ({
                    text: m.message,
                    sender: m.sender,
                    type: m.type,
                    data: m.metadata ? JSON.parse(m.metadata) : null,
                    timestamp: m.created_at
                }))
            });

        } catch (error) {
            console.error('Get session messages error:', error);
            res.status(500).json({ error: 'Failed to get session messages' });
        }
    }

    /**
     * Update a chat session (pin/rename)
     */
    async updateSession(req, res) {
        try {
            const userId = req.user.id;
            const { sessionId } = req.params;
            const { pinned, customName } = req.body;

            // Verify session belongs to user
            const [sessions] = await db.execute(
                'SELECT * FROM chat_sessions WHERE session_id = ? AND user_id = ?',
                [sessionId, userId]
            );

            if (sessions.length === 0) {
                return res.status(404).json({ error: 'Session not found' });
            }

            // Build update query dynamically
            const updates = [];
            const values = [];

            if (typeof pinned !== 'undefined') {
                updates.push('pinned = ?');
                values.push(pinned ? 1 : 0);
                if (pinned) {
                    updates.push('pinned_at = NOW()');
                } else {
                    updates.push('pinned_at = NULL');
                }
            }

            if (customName !== undefined) {
                updates.push('custom_name = ?');
                values.push(customName || null);
            }

            if (updates.length === 0) {
                return res.status(400).json({ error: 'No updates provided' });
            }

            values.push(sessionId);

            await db.execute(
                `UPDATE chat_sessions SET ${updates.join(', ')} WHERE session_id = ?`,
                values
            );

            res.json({
                success: true,
                message: 'Session updated successfully'
            });

        } catch (error) {
            console.error('Update session error:', error);
            res.status(500).json({ error: 'Failed to update session' });
        }
    }

    /**
     * Delete a chat session
     */
    async deleteSession(req, res) {
        try {
            const userId = req.user.id;
            const { sessionId } = req.params;

            // Verify session belongs to user
            const [sessions] = await db.execute(
                'SELECT * FROM chat_sessions WHERE session_id = ? AND user_id = ?',
                [sessionId, userId]
            );

            if (sessions.length === 0) {
                return res.status(404).json({ error: 'Session not found' });
            }

            // Delete messages first
            await db.execute(
                'DELETE FROM chat_messages WHERE session_id = ?',
                [sessionId]
            );

            // Delete session
            await db.execute(
                'DELETE FROM chat_sessions WHERE session_id = ?',
                [sessionId]
            );

            res.json({
                success: true,
                message: 'Session deleted successfully'
            });

        } catch (error) {
            console.error('Delete session error:', error);
            res.status(500).json({ error: 'Failed to delete session' });
        }
    }

    /**
     * Delete all chat sessions for a user
     */
    async clearAllSessions(req, res) {
        try {
            const userId = req.user.id;

            // Get all session IDs for this user
            const [sessions] = await db.execute(
                'SELECT session_id FROM chat_sessions WHERE user_id = ?',
                [userId]
            );

            if (sessions.length === 0) {
                return res.json({ success: true, message: 'No sessions to delete' });
            }

            const sessionIds = sessions.map(s => s.session_id);

            // Delete messages for all these sessions
            // MySQL doesn't support JOIN in DELETE with subqueries very well in some versions, 
            // so we'll use IN with session IDs
            await db.execute(
                `DELETE FROM chat_messages WHERE session_id IN (${sessionIds.map(() => '?').join(',')})`,
                sessionIds
            );

            // Delete sessions
            await db.execute(
                'DELETE FROM chat_sessions WHERE user_id = ?',
                [userId]
            );

            res.json({
                success: true,
                message: 'All chat history cleared successfully'
            });

        } catch (error) {
            console.error('Clear all sessions error:', error);
            res.status(500).json({ error: 'Failed to clear chat history' });
        }
    }

    /**
     *End chat session
     */
    async endSession(req, res) {
        try {
            const { sessionId } = req.body;

            await db.execute(
                'UPDATE chat_sessions SET status = ?, ended_at = NOW() WHERE session_id = ?',
                ['completed', sessionId]
            );

            res.json({
                success: true,
                message: 'Session ended successfully'
            });

        } catch (error) {
            console.error('End session error:', error);
            res.status(500).json({ error: 'Failed to end session' });
        }
    }
}

module.exports = new ChatbotController();
