const { validatePhone } = require('../../utils/phoneValidator');

/**
 * Mock SMS service (for development without SMS provider)
 * In production, replace with actual Twilio/MSG91 integration
 */

/**
 * Send OTP via SMS (MOCK VERSION - logs to console)
 * @param {string} phone - Phone number in E.164 format
 * @param {string} otp - 6-digit OTP code
 * @param {string} name - User name
 * @returns {Promise<object>} Result of SMS sending
 */
async function sendOTP(phone, otp, name = 'User') {
    // Validate phone
    const validation = validatePhone(phone);
    if (!validation.valid) {
        throw new Error('Invalid phone number format');
    }

    const message = `Hi ${name}! Your Health Connect verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`;

    // Simulate successful send
    return {
        success: true,
        sid: 'MOCK-' + Date.now(),
        message: 'OTP logged to console (development mode)'
    };
}

module.exports = { sendOTP };
