const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('GEMINI_API_KEY is not set. AI Chatbot functionality will be limited.');
            this.isEnabled = false;
            return;
        }

        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.isEnabled = true;

        // Define function declarations for tools
        this.functionDeclarations = [
            {
                name: "search_doctors",
                description: "Find doctors based on specialization, name, or type of medicine (Ayurveda/Allopathy).",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        specialization: { type: "STRING", description: "The doctor's specialty (e.g., Cardiologist, Dermatologist, General Physician)" },
                        search: { type: "STRING", description: "Search by name or keywords" },
                        medicine_type: { type: "STRING", enum: ["ayurveda", "allopathy"], description: "Filter by system of medicine" }
                    }
                }
            },
            {
                name: "search_medicines",
                description: "Search for medicines or health products by name, category, or type.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        search: { type: "STRING", description: "Medicine name or keywords" },
                        category: { type: "STRING", description: "Filter by category (e.g., Pain Relief, Digestive, Herbal)" },
                        medicine_type: { type: "STRING", enum: ["ayurveda", "allopathy"], description: "System of medicine" }
                    }
                }
            },
            {
                name: "search_ayurveda_terms",
                description: "Look up definitions and information for Ayurvedic terms or morbidity codes (NAMC).",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        term: { type: "STRING", description: "The Ayurvedic term or code to look up (e.g., Vata, Pitta, Kapha, fever)" }
                    }
                }
            },
            {
                name: "get_website_features",
                description: "Get information about what services and features are available on this website.",
                parameters: {
                    type: "OBJECT",
                    properties: {}
                }
            }
        ];

        // System Instruction
        this.systemInstruction = `You are a helpful and professional "AI Health Assistant" for the HealthConnect website. 
            
            YOUR KNOWLEDGE OF THIS WEBSITE:
            - Profile Page: /profile (Used for personal details, medical history)
            - Symptom Checker: /symptom-checker
            - Find Doctors: /find-doctors
            - Medicine Store: /medicines
            - Prakriti Quiz: /ayurveda/prakriti
            - Appointments: /appointments
            - Emergency Hub: /emergency-hub
            - Home Page: /
            
            YOUR GOALS:
            1. Help users find information about health, doctors, and medicines.
            2. Be empathetic but professional.
            3. Always remind users to consult a professional doctor for serious conditions.
            4. If a user describes a symptom:
               - Provide a brief overview of what it might be.
               - INCLUDE home remedies and precautions for any health condition mentioned.
               - Use 'search_doctors' or 'search_medicines' to suggest relevant resources.
            5. If a user asks about Ayurvedic terms or 'NAMC', use 'search_ayurveda_terms'.
            6. If asked about website features or navigation (e.g., "where is my profile"), provide the direct URL and guide them.
            
            SUBSCRIPTION TIERING (CRITICAL):
            - If user's tier is "FREE": Give concise, helpful answers. Suggest 1 home remedy and basic precautions. Don't go deep into clinical details.
            - If user's tier is "PREMIUM" or "PREMIUM_PLUS": Provide comprehensive, expert-level answers with 3-4 home remedies, detailed precautions, and in-depth explanations. **Do NOT explicitly state "As a PREMIUM subscriber"**—just provide the high-quality content naturally.
            
            FORMATTING:
            - Use Markdown for bolding, lists, and headers.
            - When you find doctors or medicines, state that you've found them and you are showing cards below.
            - Do NOT try to simulate cards in text; just confirm that the cards are being displayed.
            - For links, use standard markdown: [Link Text](/url).
            `;

        // Use gemini-2.5-flash (better quota availability)
        this.modelName = "gemini-2.5-flash";
        this.model = this.initModel(this.modelName);
    }

    initModel(modelName) {
        console.log(`[AI Service] Initializing with model: ${modelName}`);
        return this.genAI.getGenerativeModel({
            model: modelName,
            tools: [{ functionDeclarations: this.functionDeclarations }],
            systemInstruction: this.systemInstruction
        });
    }

    /**
     * Start a new chat session with history
     */
    async startChat(history = []) {
        if (!this.isEnabled) return null;

        // Filter and fix history to ensure it starts with user message
        let filteredHistory = history.filter(msg => msg.sender && msg.message);

        // Remove leading bot messages (Gemini requires first message to be from user)
        while (filteredHistory.length > 0 && filteredHistory[0].sender !== 'user') {
            filteredHistory.shift();
        }

        return this.model.startChat({
            history: filteredHistory.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: typeof msg.message === 'string' ? msg.message : JSON.stringify(msg.message) }]
            }))
        });
    }

    /**
     * Process message and handle function calls
     */
    async processMessage(chat, message, toolHandlers, userContext = {}, retryCount = 0) {
        if (!this.isEnabled) {
            return {
                type: 'TEXT',
                message: "I'm sorry, my AI processing is currently unavailable."
            };
        }

        try {
            // Include user context (like tier) in a preamble if provided
            let finalMessage = message;
            if (userContext.tier) {
                finalMessage = `[User Subscription Tier: ${userContext.tier.toUpperCase()}]\n${message}`;
            }

            const result = await chat.sendMessage(finalMessage);
            const response = result.response;
            const calls = response.functionCalls();

            if (calls && calls.length > 0) {
                const results = {};
                for (const call of calls) {
                    const handler = toolHandlers[call.name];
                    if (handler) {
                        results[call.name] = await handler(call.args);
                    }
                }

                const followupResult = await chat.sendMessage([{
                    functionResponse: {
                        name: calls[0].name,
                        response: results[calls[0].name]
                    }
                }]);

                return {
                    type: 'RICH_TEXT',
                    message: followupResult.response.text(),
                    data: results
                };
            }

            return {
                type: 'TEXT',
                message: response.text()
            };

        } catch (error) {
            console.error(`AI Error (Retry ${retryCount}):`, error.message);

            // Fallback chain for available models
            if (retryCount < 1 && (error.message.includes('429') || error.message.includes('404') || error.message.includes('quota'))) {
                const fallbacks = ["gemini-2.5-flash"];
                const nextModel = fallbacks[retryCount];

                console.log(`[AI Service] Falling back to ${nextModel}...`);
                this.model = this.initModel(nextModel);
                const newChat = await this.startChat();
                return this.processMessage(newChat, message, toolHandlers, retryCount + 1);
            }

            // If all models fail, return friendly error
            return {
                type: 'TEXT',
                message: "I'm currently experiencing connectivity issues. Please use the quick action buttons below or try again in a moment."
            };
        }
    }
}

module.exports = new AIService();
