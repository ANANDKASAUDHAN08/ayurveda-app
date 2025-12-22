const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a professional prescription PDF
 * @param {Object} prescription - Prescription data with medicines
 * @param {string} outputPath - Path where PDF will be saved
 * @returns {Promise<string>} - Path to generated PDF
 */
async function generatePrescriptionPDF(prescription, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            // Create PDF document
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: `Prescription #${prescription.id}`,
                    Author: 'Ayurveda Healthcare',
                    Subject: 'Medical Prescription'
                }
            });

            // Create write stream
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            // Header - Logo and Title
            doc.fontSize(24)
                .fillColor('#059669')
                .text('AYURVEDA HEALTHCARE', { align: 'center' })
                .fontSize(12)
                .fillColor('#666')
                .text('Digital Prescription', { align: 'center' })
                .moveDown(2);

            // Prescription Header Box
            doc.rect(50, doc.y, doc.page.width - 100, 80)
                .lineWidth(1)
                .stroke('#059669');

            const boxY = doc.y + 10;

            // Prescription ID
            doc.fontSize(14)
                .fillColor('#000')
                .font('Helvetica-Bold')
                .text('Prescription #', 60, boxY)
                .font('Helvetica')
                .text(prescription.id, 160, boxY);

            // Status Badge
            const statusColors = {
                'pending': '#F59E0B',
                'verified': '#3B82F6',
                'active': '#059669',
                'expired': '#EF4444',
                'cancelled': '#6B7280'
            };
            doc.fontSize(10)
                .fillColor(statusColors[prescription.status] || '#666')
                .text(prescription.status.toUpperCase(), doc.page.width - 150, boxY);

            // Issue Date
            doc.fontSize(11)
                .fillColor('#000')
                .font('Helvetica-Bold')
                .text('Issue Date:', 60, boxY + 25)
                .font('Helvetica')
                .text(new Date(prescription.issue_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }), 160, boxY + 25);

            // Expiry Date
            if (prescription.expiry_date) {
                doc.font('Helvetica-Bold')
                    .text('Expiry Date:', 60, boxY + 45)
                    .font('Helvetica')
                    .fillColor(new Date(prescription.expiry_date) < new Date() ? '#EF4444' : '#000')
                    .text(new Date(prescription.expiry_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }), 160, boxY + 45);
            }

            doc.moveDown(5);

            // Doctor Information (if available)
            if (prescription.doctor_name) {
                doc.fontSize(12)
                    .fillColor('#059669')
                    .font('Helvetica-Bold')
                    .text('Prescribed By:', { underline: true })
                    .moveDown(0.5)
                    .fillColor('#000')
                    .fontSize(11)
                    .font('Helvetica')
                    .text(`Dr. ${prescription.doctor_name}`)
                    .moveDown(0.3);

                if (prescription.doctor_specialization) {
                    doc.fillColor('#666')
                        .fontSize(10)
                        .text(prescription.doctor_specialization);
                }

                doc.moveDown(1.5);
            }

            // Medicines Section
            doc.fontSize(14)
                .fillColor('#059669')
                .font('Helvetica-Bold')
                .text('Prescribed Medicines', { underline: true })
                .moveDown(1);

            if (prescription.medicines && prescription.medicines.length > 0) {
                prescription.medicines.forEach((medicine, index) => {
                    // Check if we need a new page
                    if (doc.y > doc.page.height - 150) {
                        doc.addPage();
                    }

                    // Medicine number and name
                    doc.fontSize(12)
                        .fillColor('#000')
                        .font('Helvetica-Bold')
                        .text(`${index + 1}. ${medicine.medicine_name}`, { continued: false })
                        .moveDown(0.5);

                    // Medicine details
                    const details = [];
                    if (medicine.dosage) details.push(`Dosage: ${medicine.dosage}`);
                    if (medicine.frequency) details.push(`Frequency: ${medicine.frequency}`);
                    if (medicine.duration) details.push(`Duration: ${medicine.duration}`);
                    if (medicine.quantity) details.push(`Quantity: ${medicine.quantity}`);

                    if (details.length > 0) {
                        doc.fontSize(10)
                            .fillColor('#666')
                            .font('Helvetica')
                            .text(details.join(' • '))
                            .moveDown(0.3);
                    }

                    // Instructions
                    if (medicine.instructions) {
                        doc.fontSize(10)
                            .fillColor('#F59E0B')
                            .font('Helvetica-Oblique')
                            .text(`Instructions: ${medicine.instructions}`)
                            .moveDown(0.8);
                    } else {
                        doc.moveDown(0.5);
                    }
                });
            } else {
                doc.fontSize(11)
                    .fillColor('#666')
                    .font('Helvetica-Oblique')
                    .text('No medicines prescribed');
            }

            // QR Code Section (if available)
            if (prescription.verification_code && prescription.qr_code_data) {
                // Check if we need a new page
                if (doc.y > doc.page.height - 300) {
                    doc.addPage();
                }

                doc.moveDown(2);

                // QR Code Box
                const qrBoxY = doc.y;
                const qrBoxHeight = 220;

                doc.rect(50, qrBoxY, doc.page.width - 100, qrBoxHeight)
                    .lineWidth(2)
                    .strokeColor('#7C3AED')
                    .fillColor('#F5F3FF')
                    .fillAndStroke();

                // Title
                doc.fontSize(14)
                    .fillColor('#7C3AED')
                    .font('Helvetica-Bold')
                    .text('Digital Prescription Verification', 60, qrBoxY + 15, { underline: true });

                // QR Code Image (if it's base64)
                try {
                    if (prescription.qr_code_data.startsWith('data:image')) {
                        const base64Data = prescription.qr_code_data.split(',')[1];
                        const imageBuffer = Buffer.from(base64Data, 'base64');
                        doc.image(imageBuffer, 70, qrBoxY + 40, {
                            width: 120,
                            height: 120
                        });
                    }
                } catch (error) {
                    console.error('Error adding QR code to PDF:', error);
                }

                // Verification Code and Instructions
                const instructionsX = 210;
                const instructionsY = qrBoxY + 40;

                doc.fontSize(10)
                    .fillColor('#000')
                    .font('Helvetica-Bold')
                    .text('Verification Code:', instructionsX, instructionsY);

                doc.fontSize(16)
                    .fillColor('#7C3AED')
                    .font('Helvetica-Bold')
                    .text(prescription.verification_code, instructionsX, instructionsY + 20);

                doc.fontSize(9)
                    .fillColor('#666')
                    .font('Helvetica')
                    .text('For Pharmacy Use:', instructionsX, instructionsY + 50)
                    .moveDown(0.3);

                const instructions = [
                    '1. Scan QR code using your mobile',
                    '   device or enter verification code',
                    '2. Verify prescription details match',
                    '3. Dispense medicines as prescribed',
                    '4. Mark as dispensed in system'
                ];

                instructions.forEach((instruction, i) => {
                    doc.fontSize(8)
                        .fillColor('#444')
                        .text(instruction, instructionsX, instructionsY + 68 + (i * 12));
                });

                // Security Notice
                doc.fontSize(7)
                    .fillColor('#DC2626')
                    .font('Helvetica-Bold')
                    .text('⚠ Security Notice:', instructionsX, instructionsY + 135);

                doc.fontSize(7)
                    .fillColor('#666')
                    .font('Helvetica')
                    .text('This QR code is unique to this prescription.', instructionsX, instructionsY + 147)
                    .text('Do not share with unauthorized parties.', instructionsX, instructionsY + 157);

                doc.moveDown(1);
            }

            // Notes Section
            if (prescription.notes) {
                doc.moveDown(2);
                doc.fontSize(12)
                    .fillColor('#059669')
                    .font('Helvetica-Bold')
                    .text('Additional Notes:', { underline: true })
                    .moveDown(0.5)
                    .fontSize(10)
                    .fillColor('#000')
                    .font('Helvetica')
                    .text(prescription.notes, {
                        width: doc.page.width - 100,
                        align: 'justify'
                    });
            }

            // Footer
            const footerY = doc.page.height - 80;
            doc.fontSize(8)
                .fillColor('#999')
                .text(
                    `Generated on ${new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}`,
                    50,
                    footerY,
                    { align: 'center' }
                )
                .text(
                    'This is a digitally generated prescription. For any queries, please contact your healthcare provider.',
                    50,
                    footerY + 15,
                    { align: 'center', width: doc.page.width - 100 }
                );

            // Finalize PDF
            doc.end();

            stream.on('finish', () => {
                resolve(outputPath);
            });

            stream.on('error', (error) => {
                reject(error);
            });

        } catch (error) {
            reject(error);
        }
    });
}

module.exports = { generatePrescriptionPDF };
