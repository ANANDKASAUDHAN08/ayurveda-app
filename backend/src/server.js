require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const session = require('express-session');
const passport = require('./config/passport');
const db = require('./config/database');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const contentRoutes = require('./routes/content');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const searchRoutes = require('./routes/search');
const verificationRoutes = require('./routes/verification');
const otpRoutes = require('./routes/otp');
const medicineTypesRoutes = require('./routes/medicineTypes');
const oauthRoutes = require('./routes/oauth.routes');
const ayurvedaRoutes = require('./routes/ayurveda');

const app = express();
const helmet = require('helmet');
const { apiLimiter } = require('./middleware/security');

// Trust proxy - Required for Render deployment to correctly identify client IPs
// This allows express-rate-limit to work properly with the X-Forwarded-For header
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;

// 1. CORS Configuration (Should be first to handle pre-flights)
const allowedOrigins = [
    process.env.APP_URL,
    process.env.FRONTEND_URL,
    'http://localhost:4200',
    'https://healthconnect-zeta.vercel.app',
    'https://healthconnect-6s0ig7c0r-anand-kasaudhans-projects.vercel.app'
].filter(Boolean).map(url => url.replace(/\/$/, ""));

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/$/, "");
        if (allowedOrigins.indexOf(cleanOrigin) !== -1 || cleanOrigin.includes('.vercel.app')) {
            return callback(null, true);
        }
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// 2. Security Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Basic security headers with CORS policy for static files

app.use('/api', apiLimiter); // Apply to all API routes

app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

// Session configuration for Passport
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-random-secret-key-anand-infinityMan',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/search', searchRoutes);
app.use('/api', verificationRoutes);
app.use('/api', otpRoutes);
app.use('/api/medicine-types', medicineTypesRoutes);
app.use('/api/auth', oauthRoutes);
app.use('/api/settings', require('./routes/settings.routes')); // User settings API
app.use('/api/hospitals', require('./routes/hospitals')); // Hospitals API
app.use('/api/emergency', require('./routes/emergency.routes')); // Emergency services API
app.use('/api', require('./routes/prescription.routes')); // Prescription management API
app.use('/api', require('./routes/share.routes')); // Prescription sharing API
app.use('/api/prescriptions', require('./routes/verification.routes')); // Prescription verification API
app.use('/api', require('./routes/refill.routes')); // Prescription refill API
app.use('/api/doctor', require('./routes/doctor-refill.routes')); // Doctor refill management API
app.use('/api/doctor', require('./routes/doctor-prescription.routes')); // Doctor prescription verification API
app.use('/api/notifications', require('./routes/notification.routes')); // Notification API
app.use('/api/prakriti', require('./routes/prakritiRoutes')); // Prakriti Quiz API
app.use('/api/ayurveda', ayurvedaRoutes); // Ayurveda dashboard API
app.use('/api/allopathy', require('./routes/allopathy')); // Allopathy dashboard API
app.use('/api/favorites', require('./routes/favorite.routes')); // Favorites API
app.use('/api/payment', require('./routes/paymentRoutes')); // Payment API
app.use('/api/newsletter', require('./routes/newsletter.routes')); // Newsletter API
app.use('/api/symptom-checker', require('./routes/symptomChecker')); // Symptom Checker API
app.use('/api/chatbot', require('./routes/chatbot')); // AI Chatbot API
app.use('/api/subscription', require('./routes/subscription')); // Subscription API
app.use('/api/calendar', require('./routes/calendarRoutes')); // Wellness Calendar API
app.use('/api/medicines', require('./routes/medicines')); // Dedicated Medicines Discovery API
app.use('/api/video-consultancy', require('./routes/videoConsultancy')); // Video Consultancy - Appointments & Payment
app.use('/api/hospital-reviews', require('./routes/hospitalReview.routes')); // Hospital Reviews API
app.use('/api/website-reviews', require('./routes/websiteReview.routes')); // Website/Platform Feedback API

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'UP', timestamp: new Date() });
});

// Final error handling middleware
app.use((err, req, res, next) => {
    console.error('Final Error Catch:', err);
    res.status(500).json({
        success: false,
        message: 'An unexpected error occurred',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Global event handlers to prevent crash
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

async function startServer() {
    try {
        // Test database connection
        await db.execute('SELECT 1');
        console.log('✅ Connected to MySQL database successfully.');
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
    }
}

startServer();