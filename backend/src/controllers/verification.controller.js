const db = require('../config/database');
const qrcodeService = require('../services/qrcode.service');

class VerificationController {
    /**
     * GET /api/prescriptions/verify/:verificationCode
     * Verify and view prescription using verification code (Public endpoint)
     */
    static async verifyPrescription(req, res) {
        try {
            const { verificationCode } = req.params;
            const ipAddress = req.ip || req.connection.remoteAddress;

            // Find prescription by verification code
            const [prescriptions] = await db.query(
                `SELECT p.*, u.name as patient_name, d.name as doctor_name, d.specialization as doctor_specialization
                 FROM prescriptions p
                 LEFT JOIN users u ON p.user_id = u.id
                 LEFT JOIN doctors d ON p.doctor_id = d.id
                 WHERE p.verification_code = ?`,
                [verificationCode]
            );

            if (prescriptions.length === 0) {
                return res.status(404).json({
                    valid: false,
                    error: 'Invalid verification code - prescription not found'
                });
            }

            const prescription = prescriptions[0];

            // Check if prescription has expired
            if (prescription.expiry_date && new Date(prescription.expiry_date) < new Date()) {
                return res.status(410).json({
                    valid: false,
                    error: 'Prescription has expired',
                    expired: true
                });
            }

            // Get medicines for this prescription
            const [medicines] = await db.query(
                `SELECT medicine_name as name, dosage, frequency, duration, instructions
                 FROM prescription_medicines WHERE prescription_id = ?`,
                [prescription.id]
            );

            // Log verification attempt
            await db.query(
                `INSERT INTO prescription_verifications 
                 (prescription_id, verification_code, pharmacy_name, ip_address, action)
                 VALUES (?, ?, ?, ?, 'view')`,
                [prescription.id, verificationCode, 'Anonymous Viewer', ipAddress]
            );

            // Return prescription details
            res.json({
                valid: true,
                prescription: {
                    id: prescription.id,
                    patient_name: prescription.patient_name,
                    doctor_name: prescription.doctor_name,
                    doctor_specialization: prescription.doctor_specialization,
                    diagnosis: prescription.diagnosis,
                    issue_date: prescription.issue_date,
                    expiry_date: prescription.expiry_date,
                    status: prescription.status,
                    is_dispensed: prescription.is_dispensed,
                    dispensed_at: prescription.dispensed_at,
                    dispensed_pharmacy: prescription.dispensed_pharmacy,
                    medicines: medicines,
                    notes: prescription.notes
                }
            });
        } catch (error) {
            console.error('Error verifying prescription:', error);
            res.status(500).json({
                valid: false,
                error: 'Failed to verify prescription'
            });
        }
    }

    /**
     * POST /api/prescriptions/verify/:verificationCode/dispense
     * Mark prescription as dispensed
     */
    static async dispensePrescription(req, res) {
        try {
            const { verificationCode } = req.params;
            const { pharmacy_name, pharmacist_name, notes } = req.body;
            const ipAddress = req.ip || req.connection.remoteAddress;

            // Find prescription
            const [prescriptions] = await db.query(
                'SELECT id, is_dispensed, expiry_date FROM prescriptions WHERE verification_code = ?',
                [verificationCode]
            );

            if (prescriptions.length === 0) {
                return res.status(404).json({ error: 'Invalid verification code' });
            }

            const prescription = prescriptions[0];

            // Check if already dispensed
            if (prescription.is_dispensed) {
                return res.status(400).json({
                    error: 'Prescription has already been dispensed'
                });
            }

            // Check if expired
            if (prescription.expiry_date && new Date(prescription.expiry_date) < new Date()) {
                return res.status(410).json({
                    error: 'Prescription has expired and cannot be dispensed'
                });
            }

            // Mark as dispensed
            await db.query(
                `UPDATE prescriptions 
                 SET is_dispensed = TRUE,
                     dispensed_at = NOW(),
                     dispensed_by = ?,
                     dispensed_pharmacy = ?
                 WHERE id = ?`,
                [pharmacist_name || 'Unknown', pharmacy_name, prescription.id]
            );

            // Log dispense action
            await db.query(
                `INSERT INTO prescription_verifications 
                 (prescription_id, verification_code, pharmacy_name, verified_by, ip_address, action, notes)
                 VALUES (?, ?, ?, ?, ?, 'dispense', ?)`,
                [prescription.id, verificationCode, pharmacy_name, pharmacist_name, ipAddress, notes]
            );

            res.json({
                success: true,
                message: 'Prescription marked as dispensed successfully',
                dispensed_at: new Date(),
                pharmacy_name
            });
        } catch (error) {
            console.error('Error dispensing prescription:', error);
            res.status(500).json({ error: 'Failed to mark prescription as dispensed' });
        }
    }

    /**
     * GET /api/prescriptions/:id/verification-history
     * Get verification history for a prescription
     */
    static async getVerificationHistory(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Verify prescription belongs to user
            const [prescription] = await db.query(
                'SELECT id FROM prescriptions WHERE id = ? AND user_id = ?',
                [id, userId]
            );

            if (prescription.length === 0) {
                return res.status(404).json({ error: 'Prescription not found' });
            }

            // Get verification history
            const [verifications] = await db.query(
                `SELECT * FROM prescription_verifications 
                 WHERE prescription_id = ? 
                 ORDER BY verified_at DESC`,
                [id]
            );

            res.json(verifications);
        } catch (error) {
            console.error('Error fetching verification history:', error);
            res.status(500).json({ error: 'Failed to fetch verification history' });
        }
    }
}

module.exports = VerificationController;
