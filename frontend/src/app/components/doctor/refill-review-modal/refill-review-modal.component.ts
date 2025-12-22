import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorRefillService } from '../../../shared/services/doctor-refill.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';

@Component({
  selector: 'app-refill-review-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './refill-review-modal.component.html',
  styleUrl: './refill-review-modal.component.css'
})
export class RefillReviewModalComponent implements OnInit {
  @Input() refill: any;
  @Output() close = new EventEmitter<void>();
  @Output() action = new EventEmitter<void>();

  loading = true;
  refillDetails: any = null;

  showApproveForm = false;
  showRejectForm = false;
  doctorNotes = '';
  rejectionReason = '';

  constructor(
    private doctorRefillService: DoctorRefillService,
    private snackbar: SnackbarService
  ) { }

  ngOnInit() {
    if (this.refill && this.refill.id) {
      this.loadRefillDetails();
    }
  }

  loadRefillDetails() {
    this.loading = true;
    this.doctorRefillService.getRefillDetails(this.refill.id).subscribe({
      next: (details) => {
        this.refillDetails = details;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading refill details:', error);
        this.snackbar.error('Failed to load refill details');
        this.loading = false;
      }
    });
  }

  closeModal() {
    this.close.emit();
  }

  openApproveForm() {
    this.showApproveForm = true;
    this.showRejectForm = false;
  }

  openRejectForm() {
    this.showRejectForm = true;
    this.showApproveForm = false;
  }

  closeForms() {
    this.showApproveForm = false;
    this.showRejectForm = false;
    this.doctorNotes = '';
    this.rejectionReason = '';
  }

  confirmApprove() {
    this.doctorRefillService.approveRefill(this.refill.id, this.doctorNotes).subscribe({
      next: () => {
        this.snackbar.success('Refill approved successfully');
        this.action.emit();
      },
      error: (error) => {
        console.error('Error approving refill:', error);
        this.snackbar.error('Failed to approve refill');
      }
    });
  }

  confirmReject() {
    if (!this.rejectionReason || this.rejectionReason.length < 10) {
      this.snackbar.error('Please provide a reason (minimum 10 characters)');
      return;
    }

    this.doctorRefillService.rejectRefill(this.refill.id, this.rejectionReason).subscribe({
      next: () => {
        this.snackbar.success('Refill rejected');
        this.action.emit();
      },
      error: (error) => {
        console.error('Error rejecting refill:', error);
        this.snackbar.error('Failed to reject refill');
      }
    });
  }
}
