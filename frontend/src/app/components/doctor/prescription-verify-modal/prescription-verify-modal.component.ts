import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DoctorPrescriptionService } from '../../../shared/services/doctor-prescription.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-prescription-verify-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prescription-verify-modal.component.html',
  styleUrl: './prescription-verify-modal.component.css'
})
export class PrescriptionVerifyModalComponent implements OnInit {
  @Input() prescription: any;
  @Output() close = new EventEmitter<void>();
  @Output() actionComplete = new EventEmitter<void>();

  loading = true;
  prescriptionDetails: any = null;

  showVerifyForm = false;
  showRejectForm = false;
  verificationNotes = '';
  rejectionReason = '';

  prescriptionFileUrl: SafeResourceUrl | null = null;
  rawFileUrl: string = '';
  fileType: 'pdf' | 'image' | 'unknown' = 'unknown';

  constructor(
    private prescriptionService: DoctorPrescriptionService,
    private snackbar: SnackbarService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    if (this.prescription && this.prescription.id) {
      this.loadPrescriptionDetails();
      this.setupFileUrl();
    }
  }

  loadPrescriptionDetails() {
    this.loading = true;
    this.prescriptionService.getPrescriptionDetails(this.prescription.id).subscribe({
      next: (details) => {
        this.prescriptionDetails = details;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading prescription details:', error);
        this.snackbar.error('Failed to load prescription details');
        this.loading = false;
      }
    });
  }

  setupFileUrl() {
    if (this.prescription.upload_file_path) {
      // Construct the raw file URL
      this.rawFileUrl = `${environment.apiUrl.replace('/api', '')}/${this.prescription.upload_file_path}`;
      console.log('Prescription file URL:', this.rawFileUrl);
      const ext = this.prescription.upload_file_path.split('.').pop()?.toLowerCase();

      if (ext === 'pdf') {
        this.fileType = 'pdf';
        this.prescriptionFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.rawFileUrl);
      } else if (['jpg', 'jpeg', 'png'].includes(ext || '')) {
        this.fileType = 'image';
        this.prescriptionFileUrl = this.rawFileUrl as any;
      } else {
        this.fileType = 'unknown';
      }
    }
  }

  closeModal() {
    this.close.emit();
  }

  openVerifyForm() {
    this.showVerifyForm = true;
    this.showRejectForm = false;
  }

  openRejectForm() {
    this.showRejectForm = true;
    this.showVerifyForm = false;
  }

  closeForms() {
    this.showVerifyForm = false;
    this.showRejectForm = false;
    this.verificationNotes = '';
    this.rejectionReason = '';
  }

  confirmVerify() {
    this.prescriptionService.verifyPrescription(this.prescription.id, this.verificationNotes).subscribe({
      next: () => {
        this.snackbar.success('Prescription verified successfully');
        this.actionComplete.emit();
      },
      error: (error) => {
        console.error('Error verifying prescription:', error);
        this.snackbar.error('Failed to verify prescription');
      }
    });
  }

  confirmReject() {
    if (!this.rejectionReason || this.rejectionReason.length < 20) {
      this.snackbar.error('Please provide a detailed reason (minimum 20 characters)');
      return;
    }

    this.prescriptionService.rejectVerification(this.prescription.id, this.rejectionReason).subscribe({
      next: () => {
        this.snackbar.success('Prescription rejected');
        this.actionComplete.emit();
      },
      error: (error) => {
        console.error('Error rejecting prescription:', error);
        this.snackbar.error('Failed to reject prescription');
      }
    });
  }

  downloadPrescription() {
    if (this.rawFileUrl) {
      window.open(this.rawFileUrl, '_blank');
    }
  }
}
