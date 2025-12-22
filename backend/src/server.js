require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
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

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
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


// Test route
app.get('/', (req, res) => {
    res.send('Ayurveda API is running');
});

async function startServer() {
    try {
        // Test database connection
        await db.execute('SELECT 1');
        console.log('✅ Connected to MySQL database successfully.');

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        console.error('Please check your .env file and ensure MySQL is running.');
    }
}

startServer();
