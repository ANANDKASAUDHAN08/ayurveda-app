const db = require('../config/database');
const { generatePrescriptionPDF } = require('../utils/pdfGenerator');
const path = require('path');
const fs = require('fs');

class PrescriptionController {
    // Create tables if they don't exist (MySQL version - skip, tables already created via migration)
    static async initializeTables() {
        console.log('✅ Prescription tables should be created via migration');
    }

    // GET /api/prescriptions - List user's prescriptions
    static async getAllPrescriptions(req, res) {
        try {
            const userId = req.user.id;
            const { status, type, search } = req.query;

            let query = `
        SELECT p.*, 
               d.name as doctor_name,
               d.specialization as doctor_specialization,
               COUNT(pm.id) as medicine_count
        FROM prescriptions p
        LEFT JOIN doctors d ON p.doctor_id = d.id
        LEFT JOIN prescription_medicines pm ON p.id = pm.prescription_id
        WHERE p.user_id = ?
      `;

            const params = [userId];

            if (status) {
                query += ` AND p.status = ?`;
                params.push(status);
            }

            if (type) {
                query += ` AND p.prescription_type = ?`;
                params.push(type);
            }

            if (search) {
                query += ` AND (d.name LIKE ? OR p.notes LIKE ?)`;
                params.push(`%${search}%`, `%${search}%`);
            }

            query += ` GROUP BY p.id, d.name, d.specialization ORDER BY p.created_at DESC`;

            const [result] = await db.query(query, params);
            res.json(result);
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
            res.status(500).json({ error: 'Failed to fetch prescriptions' });
        }
    }

    // GET /api/prescriptions/:id - Get prescription details
    static async getPrescriptionById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const prescriptionQuery = `
        SELECT p.*, 
               d.name as doctor_name,
               d.specialization as doctor_specialization,
               d.phone as doctor_phone
        FROM prescriptions p
        LEFT JOIN doctors d ON p.doctor_id = d.id
        WHERE p.id = ? AND p.user_id = ?
      `;

            const medicinesQuery = `
        SELECT * FROM prescription_medicines
        WHERE prescription_id = ?
        ORDER BY created_at ASC
      `;

            const [[prescriptionResult], [medicinesResult]] = await Promise.all([
                db.query(prescriptionQuery, [id, userId]),
                db.query(medicinesQuery, [id])
            ]);

            if (prescriptionResult.length === 0) {
                return res.status(404).json({ error: 'Prescription not found' });
            }

            const prescription = prescriptionResult[0];
            prescription.medicines = medicinesResult;

            res.json(prescription);
        } catch (error) {
            console.error('Error fetching prescription:', error);
            res.status(500).json({ error: 'Failed to fetch prescription details' });
        }
    }

    // POST /api/prescriptions/upload - Upload prescription
    static async uploadPrescription(req, res) {
        try {
            const userId = req.user.id;
            const { doctor_id, issue_date, expiry_date, notes, medicines: medicinesStr } = req.body;
            const uploadFilePath = req.file ? req.file.path : null;

            // Parse medicines (comes as JSON string from FormData)
            const medicines = typeof medicinesStr === 'string' ? JSON.parse(medicinesStr) : medicinesStr;

            // Validate required fields
            if (!issue_date || !medicines || medicines.length === 0) {
                return res.status(400).json({ error: 'Issue date and medicines are required' });
            }

            // Insert prescription
            const prescriptionQuery = `
        INSERT INTO prescriptions 
        (user_id, doctor_id, prescription_type, upload_file_path, issue_date, expiry_date, status, notes)
        VALUES (?, ?, 'uploaded', ?, ?, ?, 'pending', ?)
      `;

            const [prescriptionResult] = await db.query(prescriptionQuery, [
                userId, doctor_id || null, uploadFilePath, issue_date, expiry_date || null, notes || null
            ]);

            const prescriptionId = prescriptionResult.insertId;

            // Insert medicines
            for (const medicine of medicines) {
                await db.query(
                    `INSERT INTO prescription_medicines 
           (prescription_id, medicine_name, dosage, frequency, duration, quantity, instructions)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [prescriptionId, medicine.name, medicine.dosage || null, medicine.frequency || null,
                        medicine.duration || null, medicine.quantity || null, medicine.instructions || null]
                );
            }

            res.status(201).json({
                message: 'Prescription uploaded successfully',
                prescription_id: prescriptionId
            });
        } catch (error) {
            console.error('Error uploading prescription:', error);
            res.status(500).json({ error: 'Failed to upload prescription' });
        }
    }

    // POST /api/prescriptions/digital - Create digital prescription (Doctor)
    static async createDigitalPrescription(req, res) {
        try {
            const doctorId = req.user.doctor_id; // Assuming doctor is logged in
            const { user_id, appointment_id, issue_date, expiry_date, notes, medicines } = req.body;

            if (!user_id || !issue_date || !medicines || medicines.length === 0) {
                return res.status(400).json({ error: 'User ID, issue date, and medicines are required' });
            }

            const prescriptionQuery = `
        INSERT INTO prescriptions 
        (user_id, doctor_id, appointment_id, prescription_type, issue_date, expiry_date, status, notes)
        VALUES (?, ?, ?, 'digital', ?, ?, 'active', ?)
      `;

            const [prescriptionResult] = await db.query(prescriptionQuery, [
                user_id, doctorId, appointment_id || null, issue_date, expiry_date || null, notes || null
            ]);

            const prescriptionId = prescriptionResult.insertId;

            // Insert medicines
            for (const medicine of medicines) {
                await db.query(
                    `INSERT INTO prescription_medicines 
           (prescription_id, medicine_name, dosage, frequency, duration, quantity, instructions)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [prescriptionId, medicine.name, medicine.dosage || null, medicine.frequency || null,
                        medicine.duration || null, medicine.quantity || null, medicine.instructions || null]
                );
            }

            res.status(201).json({
                message: 'Digital prescription created successfully',
                prescription_id: prescriptionId
            });
        } catch (error) {
            console.error('Error creating digital prescription:', error);
            res.status(500).json({ error: 'Failed to create prescription' });
        }
    }

    // PUT /api/prescriptions/:id - Update prescription
    static async updatePrescription(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const { status, notes, expiry_date } = req.body;

            const query = `
        UPDATE prescriptions 
        SET status = COALESCE(?, status),
            notes = COALESCE(?, notes),
            expiry_date = COALESCE(?, expiry_date),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `;

            const [result] = await db.query(query, [status, notes, expiry_date, id, userId]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Prescription not found' });
            }

            res.json({ message: 'Prescription updated successfully' });
        } catch (error) {
            console.error('Error updating prescription:', error);
            res.status(500).json({ error: 'Failed to update prescription' });
        }
    }

    // DELETE /api/prescriptions/:id - Delete prescription
    static async deletePrescription(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const [result] = await db.query(
                'DELETE FROM prescriptions WHERE id = ? AND user_id = ?',
                [id, userId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Prescription not found' });
            }

            res.json({ message: 'Prescription deleted successfully' });
        } catch (error) {
            console.error('Error deleting prescription:', error);
            res.status(500).json({ error: 'Failed to delete prescription' });
        }
    }

    // POST /api/prescriptions/:id/refills - Request refill
    static async requestRefill(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const { reason, preferred_pharmacy, patient_notes } = req.body;

            // Check if prescription exists and belongs to user
            const [prescriptionResult] = await db.query(
                'SELECT * FROM prescriptions WHERE id = ? AND user_id = ?',
                [id, userId]
            );

            if (prescriptionResult.length === 0) {
                return res.status(404).json({ error: 'Prescription not found' });
            }

            const query = `
        INSERT INTO prescription_refills 
        (original_prescription_id, requested_by, reason, preferred_pharmacy, patient_notes)
        VALUES (?, ?, ?, ?, ?)
      `;

            const [result] = await db.query(query, [id, userId, reason || null, preferred_pharmacy || null, patient_notes || null]);

            res.status(201).json({
                message: 'Refill request submitted successfully',
                refill_id: result.insertId
            });
        } catch (error) {
            console.error('Error requesting refill:', error);
            res.status(500).json({ error: 'Failed to request refill' });
        }
    }

    // GET /api/prescriptions/:id/refills - Get refill history
    static async getRefillHistory(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Verify prescription belongs to user
            const [prescriptionResult] = await db.query(
                'SELECT * FROM prescriptions WHERE id = ? AND user_id = ?',
                [id, userId]
            );

            if (prescriptionResult.length === 0) {
                return res.status(404).json({ error: 'Prescription not found' });
            }

            const query = `
        SELECT r.*, d.name as approved_by_name
        FROM prescription_refills r
        LEFT JOIN doctors d ON r.approved_by = d.id
        WHERE r.original_prescription_id = ?
        ORDER BY r.requested_at DESC
      `;

            const [result] = await db.query(query, [id]);
            res.json(result);
        } catch (error) {
            console.error('Error fetching refill history:', error);
            res.status(500).json({ error: 'Failed to fetch refill history' });
        }
    }

    // POST /api/prescriptions/:id/generate-pdf - Generate PDF
    static async generatePDF(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Get prescription with medicines
            const prescriptionQuery = `
        SELECT p.*, 
               d.name as doctor_name,
               d.specialization as doctor_specialization
        FROM prescriptions p
        LEFT JOIN doctors d ON p.doctor_id = d.id
        WHERE p.id = ? AND p.user_id = ?
      `;

            const medicinesQuery = `
        SELECT * FROM prescription_medicines
        WHERE prescription_id = ?
        ORDER BY created_at ASC
      `;

            const [[prescriptionResult], [medicinesResult]] = await Promise.all([
                db.query(prescriptionQuery, [id, userId]),
                db.query(medicinesQuery, [id])
            ]);

            if (prescriptionResult.length === 0) {
                return res.status(404).json({ error: 'Prescription not found' });
            }

            const prescription = prescriptionResult[0];
            prescription.medicines = medicinesResult;

            // Generate QR code if not exists
            const qrcodeService = require('../services/qrcode.service');
            if (!prescription.verification_code) {
                const verificationCode = qrcodeService.generateVerificationCode(id);
                await db.query(
                    'UPDATE prescriptions SET verification_code = ? WHERE id = ?',
                    [verificationCode, id]
                );
                prescription.verification_code = verificationCode;
            }

            // Generate QR code data if not exists
            if (!prescription.qr_code_data) {
                try {
                    const qrCodeBase64 = await qrcodeService.generateQRCodeImage(prescription);
                    await db.query(
                        'UPDATE prescriptions SET qr_code_data = ? WHERE id = ?',
                        [qrCodeBase64, id]
                    );
                    prescription.qr_code_data = qrCodeBase64;
                } catch (qrError) {
                    console.error('Error generating QR code for PDF:', qrError);
                    // Continue without QR code
                }
            }

            // Create PDF directory if it doesn't exist
            const pdfDir = path.join(__dirname, '../../uploads/prescriptions/pdf');
            if (!fs.existsSync(pdfDir)) {
                fs.mkdirSync(pdfDir, { recursive: true });
            }

            // Generate PDF filename
            const filename = `prescription-${id}-${Date.now()}.pdf`;
            const outputPath = path.join(pdfDir, filename);
            const relativePath = `uploads/prescriptions/pdf/${filename}`;

            // Generate PDF
            await generatePrescriptionPDF(prescription, outputPath);

            // Track download
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('user-agent');

            await db.query(
                `INSERT INTO prescription_downloads 
         (prescription_id, user_id, download_type, file_path, ip_address, user_agent)
         VALUES (?, ?, 'pdf', ?, ?, ?)`,
                [id, userId, relativePath, ipAddress, userAgent]
            );

            res.json({
                success: true,
                pdf_url: `/${relativePath}`,
                filename: filename
            });
        } catch (error) {
            console.error('Error generating PDF:', error);
            res.status(500).json({ error: 'Failed to generate PDF' });
        }
    }

    // GET /api/prescriptions/:id/download-pdf - Download PDF directly
    static async downloadPDF(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Verify prescription belongs to user
            const [prescriptionResult] = await db.query(
                'SELECT * FROM prescriptions WHERE id = ? AND user_id = ?',
                [id, userId]
            );

            if (prescriptionResult.length === 0) {
                return res.status(404).json({ error: 'Prescription not found' });
            }

            // Get latest PDF from downloads
            const [downloads] = await db.query(
                `SELECT file_path FROM prescription_downloads 
         WHERE prescription_id = ? AND download_type = 'pdf' 
         ORDER BY created_at DESC LIMIT 1`,
                [id]
            );

            if (downloads.length === 0) {
                return res.status(404).json({ error: 'PDF not generated yet. Please generate first.' });
            }

            const pdfPath = path.join(__dirname, '../..', downloads[0].file_path);

            // Check if file exists
            if (!fs.existsSync(pdfPath)) {
                return res.status(404).json({ error: 'PDF file not found' });
            }

            // Send file
            res.download(pdfPath, `prescription-${id}.pdf`);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            res.status(500).json({ error: 'Failed to download PDF' });
        }
    }

    // GET /api/prescriptions/:id/download-history - Get download history
    static async getDownloadHistory(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Verify prescription belongs to user
            const [prescriptionResult] = await db.query(
                'SELECT * FROM prescriptions WHERE id = ? AND user_id = ?',
                [id, userId]
            );

            if (prescriptionResult.length === 0) {
                return res.status(404).json({ error: 'Prescription not found' });
            }

            // Get download history
            const [downloads] = await db.query(
                `SELECT id, download_type, created_at, ip_address, user_agent 
         FROM prescription_downloads
         WHERE prescription_id = ?
         ORDER BY created_at DESC`,
                [id]
            );

            res.json(downloads);
        } catch (error) {
            console.error('Error fetching download history:', error);
            res.status(500).json({ error: 'Failed to fetch download history' });
        }
    }

    // POST /api/prescriptions/:id/qrcode - Generate QR code for prescription
    static async generateQRCode(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const qrcodeService = require('../services/qrcode.service');

            // Get prescription
            const prescriptionQuery = `
        SELECT p.*, d.name as doctor_name
        FROM prescriptions p
        LEFT JOIN doctors d ON p.doctor_id = d.id
        WHERE p.id = ? AND p.user_id = ?
      `;

            const [[prescriptionResult], [medicinesResult]] = await Promise.all([
                db.query(prescriptionQuery, [id, userId]),
                db.query('SELECT * FROM prescription_medicines WHERE prescription_id = ?', [id])
            ]);

            if (prescriptionResult.length === 0) {
                return res.status(404).json({ error: 'Prescription not found' });
            }

            const prescription = prescriptionResult[0];
            prescription.medicines = medicinesResult;

            // Generate verification code if not exists
            let verificationCode = prescription.verification_code;
            if (!verificationCode) {
                verificationCode = qrcodeService.generateVerificationCode(id);
                await db.query(
                    'UPDATE prescriptions SET verification_code = ? WHERE id = ?',
                    [verificationCode, id]
                );
                prescription.verification_code = verificationCode;
            }

            // Generate QR code
            const qrCodeBase64 = await qrcodeService.generateQRCodeImage(prescription);

            // Store QR code data in database
            await db.query(
                'UPDATE prescriptions SET qr_code_data = ? WHERE id = ?',
                [qrCodeBase64, id]
            );

            res.json({
                success: true,
                qr_code: qrCodeBase64,
                verification_code: verificationCode,
                prescription_id: id
            });
        } catch (error) {
            console.error('Error generating QR code:', error);
            res.status(500).json({ error: 'Failed to generate QR code' });
        }
    }
}


module.exports = PrescriptionController;
