const db = require('../config/database');
const crypto = require('crypto');
const emailService = require('../services/email.service');

class ShareController {
    // POST /api/prescriptions/:id/share - Create share link
    static async createShareLink(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const { recipient_email, recipient_name, recipient_type, expiry_hours, send_email } = req.body;

            // Verify prescription belongs to user
            const [prescription] = await db.query(
                'SELECT * FROM prescriptions WHERE id = ? AND user_id = ?',
                [id, userId]
            );

            if (prescription.length === 0) {
                return res.status(404).json({ error: 'Prescription not found' });
            }

            // Generate secure token
            const shareToken = crypto.randomBytes(32).toString('hex');

            // Calculate expiry
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + (expiry_hours || 24));

            // Insert share record
            const [result] = await db.query(
                `INSERT INTO prescription_shares 
         (prescription_id, share_token, created_by, recipient_email, recipient_name, recipient_type, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [id, shareToken, userId, recipient_email, recipient_name, recipient_type, expiresAt]
            );

            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
            const shareUrl = `${frontendUrl}/share/rx/${shareToken}`;

            let emailSent = false;

            // Send email if requested and email provided
            if (send_email && recipient_email) {
                try {
                    // Get detailed prescription info for email
                    const [prescriptionDetails] = await db.query(
                        `SELECT u.name as patient_name, d.name as doctor_name, creator.name as shared_by
                         FROM prescriptions p
                         LEFT JOIN users u ON p.user_id = u.id
                         LEFT JOIN doctors d ON p.doctor_id = d.id
                         LEFT JOIN users creator ON creator.id = ?
                         WHERE p.id = ?`,
                        [userId, id]
                    );

                    const details = prescriptionDetails[0] || {};

                    await emailService.sendPrescriptionShare({
                        recipientEmail: recipient_email,
                        recipientName: recipient_name,
                        shareUrl,
                        sharedBy: details.shared_by || 'HealthConnect User',
                        patientName: details.patient_name,
                        doctorName: details.doctor_name,
                        expiresAt
                    });

                    emailSent = true;
                } catch (emailError) {
                    console.error('❌ Failed to send email:', emailError);
                    // Don't fail the request if email fails - share link still created
                }
            }

            res.json({
                share_id: result.insertId,
                share_token: shareToken,
                share_url: shareUrl,
                expires_at: expiresAt,
                recipient_type: recipient_type || 'other',
                email_sent: emailSent
            });
        } catch (error) {
            console.error('Error creating share link:', error);
            res.status(500).json({ error: 'Failed to create share link' });
        }
    }

    // GET /api/share/rx/:token - Access shared prescription (public)
    static async accessSharedPrescription(req, res) {
        try {
            const { token } = req.params;
            const ipAddress = req.ip || req.connection.remoteAddress;

            // Get share record with prescription
            const [shares] = await db.query(
                `SELECT ps.*, p.*, u.name as shared_by_name,
                patient.name as patient_name,
                d.name as doctor_name, d.specialization as doctor_specialization
         FROM prescription_shares ps
         JOIN prescriptions p ON ps.prescription_id = p.id
         JOIN users u ON ps.created_by = u.id
         LEFT JOIN users patient ON p.user_id = patient.id
         LEFT JOIN doctors d ON p.doctor_id = d.id
         WHERE ps.share_token = ? AND ps.is_active = TRUE AND ps.expires_at > NOW()`,
                [token]
            );

            if (shares.length === 0) {
                return res.status(404).json({
                    error: 'Invalid or expired share link',
                    expired: true
                });
            }

            const share = shares[0];

            // Get medicines
            const [medicines] = await db.query(
                `SELECT medicine_name as name, dosage, frequency, duration, instructions 
                 FROM prescription_medicines WHERE prescription_id = ?`,
                [share.prescription_id]
            );

            // Update access tracking
            await db.query(
                `UPDATE prescription_shares 
         SET access_count = access_count + 1, 
             last_accessed_at = NOW(),
             last_accessed_ip = ?
         WHERE id = ?`,
                [ipAddress, share.id]
            );

            res.json({
                prescription: {
                    id: share.prescription_id,
                    patient_name: share.patient_name,
                    doctor_name: share.doctor_name,
                    doctor_specialization: share.doctor_specialization,
                    diagnosis: share.diagnosis,
                    created_at: share.created_at,
                    issue_date: share.issue_date,
                    expiry_date: share.expiry_date,
                    status: share.status,
                    notes: share.notes,
                    prescription_type: share.prescription_type,
                    medicines: medicines
                },
                share_info: {
                    shared_by: share.shared_by_name,
                    recipient_type: share.recipient_type,
                    recipient_name: share.recipient_name,
                    expires_at: share.expires_at,
                    access_count: share.access_count + 1
                }
            });
        } catch (error) {
            console.error('Error accessing shared prescription:', error);
            res.status(500).json({ error: 'Failed to access shared prescription' });
        }
    }

    // GET /api/prescriptions/:id/shares - List shares for a prescription
    static async getUserShares(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Verify prescription belongs to user
            const [prescription] = await db.query(
                'SELECT * FROM prescriptions WHERE id = ? AND user_id = ?',
                [id, userId]
            );

            if (prescription.length === 0) {
                return res.status(404).json({ error: 'Prescription not found' });
            }

            // Get shares
            const [shares] = await db.query(
                `SELECT id, share_token, recipient_email, recipient_name, recipient_type,
                expires_at, access_count, last_accessed_at, is_active, created_at
         FROM prescription_shares
         WHERE prescription_id = ?
         ORDER BY created_at DESC`,
                [id]
            );

            res.json(shares);
        } catch (error) {
            console.error('Error fetching shares:', error);
            res.status(500).json({ error: 'Failed to fetch shares' });
        }
    }

    // DELETE /api/prescriptions/shares/:shareId - Revoke share
    static async revokeShare(req, res) {
        try {
            const { shareId } = req.params;
            const userId = req.user.id;

            // Verify share belongs to user
            const [share] = await db.query(
                `SELECT ps.* FROM prescription_shares ps
         JOIN prescriptions p ON ps.prescription_id = p.id
         WHERE ps.id = ? AND p.user_id = ?`,
                [shareId, userId]
            );

            if (share.length === 0) {
                return res.status(404).json({ error: 'Share not found' });
            }

            // Deactivate share
            await db.query(
                'UPDATE prescription_shares SET is_active = FALSE WHERE id = ?',
                [shareId]
            );

            res.json({ success: true, message: 'Share revoked successfully' });
        } catch (error) {
            console.error('Error revoking share:', error);
            res.status(500).json({ error: 'Failed to revoke share' });
        }
    }
}

module.exports = ShareController;

