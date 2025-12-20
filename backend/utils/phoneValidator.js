const { parsePhoneNumber } = require('libphonenumber-js');

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @param {string} country - Country code (default: 'IN' for India)
 * @returns {object} - { valid: boolean, formatted: string, error: string }
 */
function validatePhone(phone, country = 'IN') {
    try {
        // Remove any whitespace
        const cleanPhone = phone.replace(/\s+/g, '');

        // Parse phone number
        const phoneNumber = parsePhoneNumber(cleanPhone, country);

        if (!phoneNumber || !phoneNumber.isValid()) {
            return {
                valid: false,
                formatted: null,
                error: 'Invalid phone number format'
            };
        }

        return {
            valid: true,
            formatted: phoneNumber.number, // E.164 format: +919876543210
            error: null
        };
    } catch (error) {
        return {
            valid: false,
            formatted: null,
            error: error.message || 'Invalid phone number'
        };
    }
}

/**
 * Format phone number for display
 * @param {string} phone - Phone number in E.164 format
 * @returns {string} - Formatted phone number
 */
function formatPhoneForDisplay(phone) {
    try {
        const phoneNumber = parsePhoneNumber(phone);
        return phoneNumber ? phoneNumber.formatInternational() : phone;
    } catch {
        return phone;
    }
}

module.exports = {
    validatePhone,
    formatPhoneForDisplay
};
