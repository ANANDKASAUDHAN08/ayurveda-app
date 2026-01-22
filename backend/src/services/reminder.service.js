const cron = require('node-cron');
const db = require('../config/database');
const emailService = require('./email.service');
const NotificationController = require('../controllers/notification.controller');

const initReminderCron = () => {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        try {
            const now = new Date();
            const appUrl = process.env.APP_URL || 'http://localhost:4200';

            // 1. Check for 1 Hour Reminders
            // Appointments starting between 50 and 70 minutes from now
            const [reminders1h] = await db.execute(`
                SELECT a.*, u.email as patient_email, u.name as patient_name, d.name as doctor_name
                FROM appointments a
                JOIN users u ON a.user_id = u.id
                JOIN doctors d ON a.doctor_id = d.id
                WHERE a.status = 'confirmed'
                  AND a.reminder_1h_sent = FALSE
                  AND a.appointment_date = CURDATE()
                  AND a.start_time <= TIME_FORMAT(ADDTIME(NOW(), '01:10:00'), '%H:%i:%s')
                  AND a.start_time >= TIME_FORMAT(ADDTIME(NOW(), '00:50:00'), '%H:%i:%s')
            `);

            for (const apt of reminders1h) {
                try {
                    // Send In-App Notification
                    await NotificationController.createNotification({
                        user_id: apt.user_id,
                        type: 'appointment_reminder',
                        category: 'appointment',
                        title: 'Appointment in 1 Hour 🕑',
                        message: `Reminder: Your consultation with Dr. ${apt.doctor_name} starts in 1 hour.`,
                        related_id: apt.id,
                        related_type: 'appointment',
                        action_url: '/my-appointments'
                    });

                    // Mark as sent
                    await db.execute('UPDATE appointments SET reminder_1h_sent = TRUE WHERE id = ?', [apt.id]);
                    console.log(`✅ 1h Reminder sent to ${apt.patient_email} for #${apt.id}`);
                } catch (err) {
                    console.error(`❌ Failed to send 1h reminder for apt #${apt.id}:`, err.message);
                }
            }

            // 2. Check for 30 Minute Reminders
            const [reminders30m] = await db.execute(`
                SELECT a.*, u.email as patient_email, u.name as patient_name, d.name as doctor_name
                FROM appointments a
                JOIN users u ON a.user_id = u.id
                JOIN doctors d ON a.doctor_id = d.id
                WHERE a.status = 'confirmed'
                  AND a.reminder_30m_sent = FALSE
                  AND a.appointment_date = CURDATE()
                  AND a.start_time <= TIME_FORMAT(ADDTIME(NOW(), '00:40:00'), '%H:%i:%s')
                  AND a.start_time >= TIME_FORMAT(ADDTIME(NOW(), '00:20:00'), '%H:%i:%s')
            `);

            for (const apt of reminders30m) {
                try {
                    // Send In-App Notification
                    await NotificationController.createNotification({
                        user_id: apt.user_id,
                        type: 'appointment_reminder',
                        category: 'appointment',
                        title: 'Appointment in 30 Minutes! ⚡',
                        message: `Quick reminder: Your session with Dr. ${apt.doctor_name} starts in just 30 minutes. Get ready!`,
                        related_id: apt.id,
                        related_type: 'appointment',
                        action_url: '/my-appointments'
                    });

                    // Mark as sent
                    await db.execute('UPDATE appointments SET reminder_30m_sent = TRUE WHERE id = ?', [apt.id]);
                    console.log(`✅ 30m Reminder sent to ${apt.patient_email} for #${apt.id}`);
                } catch (err) {
                    console.error(`❌ Failed to send 30m reminder for apt #${apt.id}:`, err.message);
                }
            }

        } catch (error) {
            console.error('❌ Reminder Cron Error:', error);
        }
    });
};

module.exports = { initReminderCron };
