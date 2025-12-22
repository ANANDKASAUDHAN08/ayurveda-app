import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorPrescriptionService } from '../../../shared/services/doctor-prescription.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { PrescriptionVerifyModalComponent } from '../prescription-verify-modal/prescription-verify-modal.component';

@Component({
  selector: 'app-prescription-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, PrescriptionVerifyModalComponent],
  templateUrl: './prescription-verification.component.html',
  styleUrl: './prescription-verification.component.css'
})
export class PrescriptionVerificationComponent implements OnInit {
  prescriptions: any[] = [];
  stats: any = {
    pending_count: 0,
    verified_today: 0,
    rejected_today: 0
  };

  loading = true;
  filters = {
    status: 'pending',
    patient: '',
    limit: 20,
    offset: 0
  };

  selectedPrescription: any = null;
  showVerifyModal = false;

  constructor(
    private prescriptionService: DoctorPrescriptionService,
    private snackbar: SnackbarService
  ) { }

  ngOnInit() {
    this.loadPrescriptions();
  }

  loadPrescriptions() {
    this.loading = true;
    this.prescriptionService.getUnverifiedPrescriptions(this.filters).subscribe({
      next: (response) => {
        this.prescriptions = response.prescriptions || [];
        this.stats = response.stats || this.stats;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading prescriptions:', error);
        this.snackbar.error('Failed to load prescriptions');
        this.loading = false;
      }
    });
  }

  onFilterChange() {
    this.filters.offset = 0;
    this.loadPrescriptions();
  }

  onSearchChange() {
    // Debounce search
    if (this.filters.patient.length >= 2 || this.filters.patient.length === 0) {
      this.onFilterChange();
    }
  }

  viewPrescription(prescription: any) {
    this.selectedPrescription = prescription;
    this.showVerifyModal = true;
  }

  closeModal() {
    this.showVerifyModal = false;
    this.selectedPrescription = null;
  }

  onActionComplete() {
    this.closeModal();
    this.loadPrescriptions();
  }

  quickVerify(prescription: any, event: Event) {
    event.stopPropagation();

    if (confirm(`Verify prescription for ${prescription.patient_name}?`)) {
      this.prescriptionService.verifyPrescription(prescription.id).subscribe({
        next: () => {
          this.snackbar.success('Prescription verified successfully');
          this.loadPrescriptions();
        },
        error: (error) => {
          console.error('Error verifying prescription:', error);
          this.snackbar.error('Failed to verify prescription');
        }
      });
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  timeAgo(date: string): string {
    const now = new Date();
    const uploadDate = new Date(date);
    const diffMs = now.getTime() - uploadDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  }

  isPrescriptionFile(filename: string): string {
    if (!filename) return 'unknown';
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png'].includes(ext || '')) return 'image';
    return 'unknown';
  }
}
