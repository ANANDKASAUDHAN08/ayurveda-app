const db = require('../config/database');
const crypto = require('crypto');

/**
 * Video Session Controller
 * Manages video call sessions, tokens, and call lifecycle
 */

// Generate a simple session token (you can replace with video provider's token later)
const generateSessionToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Generate a room ID
const generateRoomId = (appointmentId) => {
    return `consult_${appointmentId}_${Date.now()}`;
};

// Get or create video session for appointment
exports.getVideoSession = async (req, res) => {
    try {
        const userId = req.user.id;
        const { appointment_id } = req.params;

        // Verify appointment belongs to user and is confirmed
        const [appointments] = await db.execute(
            `SELECT 
                a.*,
                d.name as doctor_name,
                d.image as doctor_image,
                u.name as patient_name
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users u ON a.user_id = u.id
            WHERE a.id = ? AND (a.user_id = ? OR a.doctor_id IN (
                SELECT id FROM doctors WHERE userId = ?
            ))`,
            [appointment_id, userId, userId]
        );

        if (appointments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found or access denied'
            });
        }

        const appointment = appointments[0];

        // Check if appointment is confirmed
        if (appointment.status !== 'confirmed') {
            return res.status(400).json({
                success: false,
                message: 'Appointment is not confirmed'
            });
        }

        // Check if appointment is for video consultation
        if (appointment.consultation_type !== 'video') {
            return res.status(400).json({
                success: false,
                message: 'This is not a video consultation'
            });
        }

        // Check if it's within 10 minutes of appointment time
        const appointmentDateTime = new Date(`${appointment.appointment_date} ${appointment.start_time}`);
        const now = new Date();
        const timeDiff = appointmentDateTime - now;
        const minutesDiff = timeDiff / (1000 * 60);

        // Allow joining 10 minutes before and up to 30 minutes after start time
        if (minutesDiff < -30 || minutesDiff > 10) {
            return res.status(400).json({
                success: false,
                message: 'Video call can only be joined 10 minutes before to 30 minutes after scheduled time',
                scheduled_time: appointment.start_time,
                current_status: minutesDiff > 10 ? 'too_early' : 'too_late'
            });
        }

        // Get or create video session
        const [sessions] = await db.execute(
            'SELECT * FROM video_sessions WHERE appointment_id = ?',
            [appointment_id]
        );

        let session;

        if (sessions.length === 0) {
            // Create new session
            const sessionToken = generateSessionToken();
            const roomId = generateRoomId(appointment_id);

            const [result] = await db.execute(
                `INSERT INTO video_sessions (
                    appointment_id, session_token, room_id, channel_name, status
                ) VALUES (?, ?, ?, ?, 'waiting')`,
                [appointment_id, sessionToken, roomId, roomId]
            );

            session = {
                id: result.insertId,
                appointment_id,
                session_token: sessionToken,
                room_id: roomId,
                channel_name: roomId,
                status: 'waiting'
            };
        } else {
            session = sessions[0];
        }

        res.json({
            success: true,
            data: {
                session: session,
                appointment: {
                    id: appointment.id,
                    date: appointment.appointment_date,
                    start_time: appointment.start_time,
                    end_time: appointment.end_time,
                    doctor_name: appointment.doctor_name,
                    doctor_image: appointment.doctor_image,
                    patient_name: appointment.patient_name,
                    reason: appointment.reason
                }
            }
        });

    } catch (error) {
        console.error('Error getting video session:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get video session',
            error: error.message
        });
    }
};

// Start video call
exports.startVideoCall = async (req, res) => {
    try {
        const userId = req.user.id;
        const { appointment_id } = req.params;

        // Verify user has access to this appointment
        const [appointments] = await db.execute(
            `SELECT a.* FROM appointments a
            WHERE a.id = ? AND (a.user_id = ? OR a.doctor_id IN (
                SELECT id FROM doctors WHERE userId = ?
            ))`,
            [appointment_id, userId, userId]
        );

        if (appointments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found or access denied'
            });
        }

        // Get video session
        const [sessions] = await db.execute(
            'SELECT * FROM video_sessions WHERE appointment_id = ?',
            [appointment_id]
        );

        if (sessions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Video session not found'
            });
        }

        const session = sessions[0];

        // Update session status to active and set started_at
        if (session.status === 'waiting') {
            await db.execute(
                `UPDATE video_sessions 
                SET status = 'active', started_at = NOW()
                WHERE id = ?`,
                [session.id]
            );
        }

        res.json({
            success: true,
            message: 'Video call started',
            data: {
                session_id: session.id,
                room_id: session.room_id,
                status: 'active'
            }
        });

    } catch (error) {
        console.error('Error starting video call:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start video call',
            error: error.message
        });
    }
};

// End video call
exports.endVideoCall = async (req, res) => {
    try {
        const userId = req.user.id;
        const { appointment_id } = req.params;

        // Verify user has access to this appointment
        const [appointments] = await db.execute(
            `SELECT a.* FROM appointments a
            WHERE a.id = ? AND (a.user_id = ? OR a.doctor_id IN (
                SELECT id FROM doctors WHERE userId = ?
            ))`,
            [appointment_id, userId, userId]
        );

        if (appointments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found or access denied'
            });
        }

        // Get video session
        const [sessions] = await db.execute(
            'SELECT * FROM video_sessions WHERE appointment_id = ?',
            [appointment_id]
        );

        if (sessions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Video session not found'
            });
        }

        const session = sessions[0];

        // Calculate duration in minutes
        let duration = 0;
        if (session.started_at) {
            const startTime = new Date(session.started_at);
            const endTime = new Date();
            duration = Math.round((endTime - startTime) / (1000 * 60));
        }

        // Update session status to ended
        await db.execute(
            `UPDATE video_sessions 
            SET status = 'ended', ended_at = NOW(), duration = ?
            WHERE id = ?`,
            [duration, session.id]
        );

        // Update appointment status to completed
        await db.execute(
            `UPDATE appointments 
            SET status = 'completed'
            WHERE id = ?`,
            [appointment_id]
        );

        res.json({
            success: true,
            message: 'Video call ended',
            data: {
                duration: duration,
                appointment_id: appointment_id
            }
        });

    } catch (error) {
        console.error('Error ending video call:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to end video call',
            error: error.message
        });
    }
};

// Get session status
exports.getSessionStatus = async (req, res) => {
    try {
        const { appointment_id } = req.params;

        const [sessions] = await db.execute(
            `SELECT 
                vs.*,
                a.appointment_date,
                a.start_time,
                a.end_time,
                a.status as appointment_status
            FROM video_sessions vs
            JOIN appointments a ON vs.appointment_id = a.id
            WHERE vs.appointment_id = ?`,
            [appointment_id]
        );

        if (sessions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Video session not found'
            });
        }

        res.json({
            success: true,
            data: sessions[0]
        });

    } catch (error) {
        console.error('Error getting session status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get session status',
            error: error.message
        });
    }
};

// Get active sessions (for doctors dashboard)
exports.getActiveSessions = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get doctor ID from user ID
        const [doctors] = await db.execute(
            'SELECT id FROM doctors WHERE userId = ?',
            [userId]
        );

        if (doctors.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Only doctors can access active sessions'
            });
        }

        const doctorId = doctors[0].id;

        // Get all active sessions for this doctor
        const [sessions] = await db.execute(
            `SELECT 
                vs.*,
                a.appointment_date,
                a.start_time,
                a.end_time,
                a.reason,
                u.name as patient_name,
                u.email as patient_email
            FROM video_sessions vs
            JOIN appointments a ON vs.appointment_id = a.id
            JOIN users u ON a.user_id = u.id
            WHERE a.doctor_id = ?
              AND vs.status IN ('waiting', 'active')
              AND a.status = 'confirmed'
            ORDER BY a.appointment_date, a.start_time`,
            [doctorId]
        );

        res.json({
            success: true,
            data: sessions
        });

    } catch (error) {
        console.error('Error getting active sessions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get active sessions',
            error: error.message
        });
    }
};

// Save recording URL (if video provider saves recordings)
exports.saveRecording = async (req, res) => {
    try {
        const { appointment_id } = req.params;
        const { recording_url } = req.body;

        if (!recording_url) {
            return res.status(400).json({
                success: false,
                message: 'Recording URL is required'
            });
        }

        // Update video session with recording URL
        await db.execute(
            `UPDATE video_sessions 
            SET recording_url = ?
            WHERE appointment_id = ?`,
            [recording_url, appointment_id]
        );

        res.json({
            success: true,
            message: 'Recording URL saved successfully'
        });

    } catch (error) {
        console.error('Error saving recording:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save recording',
            error: error.message
        });
    }
};
