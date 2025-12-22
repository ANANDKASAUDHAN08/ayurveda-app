import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrescriptionService } from '../../../shared/services/prescription.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';

@Component({
  selector: 'app-qr-code-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-code-display.component.html',
  styleUrl: './qr-code-display.component.css'
})
export class QrCodeDisplayComponent implements OnInit {
  @Input() prescriptionId!: number;

  qrCodeData: string | null = null;
  verificationCode: string | null = null;
  loading = false;
  error: string | null = null;
  showQRCode = false;

  constructor(
    private prescriptionService: PrescriptionService,
    private snackbar: SnackbarService
  ) { }

  ngOnInit() {
    // QR code is generated on demand
  }

  generateQRCode() {
    this.loading = true;
    this.error = null;

    this.prescriptionService.generateQRCode(this.prescriptionId).subscribe({
      next: (response) => {
        this.qrCodeData = response.qr_code;
        this.verificationCode = response.verification_code;
        this.showQRCode = true;
        this.loading = false;
        this.snackbar.success('QR code generated successfully!');
      },
      error: (error) => {
        console.error('Error generating QR code:', error);
        this.error = 'Failed to generate QR code';
        this.loading = false;
        this.snackbar.error('Failed to generate QR code');
      }
    });
  }

  copyVerificationCode() {
    if (this.verificationCode) {
      navigator.clipboard.writeText(this.verificationCode).then(() => {
        this.snackbar.success('Verification code copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy:', err);
        this.snackbar.error('Failed to copy verification code');
      });
    }
  }

  downloadQRCode() {
    if (this.qrCodeData && this.verificationCode) {
      // Create a canvas to combine QR code with text
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        this.snackbar.error('Failed to create image');
        return;
      }

      // Set canvas size (wider to fit text)
      canvas.width = 800;
      canvas.height = 1000;

      // Background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 100);
      gradient.addColorStop(0, '#7C3AED'); // Purple
      gradient.addColorStop(1, '#3B82F6'); // Blue
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, 120);

      // HealthConnect Title
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HealthConnect', canvas.width / 2, 65);

      ctx.font = '24px Arial, sans-serif';
      ctx.fillText('Digital Prescription', canvas.width / 2, 100);

      // Load and draw QR code image
      const qrImage = new Image();
      qrImage.onload = () => {
        // Draw QR code (centered)
        const qrSize = 400;
        const qrX = (canvas.width - qrSize) / 2;
        const qrY = 150;

        // QR code border
        ctx.strokeStyle = '#7C3AED';
        ctx.lineWidth = 8;
        ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

        // Verification Code Section
        const codeY = qrY + qrSize + 60;

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 28px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Verification Code', canvas.width / 2, codeY);

        ctx.fillStyle = '#7C3AED';
        ctx.font = 'bold 48px monospace';
        ctx.fillText(this.verificationCode || '', canvas.width / 2, codeY + 50);

        // Instructions
        const instructionsY = codeY + 100;
        ctx.fillStyle = '#666666';
        ctx.font = '20px Arial, sans-serif';
        ctx.fillText('For Pharmacy Use:', canvas.width / 2, instructionsY);

        ctx.font = '18px Arial, sans-serif';
        const instructions = [
          '1. Scan QR code with mobile device',
          '2. Verify prescription details',
          '3. Dispense medicines as prescribed',
          '4. Mark as dispensed in system'
        ];

        instructions.forEach((text, i) => {
          ctx.fillText(text, canvas.width / 2, instructionsY + 35 + (i * 30));
        });

        // Security Notice
        const noticeY = instructionsY + 170;
        ctx.fillStyle = '#DC2626';
        ctx.font = 'bold 18px Arial, sans-serif';
        ctx.fillText('⚠️ Security Notice', canvas.width / 2, noticeY);

        ctx.fillStyle = '#666666';
        ctx.font = '16px Arial, sans-serif';
        ctx.fillText('This QR code is unique to this prescription.', canvas.width / 2, noticeY + 30);
        ctx.fillText('Do not share with unauthorized parties.', canvas.width / 2, noticeY + 55);

        // Footer
        ctx.fillStyle = '#999999';
        ctx.font = '14px Arial, sans-serif';
        ctx.fillText(`Generated on ${new Date().toLocaleDateString()}`, canvas.width / 2, noticeY + 100);

        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `prescription-qr-${this.prescriptionId}-${this.verificationCode}.png`;
            link.click();
            URL.revokeObjectURL(url);
            this.snackbar.success('QR code with details downloaded!');
          }
        }, 'image/png');
      };

      qrImage.onerror = () => {
        this.snackbar.error('Failed to load QR code image');
      };

      qrImage.src = this.qrCodeData;
    }
  }

  closeQRCode() {
    this.showQRCode = false;
  }
}
