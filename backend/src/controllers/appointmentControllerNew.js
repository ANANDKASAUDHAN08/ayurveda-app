const db = require('../config/database');
const emailService = require('../services/email.service');
const NotificationController = require('./notification.controller');

// Book an appointment
exports.bookAppointment = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const userId = req.user.id;
        const { slotId, notes } = req.body;

        if (!slotId) {
            return res.status(400).json({ message: 'Slot ID is required' });
        }

        // Check if slot exists and is available
        const checkSlotQuery = `
            SELECT id, doctor_id, slot_date, start_time, end_time, is_booked
            FROM appointment_slots
            WHERE id = ?
        `;

        const [slotResults] = await connection.query(checkSlotQuery, [slotId]);

        if (slotResults.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Slot not found' });
        }

        const slot = slotResults[0];

        if (slot.is_booked) {
            connection.release();
            return res.status(400).json({ message: 'This slot is already booked' });
        }

        // Start transaction
        await connection.beginTransaction();

        // Mark slot as booked
        const updateSlotQuery = 'UPDATE appointment_slots SET is_booked = TRUE WHERE id = ?';
        await connection.query(updateSlotQuery, [slotId]);

        // Create appointment
        const createAppointmentQuery = `
            INSERT INTO appointments 
            (user_id, doctor_id, slot_id, appointment_date, start_time, end_time, notes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')
        `;

        const appointmentData = [
            userId,
            slot.doctor_id,
            slotId,
            slot.slot_date,
            slot.start_time,
            slot.end_time,
            notes || null
        ];

        const [result] = await connection.query(createAppointmentQuery, appointmentData);

        // Commit transaction
        await connection.commit();

        // Get details for notification
        try {
            const [details] = await connection.query(`
                SELECT u.email as patient_email, u.name as patient_name, d.name as doctor_name
                FROM users u, doctors d
                WHERE u.id = ? AND d.id = ?
            `, [userId, slot.doctor_id]);

            if (details.length > 0) {
                const info = details[0];
                // 1. Send Email
                await emailService.sendAppointmentConfirmation({
                    to: info.patient_email,
                    patientName: info.patient_name,
                    doctorName: info.doctor_name,
                    date: new Date(slot.slot_date).toLocaleDateString(),
                    time: slot.start_time,
                    type: 'general'
                });

                // 2. Add Notification
                await NotificationController.createNotification({
                    user_id: userId,
                    type: 'appointment_confirmed',
                    category: 'appointment',
                    title: 'Booking Confirmed!',
                    message: `Your appointment with Dr. ${info.doctor_name} on ${new Date(slot.slot_date).toLocaleDateString()} at ${slot.start_time} is confirmed.`,
                    related_id: result.insertId,
                    related_type: 'appointment',
                    action_url: '/my-appointments'
                });
            }
        } catch (notifErr) {
            console.error('Notification Error:', notifErr.message);
        }

        connection.release();

        res.status(201).json({
            message: 'Appointment booked successfully',
            appointmentId: result.insertId,
            appointment: {
                id: result.insertId,
                date: slot.slot_date,
                startTime: slot.start_time,
                endTime: slot.end_time
            }
        });

    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Error booking appointment:', error);
        res.status(500).json({ message: 'Error booking appointment' });
    }
};

// Get user's appointments
exports.getUserAppointments = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        let query = `
            SELECT 
                a.id,
                a.appointment_date,
                a.start_time,
                a.end_time,
                a.status,
                a.notes,
                a.created_at,
                d.name as doctor_name,
                d.specialization as specialty,
                d.clinic_name,
                d.clinic_address,
                d.phone as doctor_phone,
                vs.meeting_link,
                vs.meeting_platform
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            LEFT JOIN video_sessions vs ON a.id = vs.appointment_id
            WHERE a.user_id = ?
        `;

        const queryParams = [userId];

        if (status) {
            query += ' AND a.status = ?';
            queryParams.push(status);
        }

        query += ' ORDER BY a.appointment_date DESC, a.start_time DESC';

        const [results] = await db.query(query, queryParams);

        // --- Meeting Link Security Logic ---
        results.forEach(apt => {
            if (apt.meeting_link) {
                const now = new Date();
                const aptDate = new Date(apt.appointment_date);
                const [hours, minutes] = apt.start_time.split(':');
                const [endHours, endMinutes] = apt.end_time.split(':');

                const startLimit = new Date(aptDate);
                startLimit.setHours(parseInt(hours), parseInt(minutes) - 15, 0);

                const endLimit = new Date(aptDate);
                endLimit.setHours(parseInt(endHours), parseInt(endMinutes) + 15, 0);

                if (now < startLimit || now > endLimit) {
                    apt.meeting_link = null;
                    apt.link_hidden = true;
                }
            }
        });

        res.json(results);
    } catch (error) {
        console.error('Error in getUserAppointments:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get doctor's appointments
exports.getDoctorAppointments = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, date } = req.query;

        // Get doctor ID from userId
        const [doctors] = await db.query('SELECT id FROM doctors WHERE userId = ?', [userId]);

        if (doctors.length === 0) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }
        const doctorId = doctors[0].id;

        let query = `
            SELECT 
                a.id,
                a.appointment_date,
                a.start_time,
                a.end_time,
                a.status,
                a.notes,
                a.created_at,
                a.user_id,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                vs.meeting_link,
                vs.meeting_platform
            FROM appointments a
            JOIN users u ON a.user_id = u.id
            LEFT JOIN video_sessions vs ON a.id = vs.appointment_id
            WHERE a.doctor_id = ?
        `;

        const queryParams = [doctorId];

        if (status) {
            query += ' AND a.status = ?';
            queryParams.push(status);
        }

        if (date) {
            query += ' AND a.appointment_date = ?';
            queryParams.push(date);
        }

        query += ' ORDER BY a.appointment_date ASC, a.start_time ASC';

        const [results] = await db.query(query, queryParams);

        res.json(results);
    } catch (error) {
        console.error('❌❌❌ Error in getDoctorAppointments:', error);
        console.error('Error stack:', error.stack);
        console.error('Error message:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Cancel appointment
exports.cancelAppointment = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Check if appointment belongs to user
        const checkQuery = `
            SELECT id, slot_id, status, appointment_date
            FROM appointments
            WHERE id = ? AND user_id = ?
        `;

        const [results] = await connection.query(checkQuery, [id, userId]);

        if (results.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Appointment not found' });
        }

        const appointment = results[0];

        if (appointment.status === 'cancelled') {
            connection.release();
            return res.status(400).json({ message: 'Appointment is already cancelled' });
        }

        if (appointment.status === 'completed') {
            connection.release();
            return res.status(400).json({ message: 'Cannot cancel completed appointment' });
        }

        // Check if appointment date is in the past
        const appointmentDate = new Date(appointment.appointment_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (appointmentDate < today) {
            connection.release();
            return res.status(400).json({ message: 'Cannot cancel past appointment' });
        }

        // Start transaction
        await connection.beginTransaction();

        // Update appointment status
        const updateAppointmentQuery = `
            UPDATE appointments 
            SET status = 'cancelled' 
            WHERE id = ?
        `;
        await connection.query(updateAppointmentQuery, [id]);

        // Free up the slot
        const updateSlotQuery = `
            UPDATE appointment_slots 
            SET is_booked = FALSE 
            WHERE id = ?
        `;
        await connection.query(updateSlotQuery, [appointment.slot_id]);

        // Commit transaction
        await connection.commit();
        connection.release();

        res.json({ message: 'Appointment cancelled successfully' });

    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Error in cancelAppointment:', error);
        res.status(500).json({ message: 'Error cancelling appointment' });
    }
};

// Get appointment statistics for a user
exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Get total consultations (completed appointments)
        const [totalResult] = await db.query(`
            SELECT COUNT(*) as total 
            FROM appointments 
            WHERE ${userRole === 'doctor' ? 'doctor_id' : 'user_id'} = ? 
            AND status = 'completed'
        `, [userId]);

        // Get upcoming appointments
        const [upcomingResult] = await db.query(`
            SELECT COUNT(*) as upcoming 
            FROM appointments 
            WHERE ${userRole === 'doctor' ? 'doctor_id' : 'user_id'} = ? 
            AND status IN ('pending', 'booked', 'confirmed') 
            AND appointment_date >= CURDATE()
        `, [userId]);

        // Get consultations completed this month
        const [monthResult] = await db.query(`
            SELECT COUNT(*) as this_month 
            FROM appointments 
            WHERE ${userRole === 'doctor' ? 'doctor_id' : 'user_id'} = ? 
            AND status = 'completed'
            AND MONTH(appointment_date) = MONTH(CURRENT_DATE())
            AND YEAR(appointment_date) = YEAR(CURRENT_DATE())
        `, [userId]);

        const stats = {
            totalConsultations: totalResult[0].total || 0,
            upcomingAppointments: upcomingResult[0].upcoming || 0,
            completedThisMonth: monthResult[0].this_month || 0
        };

        res.json(stats);
    } catch (err) {
        console.error('Get stats error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get activity feed for a user
exports.getActivityFeed = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const activities = [];

        // Get recent appointments
        const [appointments] = await db.query(`
            SELECT a.*, 
                   u.name as other_person_name
            FROM appointments a
            LEFT JOIN users u ON u.id = ${userRole === 'doctor' ? 'a.user_id' : 'a.doctor_id'}
            WHERE ${userRole === 'doctor' ? 'a.doctor_id' : 'a.user_id'} = ?
            ORDER BY a.created_at DESC
            LIMIT 10
        `, [userId]);

        // Add appointment activities
        for (const appt of appointments) {
            let title, description;
            if (appt.status === 'completed') {
                title = 'Consultation Completed';
                description = userRole === 'doctor'
                    ? `Consultation with ${appt.other_person_name || 'Patient'}`
                    : `Consultation with Dr. ${appt.other_person_name || 'Doctor'}`;
            } else if (appt.status === 'booked' || appt.status === 'confirmed') {
                title = 'Appointment Confirmed';
                description = userRole === 'doctor'
                    ? `Upcoming appointment with ${appt.other_person_name || 'Patient'}`
                    : `Upcoming appointment with Dr. ${appt.other_person_name || 'Doctor'}`;
            } else if (appt.status === 'cancelled') {
                title = 'Appointment Cancelled';
                description = userRole === 'doctor'
                    ? `Cancelled appointment with ${appt.other_person_name || 'Patient'}`
                    : `Cancelled appointment with Dr. ${appt.other_person_name || 'Doctor'}`;
            } else {
                continue;
            }

            activities.push({
                type: 'appointment',
                title,
                description,
                date: appt.created_at,
                icon: appt.status === 'completed' ? 'fa-calendar-check' :
                    (appt.status === 'booked' || appt.status === 'confirmed') ? 'fa-calendar' : 'fa-calendar-times'
            });
        }

        // Get user's timestamps
        const [user] = await db.query(`
            SELECT createdAt, updatedAt 
            FROM users 
            WHERE id = ?
        `, [userId]);

        if (user[0]) {
            if (user[0].updatedAt) {
                activities.push({
                    type: 'profile_update',
                    title: 'Profile Updated',
                    description: 'Updated profile information',
                    date: user[0].updatedAt,
                    icon: 'fa-user-edit'
                });
            }

            if (user[0].createdAt) {
                activities.push({
                    type: 'account',
                    title: 'Account Created',
                    description: 'Welcome to HealthConnect!',
                    date: user[0].createdAt,
                    icon: 'fa-user-plus'
                });
            }
        }

        // Sort by date descending
        activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        res.json(activities);
    } catch (err) {
        console.error('Get activity feed error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
