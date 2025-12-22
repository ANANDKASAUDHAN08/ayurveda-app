import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PrescriptionService } from '../../../shared/services/prescription.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';

@Component({
  selector: 'app-refill-request-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './refill-request-modal.component.html',
  styleUrl: './refill-request-modal.component.css'
})
export class RefillRequestModalComponent implements OnInit {
  @Input() prescriptionId!: number;
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  refillForm!: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private prescriptionService: PrescriptionService,
    private snackbar: SnackbarService
  ) { }

  ngOnInit() {
    this.refillForm = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(10)]],
      preferred_pharmacy: [''],
      patient_notes: ['']
    });
  }

  onSubmit() {
    if (this.refillForm.valid) {
      this.loading = true;

      this.prescriptionService.requestRefill(this.prescriptionId, this.refillForm.value).subscribe({
        next: (response) => {
          this.loading = false;
          this.snackbar.success('Refill request submitted successfully!');
          this.success.emit();
          this.closeModal();
        },
        error: (error) => {
          this.loading = false;
          console.error('Error requesting refill:', error);
          const errorMessage = error.error?.error || 'Failed to submit refill request';
          this.snackbar.error(errorMessage);
        }
      });
    } else {
      Object.keys(this.refillForm.controls).forEach(key => {
        const control = this.refillForm.get(key);
        if (control && control.invalid) {
          control.markAsTouched();
        }
      });
      this.snackbar.error('Please fill in all required fields');
    }
  }

  closeModal() {
    this.close.emit();
  }
}
