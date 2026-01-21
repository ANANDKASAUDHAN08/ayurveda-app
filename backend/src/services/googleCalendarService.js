const { google } = require('googleapis');
require('dotenv').config();

// OAuth2 Client configuration
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
);

// Set credentials if refresh token is available
if (process.env.GOOGLE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
}

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

/**
 * Creates a Google Meet meeting for an appointment
 * @param {Object} appointment - Appointment details
 * @returns {Promise<string>} - The Google Meet link
 */
exports.createMeeting = async (appointment) => {
    try {
        if (!process.env.GOOGLE_REFRESH_TOKEN) {
            console.warn('⚠️ GOOGLE_REFRESH_TOKEN is not set. Google Meet link will not be generated.');
            return null;
        }

        const { patient_name, doctor_name, appointment_date, start_time, end_time, reason } = appointment;

        // Combine date and time
        const startDateTime = new Date(`${appointment_date}T${start_time}`);
        const endDateTime = new Date(`${appointment_date}T${end_time}`);

        const event = {
            summary: `Consultation: ${patient_name} & Dr. ${doctor_name}`,
            description: `Patient Reason: ${reason || 'No reason provided'}`,
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: 'Asia/Kolkata',
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: 'Asia/Kolkata',
            },
            conferenceData: {
                createRequest: {
                    requestId: `meeting_${appointment.id || Date.now()}`,
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet',
                    },
                },
            },
            attendees: appointment.emails ? appointment.emails.map(email => ({ email })) : [],
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            conferenceDataVersion: 1,
        });

        return response.data.hangoutLink;
    } catch (error) {
        console.error('Error creating Google Meet:', error);
        // We don't want to fail the whole booking if meeting creation fails
        return null;
    }
};
