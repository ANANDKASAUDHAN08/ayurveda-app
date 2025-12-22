import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PrescriptionService, Prescription } from '../../../shared/services/prescription.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { UploadPrescriptionModalComponent } from '../upload-prescription-modal/upload-prescription-modal.component';
import { PrescriptionOrderModalComponent } from '../../shared/prescription-order-modal/prescription-order-modal.component';

@Component({
  selector: 'app-prescriptions-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UploadPrescriptionModalComponent,
    PrescriptionOrderModalComponent
  ],
  templateUrl: './prescriptions-list.component.html',
  styleUrl: './prescriptions-list.component.css'
})
export class PrescriptionsListComponent implements OnInit {
  prescriptions: Prescription[] = [];
  loading = true;
  showUploadModal = false;
  showOrderModal = false;
  selectedPrescriptionId = 0;
  filter: 'all' | 'active' | 'expired' | 'pending' = 'all';

  get filteredPrescriptions(): Prescription[] {
    if (this.filter === 'all') {
      return this.prescriptions;
    }

    return this.prescriptions.filter(p => {
      if (this.filter === 'pending') {
        return p.status === 'pending';
      } else if (this.filter === 'active') {
        return p.status === 'verified' || p.status === 'active';
      } else if (this.filter === 'expired') {
        return p.status === 'expired';
      }
      return true;
    });
  }

  constructor(
    private prescriptionService: PrescriptionService,
    private snackbar: SnackbarService
  ) { }

  ngOnInit() {
    this.loadPrescriptions();
  }

  loadPrescriptions() {
    this.loading = true;
    this.prescriptionService.getAllPrescriptions().subscribe({
      next: (data) => {
        this.prescriptions = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading prescriptions:', error);
        this.snackbar.error('Failed to load prescriptions');
        this.loading = false;
      }
    });
  }

  openUploadModal() {
    this.showUploadModal = true;
  }

  closeUploadModal() {
    this.showUploadModal = false;
  }

  onUploadSuccess() {
    this.loadPrescriptions();
    this.snackbar.success('Prescription uploaded successfully!');
  }

  getStatusColor(status: string): string {
    return this.prescriptionService.getStatusColor(status);
  }

  openOrderModal(prescriptionId: number) {
    this.selectedPrescriptionId = prescriptionId;
    this.showOrderModal = true;
  }

  closeOrderModal() {
    this.showOrderModal = false;
  }
}
