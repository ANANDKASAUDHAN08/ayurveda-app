const db = require('../config/database');
const Razorpay = require('razorpay');
const googleMeetService = require('../services/googleCalendarService');
const emailService = require('../services/email.service');
const NotificationController = require('./notification.controller');

/**
 * Video Consultancy Appointments Controller
 * Handles booking, payment, and video session management
 */

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order for consultation payment
exports.createPaymentOrder = async (req, res) => {
    try {
        const { doctor_id, amount } = req.body;

        if (!doctor_id || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Doctor ID and amount are required'
            });
        }

        // Verify doctor and get consultation fee
        let query = 'SELECT id, name, consultationFee, isVerified FROM doctors WHERE id = ?';
        if (process.env.NODE_ENV !== 'development') {
            query += ' AND isVerified = 1';
        }

        const [doctors] = await db.execute(query, [doctor_id]);

        if (doctors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        const doctor = doctors[0];

        // If in development, we might still want to know if they were skipped due to verification
        if (process.env.NODE_ENV !== 'development' && !doctor.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Doctor is not verified'
            });
        }

        // Verify amount matches consultation fee
        if (parseFloat(amount) !== parseFloat(doctor.consultationFee)) {
            return res.status(400).json({
                success: false,
                message: 'Amount does not match consultation fee'
            });
        }

        // Create Razorpay order
        const options = {
            amount: Math.round(amount * 100), // Convert to paise
            currency: 'INR',
            receipt: `consult_${Date.now()}`,
            notes: {
                doctor_id: doctor_id,
                doctor_name: doctor.name,
                type: 'video_consultation'
            }
        };

        const order = await razorpay.orders.create(options);

        res.json({
            success: true,
            data: {
                order_id: order.id,
                amount: order.amount,
                currency: order.currency,
                doctor: {
                    id: doctor.id,
                    name: doctor.name,
                    fee: doctor.consultationFee
                }
            }
        });

    } catch (error) {
        console.error('Error creating payment order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment order',
            error: error.message
        });
    }
};

// Book appointment with payment
exports.bookAppointment = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            doctor_id,
            slot_id,
            appointment_date,
            start_time,
            end_time,
            patient_age,
            patient_gender,
            reason,
            payment_id,
            order_id,
            amount,
            consultation_type = 'video'
        } = req.body;

        // Validate required fields
        if (!doctor_id || !appointment_date || !start_time || !end_time || !payment_id || !order_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Verify payment with Razorpay
        try {
            const payment = await razorpay.payments.fetch(payment_id);

            if (payment.status !== 'captured' && payment.status !== 'authorized') {
                return res.status(400).json({
                    success: false,
                    message: 'Payment not successful'
                });
            }

            if (payment.order_id !== order_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Payment order mismatch'
                });
            }
        } catch (paymentError) {
            console.error('Payment verification error details:', paymentError);
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed: ' + paymentError.message
            });
        }

        // Check if slot is still available
        const dbStartTime = start_time.length === 5 ? `${start_time}:00` : start_time;
        const [existingAppointments] = await db.execute(
            `SELECT id FROM appointments 
            WHERE doctor_id = ? 
              AND appointment_date = ? 
              AND start_time = ?
              AND status NOT IN ('cancelled')`,
            [doctor_id, appointment_date, dbStartTime]
        );

        if (existingAppointments.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This slot is no longer available'
            });
        }

        // Get doctor's medicine type
        const [doctors] = await db.execute(
            'SELECT medicine_type FROM doctors WHERE id = ?',
            [doctor_id]
        );

        if (doctors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        const medicine_type = doctors[0].medicine_type || 'allopathy';

        // Create appointment
        const [result] = await db.execute(
            `INSERT INTO appointments (
                user_id, doctor_id, slot_id, appointment_date, start_time, end_time,
                status, medicine_type, patient_age, patient_gender, reason,
                payment_id, payment_status, amount, consultation_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId, doctor_id, slot_id || null, appointment_date, start_time, end_time,
                'confirmed', medicine_type, patient_age, patient_gender, reason,
                payment_id, 'paid', amount, consultation_type
            ]
        );

        const appointmentId = result.insertId;

        // Create video session entry
        if (consultation_type === 'video') {
            // Get data for meeting creation
            const [details] = await db.execute(
                `SELECT a.*, d.name as doctor_name, u_p.name as patient_name, u_p.email as patient_email, u_d.email as doctor_email
                 FROM appointments a
                 JOIN doctors d ON a.doctor_id = d.id
                 JOIN users u_p ON a.user_id = u_p.id
                 LEFT JOIN users u_d ON d.userId = u_d.id
                 WHERE a.id = ?`,
                [appointmentId]
            );

            let meetingLink = null;
            if (details.length > 0) {
                const aptDetails = details[0];
                aptDetails.emails = [aptDetails.patient_email];
                if (aptDetails.doctor_email) {
                    aptDetails.emails.push(aptDetails.doctor_email);
                }
                meetingLink = await googleMeetService.createMeeting(aptDetails);
            }

            await db.execute(
                `INSERT INTO video_sessions (appointment_id, status, meeting_link, meeting_platform)
                VALUES (?, 'waiting', ?, ?)`,
                [appointmentId, meetingLink, meetingLink ? 'google_meet' : 'custom']
            );

            // Send Confirmation Email & In-App Notification
            if (details.length > 0) {
                const apt = details[0];
                try {
                    // 1. Email
                    await emailService.sendAppointmentConfirmation({
                        to: apt.patient_email,
                        patientName: apt.patient_name,
                        doctorName: apt.doctor_name,
                        date: new Date(apt.appointment_date).toLocaleDateString(),
                        time: apt.start_time,
                        type: 'video'
                    });

                    // 2. Notification
                    await NotificationController.createNotification({
                        user_id: userId,
                        type: 'appointment_confirmed',
                        category: 'appointment',
                        title: 'Appointment Booked! ✅',
                        message: `Your video consultation with Dr. ${apt.doctor_name} on ${new Date(apt.appointment_date).toLocaleDateString()} at ${apt.start_time} is confirmed.`,
                        related_id: appointmentId,
                        related_type: 'appointment',
                        action_url: '/my-appointments'
                    });
                } catch (err) {
                    console.error('Notification Error:', err.message);
                }
            }
        }

        // Mark slot as booked if it's a specific slot
        if (slot_id) {
            await db.execute(
                'UPDATE appointment_slots SET is_booked = 1 WHERE id = ?',
                [slot_id]
            );
        }

        // Fetch created appointment with doctor details
        const [appointments] = await db.execute(
            `SELECT 
                a.*,
                d.name as doctor_name,
                d.specialization,
                d.image as doctor_image,
                u.name as patient_name
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users u ON a.user_id = u.id
            WHERE a.id = ?`,
            [appointmentId]
        );

        res.json({
            success: true,
            message: 'Appointment booked successfully',
            data: appointments[0]
        });

    } catch (error) {
        console.error('Error booking appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to book appointment',
            error: error.message
        });
    }
};

// Get user's appointments
exports.getUserAppointments = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, type, page = 1, limit = 10 } = req.query;

        let whereConditions = ['a.user_id = ?'];
        let queryParams = [userId];

        // Filter by status
        if (status) {
            whereConditions.push('a.status = ?');
            queryParams.push(status);
        }

        // Calculate current IST date and time
        const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const istDate = nowIST.toISOString().split('T')[0];
        const istTime = nowIST.toTimeString().split(' ')[0]; // HH:mm:ss

        // Filter by type (upcoming/past) - only if explicitly provided
        if (type === 'upcoming') {
            whereConditions.push('(a.appointment_date > ? OR (a.appointment_date = ? AND a.start_time > ?))');
            queryParams.push(istDate, istDate, istTime);
        } else if (type === 'past') {
            whereConditions.push('(a.appointment_date < ? OR (a.appointment_date = ? AND a.start_time <= ?))');
            queryParams.push(istDate, istDate, istTime);
        }

        const whereClause = whereConditions.join(' AND ');
        const parsedLimit = parseInt(limit) || 10;
        const parsedPage = parseInt(page) || 1;
        const parsedOffset = (parsedPage - 1) * parsedLimit;

        // Get total count
        const [countResult] = await db.execute(
            `SELECT COUNT(*) as total FROM appointments a WHERE ${whereClause}`,
            queryParams
        );
        const total = countResult[0].total;


        // Get appointments
        const [appointments] = await db.execute(
            `SELECT 
                a.*,
                d.name as doctor_name,
                d.specialization,
                d.image as doctor_image,
                d.clinic_name,
                vs.id as video_session_id,
                vs.status as video_status,
                vs.meeting_link,
                vs.meeting_platform
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            LEFT JOIN video_sessions vs ON a.id = vs.appointment_id
            WHERE ${whereClause}
            ORDER BY a.appointment_date DESC, a.start_time DESC
            LIMIT ${parsedLimit} OFFSET ${parsedOffset}`,
            queryParams  // Only WHERE params, not limit/offset
        );

        // Format dates to prevent UTC timezone shift
        const formattedAppointments = appointments.map(apt => {
            if (apt.appointment_date instanceof Date) {
                const year = apt.appointment_date.getFullYear();
                const month = String(apt.appointment_date.getMonth() + 1).padStart(2, '0');
                const day = String(apt.appointment_date.getDate()).padStart(2, '0');
                apt.appointment_date = `${year}-${month}-${day}`;
            }
            return apt;
        });

        res.json({
            success: true,
            data: formattedAppointments,
            pagination: {
                total,
                page: parsedPage,
                limit: parsedLimit,
                totalPages: Math.ceil(total / parsedLimit)
            }
        });

    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch appointments',
            error: error.message
        });
    }
};

// Get single appointment details
exports.getAppointmentById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const [appointments] = await db.execute(
            `SELECT 
                a.*,
                d.name as doctor_name,
                d.specialization,
                d.image as doctor_image,
                d.clinic_name,
                d.qualifications,
                d.experience,
                u.name as patient_name,
                u.email as patient_email,
                vs.id as video_session_id,
                vs.status as video_status,
                vs.started_at,
                vs.ended_at,
                vs.meeting_link,
                vs.meeting_platform
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users u ON a.user_id = u.id
            LEFT JOIN video_sessions vs ON a.id = vs.appointment_id
            WHERE a.id = ? AND a.user_id = ?`,
            [id, userId]
        );

        const appointment = appointments[0];

        // --- Meeting Link Security Logic ---
        // Only show meeting link 15 mins before and until the end of session
        if (appointment.meeting_link) {
            const now = new Date();
            const aptDate = new Date(appointment.appointment_date);
            const [hours, minutes] = appointment.start_time.split(':');
            const [endHours, endMinutes] = appointment.end_time.split(':');

            const startLimit = new Date(aptDate);
            startLimit.setHours(parseInt(hours), parseInt(minutes) - 15, 0); // 15 mins early

            const endLimit = new Date(aptDate);
            endLimit.setHours(parseInt(endHours), parseInt(endMinutes) + 15, 0); // 15 mins buffer after

            if (now < startLimit || now > endLimit) {
                // Not the right time, hide the link
                appointment.meeting_link = null;
                appointment.link_status = 'hidden';
                appointment.link_message = 'Link will be available 15 minutes before the session starts.';
            } else {
                appointment.link_status = 'available';
            }
        }

        res.json({
            success: true,
            data: appointment
        });

    } catch (error) {
        console.error('Error fetching appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch appointment',
            error: error.message
        });
    }
};

// Cancel appointment
exports.cancelAppointment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { reason } = req.body;

        // Get appointment
        const [appointments] = await db.execute(
            'SELECT * FROM appointments WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (appointments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        const appointment = appointments[0];

        // Check if appointment can be cancelled
        if (appointment.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Appointment is already cancelled'
            });
        }

        if (appointment.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel completed appointment'
            });
        }

        // Update appointment status
        await db.execute(
            `UPDATE appointments 
            SET status = 'cancelled', notes = CONCAT(COALESCE(notes, ''), '\nCancellation reason: ', ?)
            WHERE id = ?`,
            [reason || 'No reason provided', id]
        );

        // TODO: Initiate refund if payment was made
        // This would involve Razorpay refund API

        res.json({
            success: true,
            message: 'Appointment cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel appointment',
            error: error.message
        });
    }
};

// Add review after consultation
exports.addReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { appointment_id, doctor_id, rating, review } = req.body;

        if (!appointment_id || !doctor_id || !rating) {
            return res.status(400).json({
                success: false,
                message: 'Appointment ID, doctor ID, and rating are required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Verify appointment exists and belongs to user
        const [appointments] = await db.execute(
            `SELECT id FROM appointments 
            WHERE id = ? AND user_id = ? AND doctor_id = ? AND status = 'completed'`,
            [appointment_id, userId, doctor_id]
        );

        if (appointments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found or not completed'
            });
        }

        // Check if review already exists
        const [existingReviews] = await db.execute(
            'SELECT id FROM doctor_reviews WHERE appointment_id = ? AND user_id = ?',
            [appointment_id, userId]
        );

        if (existingReviews.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this consultation'
            });
        }

        // Insert review
        await db.execute(
            `INSERT INTO doctor_reviews (doctor_id, user_id, appointment_id, rating, review)
            VALUES (?, ?, ?, ?, ?)`,
            [doctor_id, userId, appointment_id, rating, review]
        );

        // Update doctor's average rating
        const [ratingResult] = await db.execute(
            `SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
            FROM doctor_reviews WHERE doctor_id = ?`,
            [doctor_id]
        );

        await db.execute(
            'UPDATE doctors SET rating = ?, total_consultations = total_consultations + 1 WHERE id = ?',
            [ratingResult[0].avg_rating, doctor_id]
        );

        res.json({
            success: true,
            message: 'Review added successfully'
        });

    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add review',
            error: error.message
        });
    }
};
