const db = require('../config/database');
const NotificationController = require('./notification.controller');

// Get unverified prescriptions for doctor to review
exports.getUnverifiedPrescriptions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status = 'pending', limit = 20, offset = 0, patient } = req.query;

        // Get doctor_id
        const [doctors] = await db.query('SELECT id FROM doctors WHERE userId = ?', [userId]);
        if (doctors.length === 0) {
            return res.status(403).json({ error: 'Not authorized as doctor' });
        }
        const doctorId = doctors[0].id;

        // Build query
        let query = `
            SELECT 
                p.id,
                p.upload_file_path,
                p.issue_date,
                p.expiry_date,
                p.notes,
                p.created_at as upload_date,
                p.status,
                p.verified_at,
                p.verification_notes,
                p.rejection_reason,
                p.verified_by,
                u.id as patient_id,
                u.name as patient_name,
                u.email as patient_email,
                COUNT(pm.id) as medicines_count
            FROM prescriptions p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN prescription_medicines pm ON p.id = pm.prescription_id
            WHERE p.doctor_id = ?
        `;

        const params = [doctorId];

        if (status) {
            query += ' AND p.status = ?';
            params.push(status);
        }

        if (patient) {
            query += ' AND u.name LIKE ?';
            params.push(`%${patient}%`);
        }

        query += ' GROUP BY p.id, p.upload_file_path, p.issue_date, p.expiry_date, p.notes, p.created_at, p.status, p.verified_at, p.verification_notes, p.rejection_reason, p.verified_by, u.id, u.name, u.email';
        query += ' ORDER BY p.created_at DESC';
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [prescriptions] = await db.query(query, params);

        // Get stats
        const [stats] = await db.query(`
            SELECT 
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN status = 'verified' AND DATE(verified_at) = CURDATE() THEN 1 ELSE 0 END) as verified_today,
                SUM(CASE WHEN status = 'rejected' AND DATE(verified_at) = CURDATE() THEN 1 ELSE 0 END) as rejected_today
            FROM prescriptions
            WHERE doctor_id = ?
        `, [doctorId]);

        res.json({
            prescriptions,
            stats: stats[0] || { pending_count: 0, verified_today: 0, rejected_today: 0 },
            total: prescriptions.length
        });
    } catch (error) {
        console.error('Error fetching unverified prescriptions:', error);
        res.status(500).json({ error: 'Failed to fetch prescriptions' });
    }
};

// Get prescription details for verification
exports.getPrescriptionDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Get doctor_id
        const [doctors] = await db.query('SELECT id FROM doctors WHERE userId = ?', [userId]);
        if (doctors.length === 0) {
            return res.status(403).json({ error: 'Not authorized as doctor' });
        }
        const doctorId = doctors[0].id;

        // Get prescription details
        const [prescriptions] = await db.query(`
            SELECT 
                p.*,
                u.id as patient_id,
                u.name as patient_name,
                u.email as patient_email,
                u.phone as patient_phone
            FROM prescriptions p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ? AND p.doctor_id = ?
        `, [id, doctorId]);

        if (prescriptions.length === 0) {
            return res.status(404).json({ error: 'Prescription not found' });
        }

        // Get medicines
        const [medicines] = await db.query(`
            SELECT * FROM prescription_medicines
            WHERE prescription_id = ?
            ORDER BY id
        `, [id]);

        const prescription = prescriptions[0];
        prescription.medicines = medicines;

        res.json(prescription);
    } catch (error) {
        console.error('Error fetching prescription details:', error);
        res.status(500).json({ error: 'Failed to fetch prescription details' });
    }
};

// Verify prescription
exports.verifyPrescription = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { verification_notes } = req.body;

        // Get doctor_id
        const [doctors] = await db.query('SELECT id FROM doctors WHERE userId = ?', [userId]);
        if (doctors.length === 0) {
            return res.status(403).json({ error: 'Not authorized as doctor' });
        }
        const doctorId = doctors[0].id;

        // Check prescription exists and belongs to this doctor
        const [prescriptions] = await db.query(`
            SELECT * FROM prescriptions WHERE id = ? AND doctor_id = ?
        `, [id, doctorId]);

        if (prescriptions.length === 0) {
            return res.status(404).json({ error: 'Prescription not found' });
        }

        if (prescriptions[0].status === 'verified') {
            return res.status(400).json({ error: 'Prescription already verified' });
        }

        // Update prescription with verification details
        await db.query(`
            UPDATE prescriptions
            SET status = 'verified',
                verified_by = ?,
                verified_at = NOW(),
                verification_notes = ?
            WHERE id = ?
        `, [userId, verification_notes || null, id]);

        res.json({ message: 'Prescription verified successfully' });

        // Create notification for patient
        try {
            await NotificationController.createNotification({
                user_id: prescriptions[0].user_id,
                type: 'prescription_verified',
                category: 'prescription',
                title: 'Prescription Verified ✓',
                message: `Your prescription #${id} has been verified`,
                related_id: id,
                related_type: 'prescription',
                action_url: `/user/prescriptions/${id}`,
                priority: 'normal'
            });
        } catch (notifError) {
            console.error('Failed to create notification:', notifError);
        }
    } catch (error) {
        console.error('Error verifying prescription:', error);
        res.status(500).json({ error: 'Failed to verify prescription' });
    }
};

// Reject prescription verification
exports.rejectVerification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { rejection_reason } = req.body;

        if (!rejection_reason || rejection_reason.length < 20) {
            return res.status(400).json({ error: 'Rejection reason is required (minimum 20 characters)' });
        }

        // Get doctor_id
        const [doctors] = await db.query('SELECT id FROM doctors WHERE userId = ?', [userId]);
        if (doctors.length === 0) {
            return res.status(403).json({ error: 'Not authorized as doctor' });
        }
        const doctorId = doctors[0].id;

        // Check prescription exists and belongs to this doctor
        const [prescriptions] = await db.query(`
            SELECT * FROM prescriptions WHERE id = ? AND doctor_id = ?
        `, [id, doctorId]);

        if (prescriptions.length === 0) {
            return res.status(404).json({ error: 'Prescription not found' });
        }

        // Update prescription with rejection details
        await db.query(`
            UPDATE prescriptions
            SET status = 'rejected',
                verified_by = ?,
                verified_at = NOW(),
                rejection_reason = ?
            WHERE id = ?
        `, [userId, rejection_reason, id]);

        res.json({ message: 'Prescription rejected' });

        // Create notification for patient
        try {
            await NotificationController.createNotification({
                user_id: prescriptions[0].user_id,
                type: 'prescription_rejected',
                category: 'prescription',
                title: 'Prescription Needs Attention',
                message: `Your prescription #${id} requires updates: ${rejection_reason.substring(0, 100)}`,
                related_id: id,
                related_type: 'prescription',
                action_url: `/user/prescriptions/${id}`,
                priority: 'high'
            });
        } catch (notifError) {
            console.error('Failed to create notification:', notifError);
        }
    } catch (error) {
        console.error('Error rejecting prescription:', error);
        res.status(500).json({ error: 'Failed to reject prescription' });
    }
};
