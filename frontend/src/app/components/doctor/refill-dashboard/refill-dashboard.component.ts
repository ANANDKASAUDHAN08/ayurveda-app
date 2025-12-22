import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorRefillService, DashboardStats } from '../../../shared/services/doctor-refill.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { RefillReviewModalComponent } from '../refill-review-modal/refill-review-modal.component';

@Component({
  selector: 'app-refill-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RefillReviewModalComponent],
  templateUrl: './refill-dashboard.component.html',
  styleUrl: './refill-dashboard.component.css'
})
export class RefillDashboardComponent implements OnInit {
  loading = true;
  stats: DashboardStats = {
    total: 0,
    pending_count: 0,
    approved_today: 0,
    rejected_today: 0,
    urgent_count: 0
  };

  refills: any[] = [];
  selectedRefills: Set<number> = new Set();

  // Filters
  statusFilter = 'pending';
  patientSearch = '';
  sortBy = 'requested_at';
  sortOrder = 'desc';

  // Pagination
  limit = 20;
  offset = 0;
  total = 0;

  // Modal state
  showReviewModal = false;
  selectedRefill: any = null;

  // Bulk action state
  showBulkApproveForm = false;
  showBulkRejectForm = false;
  bulkNotes = '';
  bulkRejectionReason = '';

  constructor(
    private doctorRefillService: DoctorRefillService,
    private snackbar: SnackbarService
  ) { }

  ngOnInit() {
    this.loadStats();
    this.loadRefills();
  }

  loadStats() {
    this.doctorRefillService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  loadRefills() {
    this.loading = true;

    const filters = {
      status: this.statusFilter,
      patient: this.patientSearch || undefined,
      sortBy: this.sortBy,
      order: this.sortOrder,
      limit: this.limit,
      offset: this.offset
    };

    this.doctorRefillService.getDoctorRefills(filters).subscribe({
      next: (response) => {
        this.refills = response.refills;
        this.total = response.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading refills:', error);
        this.snackbar.error('Failed to load refills');
        this.loading = false;
      }
    });
  }

  onFilterChange() {
    this.offset = 0;
    this.selectedRefills.clear();
    this.loadRefills();
  }

  onSearchChange() {
    // Debounce search
    this.offset = 0;
    this.selectedRefills.clear();
    this.loadRefills();
  }

  toggleSelection(refillId: number) {
    if (this.selectedRefills.has(refillId)) {
      this.selectedRefills.delete(refillId);
    } else {
      this.selectedRefills.add(refillId);
    }
  }

  toggleSelectAll() {
    if (this.selectedRefills.size === this.refills.length) {
      this.selectedRefills.clear();
    } else {
      this.selectedRefills.clear();
      this.refills.forEach(refill => this.selectedRefills.add(refill.id));
    }
  }

  get isAllSelected(): boolean {
    return this.refills.length > 0 && this.selectedRefills.size === this.refills.length;
  }

  get selectedCount(): number {
    return this.selectedRefills.size;
  }

  viewRefill(refill: any) {
    this.selectedRefill = refill;
    this.showReviewModal = true;
  }

  closeReviewModal() {
    this.showReviewModal = false;
    this.selectedRefill = null;
  }

  onRefillAction() {
    this.closeReviewModal();
    this.loadRefills();
    this.loadStats();
    this.selectedRefills.clear();
  }

  // Bulk actions
  openBulkApprove() {
    if (this.selectedCount === 0) {
      this.snackbar.error('Please select at least one refill');
      return;
    }
    this.showBulkApproveForm = true;
  }

  openBulkReject() {
    if (this.selectedCount === 0) {
      this.snackbar.error('Please select at least one refill');
      return;
    }
    this.showBulkRejectForm = true;
  }

  closeBulkForms() {
    this.showBulkApproveForm = false;
    this.showBulkRejectForm = false;
    this.bulkNotes = '';
    this.bulkRejectionReason = '';
  }

  confirmBulkApprove() {
    const refillIds = Array.from(this.selectedRefills);

    this.doctorRefillService.bulkApproveRefills(refillIds, this.bulkNotes).subscribe({
      next: (response) => {
        this.snackbar.success(`${response.approved_count} refill(s) approved successfully`);
        this.closeBulkForms();
        this.loadRefills();
        this.loadStats();
        this.selectedRefills.clear();
      },
      error: (error) => {
        console.error('Error approving refills:', error);
        this.snackbar.error('Failed to approve refills');
      }
    });
  }

  confirmBulkReject() {
    if (!this.bulkRejectionReason || this.bulkRejectionReason.length < 10) {
      this.snackbar.error('Please provide a reason (minimum 10 characters)');
      return;
    }

    const refillIds = Array.from(this.selectedRefills);

    this.doctorRefillService.bulkRejectRefills(refillIds, this.bulkRejectionReason).subscribe({
      next: (response) => {
        this.snackbar.success(`${response.rejected_count} refill(s) rejected`);
        this.closeBulkForms();
        this.loadRefills();
        this.loadStats();
        this.selectedRefills.clear();
      },
      error: (error) => {
        console.error('Error rejecting refills:', error);
        this.snackbar.error('Failed to reject refills');
      }
    });
  }

  // Quick actions
  quickApprove(refill: any) {
    if (confirm(`Approve refill request from ${refill.patient_name}?`)) {
      this.doctorRefillService.approveRefill(refill.id).subscribe({
        next: () => {
          this.snackbar.success('Refill approved successfully');
          this.loadRefills();
          this.loadStats();
        },
        error: (error) => {
          console.error('Error approving refill:', error);
          this.snackbar.error('Failed to approve refill');
        }
      });
    }
  }

  quickReject(refill: any) {
    const reason = prompt(`Rejection reason for ${refill.patient_name}:`);
    if (reason && reason.length >= 10) {
      this.doctorRefillService.rejectRefill(refill.id, reason).subscribe({
        next: () => {
          this.snackbar.success('Refill rejected');
          this.loadRefills();
          this.loadStats();
        },
        error: (error) => {
          console.error('Error rejecting refill:', error);
          this.snackbar.error('Failed to reject refill');
        }
      });
    } else if (reason) {
      this.snackbar.error('Rejection reason must be at least 10 characters');
    }
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'completed': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getTimeAgo(date: string): string {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  }
}
