const db = require('../config/database');
const emailService = require('../services/email.service');

class DoctorRefillController {
    /**
     * GET /api/doctor/refills
     * Get all refill requests for the logged-in doctor
     */
    static async getDoctorRefills(req, res) {
        try {
            const userId = req.user.id;
            const { status, patient, sortBy = 'requested_at', order = 'desc', limit = 20, offset = 0 } = req.query;

            // Get doctor_id from user
            const [doctors] = await db.query('SELECT id FROM doctors WHERE userId = ?', [userId]);

            if (doctors.length === 0) {
                return res.status(403).json({ error: 'Not authorized as doctor' });
            }

            const doctorId = doctors[0].id;

            // Build query
            let query = `
                SELECT 
                    r.*,
                    p.id as prescription_id,
                    u.name as patient_name,
                    u.email as patient_email,
                    approver.name as approved_by_name,
                    GROUP_CONCAT(pm.medicine_name) as medicines
                FROM prescription_refills r
                JOIN prescriptions p ON r.original_prescription_id = p.id
                JOIN users u ON r.requested_by = u.id
                LEFT JOIN users approver ON r.approved_by = approver.id
                LEFT JOIN prescription_medicines pm ON p.id = pm.prescription_id
                WHERE p.doctor_id = ?
            `;

            const params = [doctorId];

            // Add filters
            if (status && status !== 'all') {
                query += ' AND r.status = ?';
                params.push(status);
            }

            if (patient) {
                query += ' AND u.name LIKE ?';
                params.push(`%${patient}%`);
            }

            // Group by refill
            query += ' GROUP BY r.id';

            // Add sorting
            const validSortFields = ['requested_at', 'status', 'patient_name'];
            const sortField = validSortFields.includes(sortBy) ? sortBy : 'requested_at';
            const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

            if (sortBy === 'patient_name') {
                query += ` ORDER BY u.name ${sortOrder}`;
            } else {
                query += ` ORDER BY r.${sortField} ${sortOrder}`;
            }

            // Add pagination
            query += ' LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const [refills] = await db.query(query, params);

            // Get statistics
            const [stats] = await db.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
                    SUM(CASE WHEN r.status = 'approved' AND DATE(r.approved_at) = CURDATE() THEN 1 ELSE 0 END) as approved_today,
                    SUM(CASE WHEN r.status = 'rejected' AND DATE(r.rejected_at) = CURDATE() THEN 1 ELSE 0 END) as rejected_today
                FROM prescription_refills r
                JOIN prescriptions p ON r.original_prescription_id = p.id
                WHERE p.doctor_id = ?
            `, [doctorId]);

            res.json({
                refills,
                total: stats[0].total,
                pending_count: stats[0].pending_count,
                approved_today: stats[0].approved_today,
                rejected_today: stats[0].rejected_today
            });
        } catch (error) {
            console.error('Error fetching doctor refills:', error);
            res.status(500).json({ error: 'Failed to fetch refills' });
        }
    }

    /**
     * GET /api/doctor/refills/:id/details
     * Get detailed refill information with patient history
     */
    static async getRefillDetails(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Get doctor_id
            const [doctors] = await db.query('SELECT id FROM doctors WHERE userId = ?', [userId]);
            if (doctors.length === 0) {
                return res.status(403).json({ error: 'Not authorized as doctor' });
            }
            const doctorId = doctors[0].id;

            // Get refill details
            const [refills] = await db.query(`
                SELECT 
                    r.*,
                    p.*,
                    u.name as patient_name,
                    u.email as patient_email,
                    u.phone as patient_phone,
                    approver.name as approved_by_name
                FROM prescription_refills r
                JOIN prescriptions p ON r.original_prescription_id = p.id
                JOIN users u ON r.requested_by = u.id
                LEFT JOIN users approver ON r.approved_by = approver.id
                WHERE r.id = ? AND p.doctor_id = ?
            `, [id, doctorId]);

            if (refills.length === 0) {
                return res.status(404).json({ error: 'Refill not found' });
            }

            const refill = refills[0];

            // Get medicines
            const [medicines] = await db.query(
                'SELECT * FROM prescription_medicines WHERE prescription_id = ?',
                [refill.original_prescription_id]
            );
            refill.medicines = medicines;

            // Get patient refill history
            const [refillHistory] = await db.query(`
                SELECT r.*, p.issue_date
                FROM prescription_refills r
                JOIN prescriptions p ON r.original_prescription_id = p.id
                WHERE r.requested_by = ? AND r.id != ?
                ORDER BY r.requested_at DESC
                LIMIT 5
            `, [refill.requested_by, id]);
            refill.patient_refill_history = refillHistory;

            // Get patient prescription count
            const [prescriptionCount] = await db.query(`
                SELECT COUNT(*) as count
                FROM prescriptions
                WHERE user_id = ? AND doctor_id = ?
            `, [refill.requested_by, doctorId]);
            refill.patient_prescription_count = prescriptionCount[0].count;

            res.json(refill);
        } catch (error) {
            console.error('Error fetching refill details:', error);
            res.status(500).json({ error: 'Failed to fetch refill details' });
        }
    }

    /**
     * POST /api/doctor/refills/bulk-approve
     * Approve multiple refills at once
     */
    static async bulkApproveRefills(req, res) {
        try {
            const userId = req.user.id;
            const { refill_ids, doctor_notes } = req.body;

            if (!refill_ids || !Array.isArray(refill_ids) || refill_ids.length === 0) {
                return res.status(400).json({ error: 'refill_ids array is required' });
            }

            if (refill_ids.length > 50) {
                return res.status(400).json({ error: 'Cannot approve more than 50 refills at once' });
            }

            // Get doctor_id
            const [doctors] = await db.query('SELECT id FROM doctors WHERE userId = ?', [userId]);
            if (doctors.length === 0) {
                return res.status(403).json({ error: 'Not authorized as doctor' });
            }
            const doctorId = doctors[0].id;

            // Get refills and verify they belong to this doctor
            const placeholders = refill_ids.map(() => '?').join(',');
            const [refills] = await db.query(`
                SELECT r.*, p.user_id as patient_id, u.name as patient_name, u.email as patient_email
                FROM prescription_refills r
                JOIN prescriptions p ON r.original_prescription_id = p.id
                JOIN users u ON p.user_id = u.id
                WHERE r.id IN (${placeholders}) AND p.doctor_id = ? AND r.status = 'pending'
            `, [...refill_ids, doctorId]);

            if (refills.length === 0) {
                return res.status(404).json({ error: 'No valid pending refills found' });
            }

            // Approve all refills
            await db.query(`
                UPDATE prescription_refills 
                SET status = 'approved',
                    approved_by = ?,
                    approved_at = NOW(),
                    doctor_notes = ?
                WHERE id IN (${placeholders})
            `, [userId, doctor_notes || null, ...refill_ids]);

            // Create notifications and send emails
            for (const refill of refills) {
                // Create notification
                await db.query(
                    `INSERT INTO refill_notifications (refill_id, recipient_id, notification_type)
                     VALUES (?, ?, 'approval')`,
                    [refill.id, refill.patient_id]
                );

                // Send email
                if (refill.patient_email) {
                    try {
                        await DoctorRefillController.sendApprovalEmail({
                            patientEmail: refill.patient_email,
                            patientName: refill.patient_name,
                            prescriptionId: refill.original_prescription_id,
                            doctorNotes: doctor_notes,
                            refillId: refill.id
                        });
                    } catch (emailError) {
                        console.error('Failed to send email:', emailError);
                    }
                }
            }

            res.json({
                success: true,
                message: `${refills.length} refill(s) approved successfully`,
                approved_count: refills.length
            });
        } catch (error) {
            console.error('Error bulk approving refills:', error);
            res.status(500).json({ error: 'Failed to approve refills' });
        }
    }

    /**
     * POST /api/doctor/refills/bulk-reject
     * Reject multiple refills at once
     */
    static async bulkRejectRefills(req, res) {
        try {
            const userId = req.user.id;
            const { refill_ids, rejection_reason } = req.body;

            if (!refill_ids || !Array.isArray(refill_ids) || refill_ids.length === 0) {
                return res.status(400).json({ error: 'refill_ids array is required' });
            }

            if (!rejection_reason) {
                return res.status(400).json({ error: 'rejection_reason is required' });
            }

            if (refill_ids.length > 50) {
                return res.status(400).json({ error: 'Cannot reject more than 50 refills at once' });
            }

            // Get doctor_id
            const [doctors] = await db.query('SELECT id FROM doctors WHERE userId = ?', [userId]);
            if (doctors.length === 0) {
                return res.status(403).json({ error: 'Not authorized as doctor' });
            }
            const doctorId = doctors[0].id;

            // Get refills
            const placeholders = refill_ids.map(() => '?').join(',');
            const [refills] = await db.query(`
                SELECT r.*, p.user_id as patient_id, u.name as patient_name, u.email as patient_email
                FROM prescription_refills r
                JOIN prescriptions p ON r.original_prescription_id = p.id
                JOIN users u ON p.user_id = u.id
                WHERE r.id IN (${placeholders}) AND p.doctor_id = ? AND r.status = 'pending'
            `, [...refill_ids, doctorId]);

            if (refills.length === 0) {
                return res.status(404).json({ error: 'No valid pending refills found' });
            }

            // Reject all refills
            await db.query(`
                UPDATE prescription_refills 
                SET status = 'rejected',
                    rejected_reason = ?,
                    rejected_at = NOW()
                WHERE id IN (${placeholders})
            `, [rejection_reason, ...refill_ids]);

            // Create notifications and send emails
            for (const refill of refills) {
                // Create notification
                await db.query(
                    `INSERT INTO refill_notifications (refill_id, recipient_id, notification_type)
                     VALUES (?, ?, 'rejection')`,
                    [refill.id, refill.patient_id]
                );

                // Send email
                if (refill.patient_email) {
                    try {
                        await DoctorRefillController.sendRejectionEmail({
                            patientEmail: refill.patient_email,
                            patientName: refill.patient_name,
                            prescriptionId: refill.original_prescription_id,
                            rejectionReason: rejection_reason,
                            refillId: refill.id
                        });
                    } catch (emailError) {
                        console.error('Failed to send email:', emailError);
                    }
                }
            }

            res.json({
                success: true,
                message: `${refills.length} refill(s) rejected`,
                rejected_count: refills.length
            });
        } catch (error) {
            console.error('Error bulk rejecting refills:', error);
            res.status(500).json({ error: 'Failed to reject refills' });
        }
    }

    /**
     * GET /api/doctor/refills/stats
     * Get dashboard statistics
     */
    static async getRefillStats(req, res) {
        try {
            const userId = req.user.id;

            // Get doctor_id
            const [doctors] = await db.query('SELECT id FROM doctors WHERE userId = ?', [userId]);
            if (doctors.length === 0) {
                return res.status(403).json({ error: 'Not authorized as doctor' });
            }
            const doctorId = doctors[0].id;

            const [stats] = await db.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
                    SUM(CASE WHEN r.status = 'approved' AND DATE(r.approved_at) = CURDATE() THEN 1 ELSE 0 END) as approved_today,
                    SUM(CASE WHEN r.status = 'rejected' AND DATE(r.rejected_at) = CURDATE() THEN 1 ELSE 0 END) as rejected_today,
                    SUM(CASE WHEN r.status = 'pending' AND TIMESTAMPDIFF(HOUR, r.requested_at, NOW()) > 24 THEN 1 ELSE 0 END) as urgent_count
                FROM prescription_refills r
                JOIN prescriptions p ON r.original_prescription_id = p.id
                WHERE p.doctor_id = ?
            `, [doctorId]);

            res.json({
                total: stats[0].total,
                pending_count: stats[0].pending_count,
                approved_today: stats[0].approved_today,
                rejected_today: stats[0].rejected_today,
                urgent_count: stats[0].urgent_count
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
            res.status(500).json({ error: 'Failed to fetch statistics' });
        }
    }

    // Email helper methods
    static async sendApprovalEmail(data) {
        const { patientEmail, patientName, prescriptionId, doctorNotes, refillId } = data;

        const html = `
            <h2>✅ Refill Request Approved</h2>
            <p>Hello ${patientName},</p>
            <p>Great news! Your refill request for prescription #${prescriptionId} has been <strong>approved</strong> by your doctor.</p>
            ${doctorNotes ? `<p><strong>Doctor's Notes:</strong> ${doctorNotes}</p>` : ''}
            <p>You can now pick up your medicines from your preferred pharmacy.</p>
            <p><a href="${process.env.FRONTEND_URL}/user/prescriptions/${prescriptionId}" style="display: inline-block; padding: 10px 20px; background-color: #10B981; color: white; text-decoration: none; border-radius: 5px;">View Prescription</a></p>
            <p>Thank you for using HealthConnect!</p>
        `;

        return await emailService.sendEmail({
            to: patientEmail,
            subject: '✅ Refill Request Approved',
            html
        });
    }

    static async sendRejectionEmail(data) {
        const { patientEmail, patientName, prescriptionId, rejectionReason, refillId } = data;

        const html = `
            <h2>Refill Request Update</h2>
            <p>Hello ${patientName},</p>
            <p>Your refill request for prescription #${prescriptionId} requires attention from your doctor.</p>
            <p><strong>Doctor's Response:</strong> ${rejectionReason}</p>
            <p>Please contact your doctor's office for further guidance or to schedule an appointment.</p>
            <p><a href="${process.env.FRONTEND_URL}/user/prescriptions/${prescriptionId}" style="display: inline-block; padding: 10px 20px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 5px;">View Details</a></p>
        `;

        return await emailService.sendEmail({
            to: patientEmail,
            subject: 'Refill Request Update',
            html
        });
    }
}

module.exports = DoctorRefillController;
