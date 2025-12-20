require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./config/database');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const contentRoutes = require('./routes/content');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const searchRoutes = require('./routes/search');
const verificationRoutes = require('./routes/verification');
const otpRoutes = require('./routes/otp');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/search', searchRoutes);
app.use('/api', verificationRoutes);
app.use('/api', otpRoutes);

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
