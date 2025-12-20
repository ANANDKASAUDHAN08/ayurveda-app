/**
 * Generate random 6-digit OTP
 * @returns {string} 6-digit OTP code
 */
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Get OTP expiration time (5 minutes from now)
 * @returns {Date} Expiration timestamp
 */
function getOTPExpiration() {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    return expiresAt;
}

/**
 * Check if OTP has expired
 * @param {Date|string} expiresAt - OTP expiration time
 * @returns {boolean} True if expired
 */
function isOTPExpired(expiresAt) {
    return new Date() > new Date(expiresAt);
}

module.exports = {
    generateOTP,
    getOTPExpiration,
    isOTPExpired
};
