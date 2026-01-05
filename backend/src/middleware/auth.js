const jwt = require('jsonwebtoken');

/**
 * Authenticate JWT token
 */
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-random-secret-key-anand-infinityMan');
        req.user = decoded;
        next();
    } catch (ex) {
        if (ex.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired.' });
        }
        res.status(401).json({ message: 'Invalid token.' });
    }
};

/**
 * Authorize admin role
 */
const authorizeAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required.' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    next();
};

// Export both named functions and default for backward compatibility
module.exports = authenticateToken;
module.exports.authenticateToken = authenticateToken;
module.exports.authorizeAdmin = authorizeAdmin;
