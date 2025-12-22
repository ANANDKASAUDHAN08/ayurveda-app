const db = require('../config/database');
const emailService = require('../services/email.service');

class RefillController {
    /**
     * POST /api/prescriptions/:id/refills
     * Request a prescription refill
     */
    static async requestRefill(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const { reason, preferred_pharmacy, patient_notes } = req.body;

            // Check if prescription exists and belongs to user
            const [prescriptions] = await db.query(
                `SELECT p.*, d.name as doctor_name, d.email as doctor_email, u.name as patient_name
                 FROM prescriptions p
                 LEFT JOIN doctors d ON p.doctor_id = d.id
                 LEFT JOIN users u ON p.user_id = u.id
                 WHERE p.id = ? AND p.user_id = ?`,
                [id, userId]
            );

            if (prescriptions.length === 0) {
                return res.status(404).json({ error: 'Prescription not found' });
            }

            const prescription = prescriptions[0];

            // Check if there's already a pending refill request
            const [pendingRefills] = await db.query(
                `SELECT * FROM prescription_refills 
                 WHERE original_prescription_id = ? AND status = 'pending'`,
                [id]
            );

            if (pendingRefills.length > 0) {
                return res.status(400).json({
                    error: 'There is already a pending refill request for this prescription'
                });
            }

            // Create refill request
            const [result] = await db.query(
                `INSERT INTO prescription_refills 
                 (original_prescription_id, requested_by, reason, preferred_pharmacy, patient_notes)
                 VALUES (?, ?, ?, ?, ?)`,
                [id, userId, reason, preferred_pharmacy, patient_notes]
            );

            const refillId = result.insertId;

            // Create notification for patient
            await db.query(
                `INSERT INTO refill_notifications (refill_id, recipient_id, notification_type)
                 VALUES (?, ?, 'request')`,
                [refillId, userId]
            );

            // Send email notification to doctor if email exists
            if (prescription.doctor_email) {
                try {
                    await this.sendRefillRequestEmail({
                        doctorEmail: prescription.doctor_email,
                        doctorName: prescription.doctor_name,
                        patientName: prescription.patient_name,
                        prescriptionId: id,
                        reason,
                        refillId
                    });
                } catch (emailError) {
                    console.error('Failed to send refill request email:', emailError);
                }
            }

            res.status(201).json({
                success: true,
                message: 'Refill request submitted successfully',
                refill_id: refillId,
                status: 'pending'
            });
        } catch (error) {
            console.error('Error requesting refill:', error);
            res.status(500).json({ error: 'Failed to request refill' });
        }
    }

    /**
     * GET /api/refills
     * Get all refill requests for user (patient or doctor)
     */
    static async getRefills(req, res) {
        try {
            const userId = req.user.id;
            const { status, type } = req.query;

            let query = `
                SELECT r.*, 
                       p.id as prescription_id,
                       u.name as patient_name,
                       d.name as doctor_name,
                       approver.name as approved_by_name
                FROM prescription_refills r
                JOIN prescriptions p ON r.original_prescription_id = p.id
                JOIN users u ON r.requested_by = u.id
                LEFT JOIN doctors d ON p.doctor_id = d.id
                LEFT JOIN users approver ON r.approved_by = approver.id
                WHERE `;

            const params = [];

            if (type === 'patient') {
                query += 'r.requested_by = ?';
                params.push(userId);
            } else if (type === 'doctor') {
                query += 'p.doctor_id = (SELECT doctor_id FROM users WHERE id = ?)';
                params.push(userId);
            } else {
                query += '(r.requested_by = ? OR p.user_id = ?)';
                params.push(userId, userId);
            }

            if (status) {
                query += ' AND r.status = ?';
                params.push(status);
            }

            query += ' ORDER BY r.requested_at DESC';

            const [refills] = await db.query(query, params);
            res.json(refills);
        } catch (error) {
            console.error('Error fetching refills:', error);
            res.status(500).json({ error: 'Failed to fetch refills' });
        }
    }

    /**
     * GET /api/refills/:id
     * Get refill request details
     */
    static async getRefillById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const [refills] = await db.query(
                `SELECT r.*, 
                        p.*, 
                        u.name as patient_name, u.email as patient_email,
                        d.name as doctor_name,
                        approver.name as approved_by_name
                 FROM prescription_refills r
                 JOIN prescriptions p ON r.original_prescription_id = p.id
                 JOIN users u ON r.requested_by = u.id
                 LEFT JOIN doctors d ON p.doctor_id = d.id
                 LEFT JOIN users approver ON r.approved_by = approver.id
                 WHERE r.id = ? AND (r.requested_by = ? OR p.user_id = ?)`,
                [id, userId, userId]
            );

            if (refills.length === 0) {
                return res.status(404).json({ error: 'Refill request not found' });
            }

            const refill = refills[0];

            // Get medicines from original prescription
            const [medicines] = await db.query(
                'SELECT * FROM prescription_medicines WHERE prescription_id = ?',
                [refill.original_prescription_id]
            );

            refill.medicines = medicines;

            res.json(refill);
        } catch (error) {
            console.error('Error fetching refill details:', error);
            res.status(500).json({ error: 'Failed to fetch refill details' });
        }
    }

    /**
     * POST /api/refills/:id/approve
     * Approve refill request (Doctor only)
     */
    static async approveRefill(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const { doctor_notes, modifications } = req.body;

            // Get refill and verify doctor
            const [refills] = await db.query(
                `SELECT r.*, p.doctor_id, p.user_id as patient_id, u.name as patient_name, u.email as patient_email
                 FROM prescription_refills r
                 JOIN prescriptions p ON r.original_prescription_id = p.id
                 JOIN users u ON p.user_id = u.id
                 WHERE r.id = ?`,
                [id]
            );

            if (refills.length === 0) {
                return res.status(404).json({ error: 'Refill request not found' });
            }

            const refill = refills[0];

            // TODO: Verify user is the doctor for this prescription
            // For now, just check if status is pending
            if (refill.status !== 'pending') {
                return res.status(400).json({
                    error: `Cannot approve refill with status: ${refill.status}`
                });
            }

            // Update refill status
            await db.query(
                `UPDATE prescription_refills 
                 SET status = 'approved',
                     approved_by = ?,
                     approved_at = NOW(),
                     doctor_notes = ?,
                     modifications = ?
                 WHERE id = ?`,
                [userId, doctor_notes, JSON.stringify(modifications || {}), id]
            );

            // Create notification
            await db.query(
                `INSERT INTO refill_notifications (refill_id, recipient_id, notification_type)
                 VALUES (?, ?, 'approval')`,
                [id, refill.patient_id]
            );

            // Send approval email to patient
            if (refill.patient_email) {
                try {
                    await this.sendRefillApprovalEmail({
                        patientEmail: refill.patient_email,
                        patientName: refill.patient_name,
                        prescriptionId: refill.original_prescription_id,
                        doctorNotes: doctor_notes,
                        refillId: id
                    });
                } catch (emailError) {
                    console.error('Failed to send approval email:', emailError);
                }
            }

            res.json({
                success: true,
                message: 'Refill request approved successfully',
                status: 'approved'
            });
        } catch (error) {
            console.error('Error approving refill:', error);
            res.status(500).json({ error: 'Failed to approve refill' });
        }
    }

    /**
     * POST /api/refills/:id/reject
     * Reject refill request (Doctor only)
     */
    static async rejectRefill(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const { rejection_reason } = req.body;

            if (!rejection_reason) {
                return res.status(400).json({ error: 'Rejection reason is required' });
            }

            // Get refill details
            const [refills] = await db.query(
                `SELECT r.*, p.user_id as patient_id, u.name as patient_name, u.email as patient_email
                 FROM prescription_refills r
                 JOIN prescriptions p ON r.original_prescription_id = p.id
                 JOIN users u ON p.user_id = u.id
                 WHERE r.id = ?`,
                [id]
            );

            if (refills.length === 0) {
                return res.status(404).json({ error: 'Refill request not found' });
            }

            const refill = refills[0];

            if (refill.status !== 'pending') {
                return res.status(400).json({
                    error: `Cannot reject refill with status: ${refill.status}`
                });
            }

            // Update refill status
            await db.query(
                `UPDATE prescription_refills 
                 SET status = 'rejected',
                     rejected_reason = ?,
                     rejected_at = NOW()
                 WHERE id = ?`,
                [rejection_reason, id]
            );

            // Create notification
            await db.query(
                `INSERT INTO refill_notifications (refill_id, recipient_id, notification_type)
                 VALUES (?, ?, 'rejection')`,
                [id, refill.patient_id]
            );

            // Send rejection email
            if (refill.patient_email) {
                try {
                    await this.sendRefillRejectionEmail({
                        patientEmail: refill.patient_email,
                        patientName: refill.patient_name,
                        prescriptionId: refill.original_prescription_id,
                        rejectionReason: rejection_reason,
                        refillId: id
                    });
                } catch (emailError) {
                    console.error('Failed to send rejection email:', emailError);
                }
            }

            res.json({
                success: true,
                message: 'Refill request rejected',
                status: 'rejected'
            });
        } catch (error) {
            console.error('Error rejecting refill:', error);
            res.status(500).json({ error: 'Failed to reject refill' });
        }
    }

    /**
     * Send refill request email to doctor
     */
    static async sendRefillRequestEmail(data) {
        const { doctorEmail, doctorName, patientName, prescriptionId, reason, refillId } = data;

        const html = `
            <h2>New Refill Request</h2>
            <p>Hello Dr. ${doctorName},</p>
            <p><strong>${patientName}</strong> has requested a refill for prescription #${prescriptionId}.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p>Please review and respond at your earliest convenience.</p>
            <p><a href="${process.env.FRONTEND_URL}/doctor/refills/${refillId}">View Request</a></p>
        `;

        return await emailService.sendEmail({
            to: doctorEmail,
            subject: `New Refill Request - ${patientName}`,
            html
        });
    }

    /**
     * Send refill approval email to patient
     */
    static async sendRefillApprovalEmail(data) {
        const { patientEmail, patientName, prescriptionId, doctorNotes, refillId } = data;

        const html = `
            <h2>Refill Request Approved</h2>
            <p>Hello ${patientName},</p>
            <p>Your refill request for prescription #${prescriptionId} has been approved!</p>
            ${doctorNotes ? `<p><strong>Doctor's Notes:</strong> ${doctorNotes}</p>` : ''}
            <p><a href="${process.env.FRONTEND_URL}/user/prescriptions/${prescriptionId}">View Prescription</a></p>
        `;

        return await emailService.sendEmail({
            to: patientEmail,
            subject: 'Refill Request Approved',
            html
        });
    }

    /**
     * Send refill rejection email to patient
     */
    static async sendRefillRejectionEmail(data) {
        const { patientEmail, patientName, prescriptionId, rejectionReason, refillId } = data;

        const html = `
            <h2>Refill Request Update</h2>
            <p>Hello ${patientName},</p>
            <p>Your refill request for prescription #${prescriptionId} requires attention.</p>
            <p><strong>Doctor's Response:</strong> ${rejectionReason}</p>
            <p>Please contact your doctor's office for further guidance.</p>
        `;

        return await emailService.sendEmail({
            to: patientEmail,
            subject: 'Refill Request Update',
            html
        });
    }
}

module.exports = RefillController;
