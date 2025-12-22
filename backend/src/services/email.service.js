const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

class EmailService {
    constructor() {
        // Create transporter with SMTP configuration
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    /**
     * Send a generic email
     */
    async sendEmail(options) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM || 'HealthConnect <noreply@healthconnect.com>',
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email sent successfully:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Email sending error:', error);
            throw error;
        }
    }

    /**
     * Send prescription share notification email
     */
    async sendPrescriptionShare(data) {
        const {
            recipientEmail,
            recipientName,
            shareUrl,
            sharedBy,
            patientName,
            doctorName,
            expiresAt
        } = data;

        const html = this.createShareEmailTemplate({
            recipientName: recipientName || 'Valued Recipient',
            sharedBy,
            patientName: patientName || 'Patient',
            doctorName: doctorName || 'Healthcare Provider',
            shareUrl,
            expiresAt,
            sharedDate: new Date().toLocaleString('en-US', {
                dateStyle: 'long',
                timeStyle: 'short'
            })
        });

        return await this.sendEmail({
            to: recipientEmail,
            subject: '🏥 Prescription Shared with You - HealthConnect',
            html: html,
            text: `A prescription has been shared with you. View it here: ${shareUrl}`
        });
    }

    /**
     * Create HTML email template for prescription sharing
     */
    createShareEmailTemplate(data) {
        const { recipientName, sharedBy, patientName, doctorName, shareUrl, expiresAt, sharedDate } = data;

        const expiryDate = new Date(expiresAt).toLocaleString('en-US', {
            dateStyle: 'long',
            timeStyle: 'short'
        });

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
               line-height: 1.6; color: #1f2937; background-color: #f9fafb; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); 
                  color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 10px 0 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 40px 30px; }
        .content p { margin: 0 0 15px; color: #4b5563; }
        .button { display: inline-block; padding: 14px 32px; background: #10b981; color: white; 
                  text-decoration: none; border-radius: 8px; font-weight: 600; margin: 25px 0;
                  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3); }
        .button:hover { background: #059669; }
        .info-box { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
        .info-box strong { color: #1f2937; display: block; margin-bottom: 10px; font-size: 16px; }
        .info-box ul { margin: 10px 0; padding-left: 20px; color: #4b5563; }
        .info-box ul li { margin: 8px 0; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 8px; }
        .warning strong { color: #92400e; display: block; margin-bottom: 10px; }
        .warning ul { margin: 10px 0; padding-left: 20px; color: #78350f; }
        .warning li { margin: 6px 0; }
        .footer { text-align: center; padding: 30px; background: #f9fafb; color: #6b7280; font-size: 13px; }
        .footer p { margin: 5px 0; }
        .divider { height: 1px; background: #e5e7eb; margin: 25px 0; }
        @media only screen and (max-width: 600px) {
            .container { margin: 20px; }
            .content { padding: 30px 20px; }
            .header { padding: 30px 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 Prescription Shared</h1>
            <p>Secure Healthcare Document Sharing</p>
        </div>
        
        <div class="content">
            <p style="font-size: 16px; color: #1f2937;"><strong>Hello ${recipientName},</strong></p>
            
            <p><strong>${sharedBy}</strong> has securely shared a prescription with you through HealthConnect.</p>
            
            <div class="info-box">
                <strong>📋 Prescription Details:</strong>
                <ul>
                    <li><strong>Patient:</strong> ${patientName}</li>
                    <li><strong>Prescribing Doctor:</strong> ${doctorName}</li>
                    <li><strong>Shared on:</strong> ${sharedDate}</li>
                    <li><strong>Link expires:</strong> ${expiryDate}</li>
                </ul>
            </div>
            
            <center>
                <a href="${shareUrl}" class="button">📄 View Prescription</a>
            </center>
            
            <div class="divider"></div>
            
            <div class="warning">
                <strong>⚠️ Important Security Information:</strong>
                <ul>
                    <li>This link is time-limited and will expire on <strong>${expiryDate}</strong></li>
                    <li>Please do not share this link with unauthorized individuals</li>
                    <li>All access to this prescription is tracked for security purposes</li>
                    <li>If you did not expect to receive this, please contact ${sharedBy}</li>
                </ul>
            </div>
            
            <p style="margin-top: 25px; color: #6b7280; font-size: 14px;">
                If you have any questions about this prescription, please contact the person who shared it with you directly.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>HealthConnect</strong></p>
            <p>&copy; ${new Date().getFullYear()} HealthConnect. All rights reserved.</p>
            <p style="margin-top: 15px;">This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
        `.trim();
    }

    /**
     * Test email configuration
     */
    async testConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ Email service is ready to send emails');
            return { success: true };
        } catch (error) {
            console.error('❌ Email service connection failed:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new EmailService();
