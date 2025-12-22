const QRCode = require('qrcode');
const crypto = require('crypto');

class QRCodeService {
    /**
     * Generate a unique verification code for a prescription
     * Format: RX-{timestamp}-{random}
     */
    generateVerificationCode(prescriptionId) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = crypto.randomBytes(4).toString('hex').toUpperCase();
        return `RX-${timestamp}-${random}`;
    }

    /**
     * Create a cryptographic signature for QR code data
     * This prevents tampering with QR codes
     */
    createSignature(data) {
        const secret = process.env.QR_SECRET || 'default-qr-secret-change-me';
        const hash = crypto.createHash('sha256');
        hash.update(JSON.stringify(data) + secret);
        return hash.digest('hex').substring(0, 16);
    }

    /**
     * Generate QR code data for a prescription
     */
    async generateQRCodeData(prescription) {
        // Prepare data for QR code
        const qrData = {
            prescription_id: prescription.id,
            verification_code: prescription.verification_code,
            patient_id: prescription.user_id,
            doctor_id: prescription.doctor_id,
            issue_date: prescription.issue_date,
            expiry_date: prescription.expiry_date,
            medicines_count: prescription.medicines?.length || 0,
            timestamp: new Date().toISOString()
        };

        // Add signature for verification
        qrData.signature = this.createSignature(qrData);

        return qrData;
    }

    /**
     * Generate QR code image as base64
     */
    async generateQRCodeImage(prescription) {
        try {
            const qrData = await this.generateQRCodeData(prescription);

            // Generate QR code as base64 data URL
            const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData), {
                errorCorrectionLevel: 'H',
                type: 'image/png',
                quality: 0.95,
                margin: 1,
                width: 300,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            return qrCodeBase64;
        } catch (error) {
            console.error('Error generating QR code:', error);
            throw new Error('Failed to generate QR code');
        }
    }

    /**
     * Verify QR code signature
     */
    verifySignature(qrData) {
        try {
            const receivedSignature = qrData.signature;

            // Create a copy without signature for verification
            const dataForVerification = { ...qrData };
            delete dataForVerification.signature;

            const calculatedSignature = this.createSignature(dataForVerification);

            return receivedSignature === calculatedSignature;
        } catch (error) {
            console.error('Error verifying signature:', error);
            return false;
        }
    }

    /**
     * Parse QR code data from scanned string
     */
    parseQRCodeData(qrString) {
        try {
            return JSON.parse(qrString);
        } catch (error) {
            throw new Error('Invalid QR code format');
        }
    }

    /**
     * Validate QR code data
     */
    validateQRCodeData(qrData) {
        const required = [
            'prescription_id',
            'verification_code',
            'signature'
        ];

        for (const field of required) {
            if (!qrData[field]) {
                return {
                    valid: false,
                    error: `Missing required field: ${field}`
                };
            }
        }

        // Verify signature
        if (!this.verifySignature(qrData)) {
            return {
                valid: false,
                error: 'Invalid signature - QR code may have been tampered with'
            };
        }

        return {
            valid: true
        };
    }
}

module.exports = new QRCodeService();
