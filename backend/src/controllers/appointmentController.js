const db = require('../config/database');
const NotificationController = require('./notification.controller');

exports.bookAppointment = async (req, res) => {
    try {
        const { slotId, type, otp } = req.body;
        const userId = req.user.id;

        if (otp !== '1234') {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Find slot
        const [slots] = await db.execute('SELECT * FROM slots WHERE id = ?', [slotId]);
        if (slots.length === 0) return res.status(404).json({ message: 'Slot not found' });

        const slot = slots[0];

        if (slot.isBooked) return res.status(400).json({ message: 'Slot already booked' });

        // Verify lock
        const now = new Date();
        if (slot.lockedBy !== userId || (slot.lockedUntil && new Date(slot.lockedUntil) < now)) {
            if (slot.lockedUntil && new Date(slot.lockedUntil) > now && slot.lockedBy !== userId) {
                return res.status(400).json({ message: 'Slot lock expired or invalid' });
            }
        }

        // Create Appointment
        const [apptResult] = await db.execute(
            'INSERT INTO appointments (userId, doctorId, slotId, patientName, date, time, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, slot.doctorId, slotId, req.user.name || 'Patient', slot.startTime, new Date(slot.startTime).toLocaleTimeString(), 'booked']
        );
        const appointmentId = apptResult.insertId;

        // Update Slot
        await db.execute(
            'UPDATE slots SET isBooked = TRUE, lockedUntil = NULL, lockedBy = NULL WHERE id = ?',
            [slotId]
        );

        // Get doctor info for notification
        const [doctors] = await db.execute('SELECT name FROM doctors WHERE id = ?', [slot.doctorId]);
        const doctorName = doctors[0]?.name || 'Doctor';

        // Send appointment confirmation notification to user
        try {
            await NotificationController.createNotification({
                user_id: userId,
                type: 'appointment_booked',
                category: 'appointments',
                title: 'Appointment Booked Successfully!',
                message: `Your appointment with Dr. ${doctorName} has been confirmed for ${new Date(slot.startTime).toLocaleDateString()} at ${new Date(slot.startTime).toLocaleTimeString()}.`,
                related_id: appointmentId,
                related_type: 'appointment',
                action_url: `/appointments/${appointmentId}`,
                priority: 'normal'
            });
        } catch (notifError) {
            console.error('Failed to create appointment notification:', notifError.message);
        }

        res.json({
            message: 'Appointment booked successfully',
            appointment: { id: appointmentId, userId, doctorId: slot.doctorId, slotId, status: 'booked' }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMyAppointments = async (req, res) => {
    try {
        const userId = req.user.id;

        const query = `
            SELECT a.*, 
                   d.name as doctorName, d.specialization, d.image as doctorImage,
                   s.startTime, s.endTime
            FROM appointments a
            JOIN doctors d ON a.doctorId = d.id
            JOIN slots s ON a.slotId = s.id
            WHERE a.userId = ?
            ORDER BY a.createdAt DESC
        `;

        const [rows] = await db.execute(query, [userId]);

        // Format response to match previous structure if needed, or return flat
        // The frontend likely expects nested objects based on previous Sequelize 'include'
        const appointments = rows.map(row => ({
            id: row.id,
            userId: row.userId,
            doctorId: row.doctorId,
            slotId: row.slotId,
            status: row.status,
            date: row.date,
            time: row.time,
            createdAt: row.createdAt,
            Doctor: {
                name: row.doctorName,
                specialization: row.specialization,
                image: row.doctorImage
            },
            Slot: {
                startTime: row.startTime,
                endTime: row.endTime
            }
        }));

        res.json(appointments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [appointments] = await db.execute(
            'SELECT * FROM appointments WHERE id = ? AND userId = ?',
            [id, userId]
        );

        if (appointments.length === 0) return res.status(404).json({ message: 'Appointment not found' });

        const appointment = appointments[0];

        // Check time constraint
        const [slots] = await db.execute('SELECT * FROM slots WHERE id = ?', [appointment.slotId]);
        const slot = slots[0];

        const now = new Date();
        const slotTime = new Date(slot.startTime);
        const hoursDiff = (slotTime - now) / 36e5;

        if (hoursDiff < 24) {
            return res.status(400).json({ message: 'Cannot cancel within 24 hours' });
        }

        // Update Appointment
        await db.execute('UPDATE appointments SET status = ? WHERE id = ?', ['cancelled', id]);

        // Free Slot
        await db.execute('UPDATE slots SET isBooked = FALSE WHERE id = ?', [appointment.slotId]);

        // Get doctor info for notification
        const [doctors] = await db.execute('SELECT name FROM doctors WHERE id = ?', [appointment.doctorId]);
        const doctorName = doctors[0]?.name || 'Doctor';

        // Send cancellation notification
        try {
            await NotificationController.createNotification({
                user_id: userId,
                type: 'appointment_cancelled',
                category: 'appointments',
                title: 'Appointment Cancelled',
                message: `Your appointment with Dr. ${doctorName} scheduled for ${new Date(slot.startTime).toLocaleDateString()} has been cancelled.`,
                related_id: id,
                related_type: 'appointment',
                priority: 'normal'
            });
        } catch (notifError) {
            console.error('Failed to create cancellation notification:', notifError.message);
        }

        res.json({ message: 'Appointment cancelled' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get appointment statistics for a user
exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Get total consultations (completed appointments)
        const [totalResult] = await db.execute(`
            SELECT COUNT(*) as total 
            FROM appointments 
            WHERE ${userRole === 'doctor' ? 'doctor_id' : 'user_id'} = ? 
            AND status = 'completed'
        `, [userId]);

        // Get upcoming appointments
        const [upcomingResult] = await db.execute(`
            SELECT COUNT(*) as upcoming 
            FROM appointments 
            WHERE ${userRole === 'doctor' ? 'doctor_id' : 'user_id'} = ? 
            AND status IN ('pending', 'booked', 'confirmed') 
            AND appointment_date >= CURDATE()
        `, [userId]);

        // Get consultations completed this month
        const [monthResult] = await db.execute(`
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
        const [appointments] = await db.execute(`
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
                date: appt.createdAt,
                icon: appt.status === 'completed' ? 'fa-calendar-check' :
                    (appt.status === 'booked' || appt.status === 'confirmed') ? 'fa-calendar' : 'fa-calendar-times'
            });
        }

        // Get user's timestamps
        const [user] = await db.execute(`
            SELECT createdAt as created_at, updatedAt as updated_at 
            FROM users 
            WHERE id = ?
        `, [userId]);

        if (user[0]) {
            // Add profile update activity
            if (user[0].updated_at) {
                activities.push({
                    type: 'profile_update',
                    title: 'Profile Updated',
                    description: 'Updated profile information',
                    date: user[0].updated_at,
                    icon: 'fa-user-edit'
                });
            }

            // Add account creation activity
            if (user[0].created_at) {
                activities.push({
                    type: 'account',
                    title: 'Account Created',
                    description: 'Welcome to HealthConnect!',
                    date: user[0].created_at,
                    icon: 'fa-user-plus'
                });
            }
        }

        // Sort by date descending
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json(activities);
    } catch (err) {
        console.error('Get activity feed error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
