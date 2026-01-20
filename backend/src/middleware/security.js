const rateLimit = require('express-rate-limit');

// Rate limiter for general API requests
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 10000 : 1000, // Significantly higher in dev
    message: {
        success: false,
        message: 'Too many requests'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter limiter for authentication routes (login, register)
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 login/register attempts per hour
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again after an hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Very strict limiter for 2FA verification
const tfaLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 2FA attempts per 15 mins
    message: {
        success: false,
        message: 'Too many 2FA attempts, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    apiLimiter,
    authLimiter,
    tfaLimiter
};
