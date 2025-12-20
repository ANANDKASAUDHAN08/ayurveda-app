const crypto = require('crypto');

/**
 * Generate random verification token
 * @returns {string} Random 64-character hex string
 */
function generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Get token expiration time (24 hours from now)
 * @returns {Date} Expiration timestamp
 */
function getTokenExpiration() {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    return expiresAt;
}

/**
 * Check if token has expired
 * @param {Date|string} expiresAt - Token expiration time
 * @returns {boolean} True if expired
 */
function isTokenExpired(expiresAt) {
    const now = new Date();
    const expiry = new Date(expiresAt);
    return now > expiry;
}

module.exports = {
    generateVerificationToken,
    getTokenExpiration,
    isTokenExpired
};
