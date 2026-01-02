import { environment } from '@env/environment';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule, ActivatedRoute } from '@angular/router';

import { Prescription, PrescriptionService } from 'src/app/shared/services/prescription.service';
import { SnackbarService } from 'src/app/shared/services/snackbar.service';
import { QrCodeDisplayComponent } from '../qr-code-display/qr-code-display.component';
import { RefillRequestModalComponent } from '../refill-request-modal/refill-request-modal.component';
import { SharePrescriptionModalComponent } from '../share-prescription-modal/share-prescription-modal.component';

@Component({
  selector: 'app-prescription-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, SharePrescriptionModalComponent, QrCodeDisplayComponent, RefillRequestModalComponent],
  templateUrl: './prescription-detail.component.html',
  styleUrl: './prescription-detail.component.css'
})
export class PrescriptionDetailComponent implements OnInit {
  environment = environment;
  prescription: Prescription | null = null;
  loading = true;
  prescriptionId: number = 0;
  downloadingPDF = false;
  showShareModal = false;
  showRefillModal = false;
  shares: any[] = [];
  loadingShares = false;
  refills: any[] = [];
  loadingRefills = false;

  constructor(
    private route: ActivatedRoute,
    private prescriptionService: PrescriptionService,
    private snackbar: SnackbarService
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.prescriptionId = +params['id'];
      this.loadPrescription();
      this.loadShareHistory();
      this.loadRefillHistory();
    });
  }

  loadPrescription() {
    this.loading = true;
    this.prescriptionService.getPrescriptionById(this.prescriptionId).subscribe({
      next: (data) => {
        this.prescription = data;
        this.loading = false;
      },
      error: (error) => {
        this.snackbar.error('Failed to load prescription details');
        this.loading = false;
      }
    });
  }

  getStatusColor(status: string): string {
    return this.prescriptionService.getStatusColor(status);
  }

  getDaysUntilExpiry(): number {
    if (!this.prescription) return 0;
    return this.prescriptionService.getDaysUntilExpiry(this.prescription);
  }

  isExpiringSoon(): boolean {
    if (!this.prescription) return false;
    return this.prescriptionService.isExpiringSoon(this.prescription);
  }

  isExpired(): boolean {
    if (!this.prescription) return false;
    return this.prescriptionService.isPrescriptionExpired(this.prescription);
  }

  downloadPDF() {
    if (!this.prescription) return;

    this.downloadingPDF = true;
    this.prescriptionService.generatePDF(this.prescription.id).subscribe({
      next: (response) => {
        // Open the generated PDF in a new tab
        const baseUrl = environment.apiUrl.replace('/api', '');
        window.open(`${baseUrl}${response.pdf_url}`, '_blank');
        this.snackbar.success('PDF generated successfully!');
        this.downloadingPDF = false;
      },
      error: (error) => {
        this.snackbar.error('Failed to generate PDF');
        this.downloadingPDF = false;
      }
    });
  }

  openShareModal() {
    this.showShareModal = true;
  }

  closeShareModal() {
    this.showShareModal = false;
  }

  onShareCreated() {
    this.showShareModal = false;
    this.snackbar.success('Prescription shared successfully!');
    this.loadShareHistory(); // Reload share history
  }

  loadShareHistory() {
    this.loadingShares = true;
    this.prescriptionService.getUserShares(this.prescriptionId).subscribe({
      next: (shares) => {
        this.shares = shares;
        this.loadingShares = false;
      },
      error: (error) => {
        this.loadingShares = false;
      }
    });
  }

  revokeShare(shareId: number) {
    if (!confirm('Are you sure you want to revoke this share link? It will no longer be accessible.')) {
      return;
    }

    this.prescriptionService.revokeShare(shareId).subscribe({
      next: (response) => {
        this.snackbar.success('Share link revoked successfully');
        this.loadShareHistory(); // Reload list
      },
      error: (error) => {
        this.snackbar.error('Failed to revoke share link: ' + (error.error?.error || error.message));
      }
    });
  }

  isShareExpired(expiryDate: string): boolean {
    return new Date(expiryDate) < new Date();
  }

  copyShareLink(token: string) {
    const frontendUrl = window.location.origin;
    const shareUrl = `${frontendUrl}/share/rx/${token}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      this.snackbar.success('Share link copied to clipboard!');
    });
  }

  openRefillModal() {
    this.showRefillModal = true;
  }

  closeRefillModal() {
    this.showRefillModal = false;
  }

  onRefillSuccess() {
    this.showRefillModal = false;
    // Reload prescription and refill history
    this.loadPrescription();
    this.loadRefillHistory();
  }

  loadRefillHistory() {
    this.loadingRefills = true;
    this.prescriptionService.getRefillHistory(this.prescriptionId).subscribe({
      next: (data) => {
        this.refills = data;
        this.loadingRefills = false;
      },
      error: (error) => {
        console.error('Error loading refill history:', error);
        this.loadingRefills = false;
      }
    });
  }

  getRefillStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'pending': 'yellow',
      'approved': 'green',
      'rejected': 'red',
      'completed': 'blue',
      'cancelled': 'gray'
    };
    return colors[status] || 'gray';
  }
}
