import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PrescriptionService, ShareLink, ShareLinkData } from '../../../shared/services/prescription.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';

@Component({
  selector: 'app-share-prescription-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './share-prescription-modal.component.html',
  styleUrl: './share-prescription-modal.component.css'
})
export class SharePrescriptionModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() prescriptionId!: number;
  @Output() closeModal = new EventEmitter<void>();
  @Output() shareCreated = new EventEmitter<ShareLink>();

  shareForm!: FormGroup;
  loading = false;
  shareCreatedSuccess = false;
  generatedLink = '';

  recipientTypes = [
    { value: 'pharmacy', label: 'Pharmacy', icon: 'fa-pills', color: 'emerald' },
    { value: 'doctor', label: 'Doctor', icon: 'fa-user-doctor', color: 'blue' },
    { value: 'family', label: 'Family Member', icon: 'fa-users', color: 'purple' },
    { value: 'other', label: 'Other', icon: 'fa-share-nodes', color: 'slate' }
  ];

  expiryOptions = [
    { hours: 24, label: '24 hours (1 day)' },
    { hours: 72, label: '72 hours (3 days)' },
    { hours: 168, label: '168 hours (1 week)' }
  ];

  constructor(
    private fb: FormBuilder,
    private prescriptionService: PrescriptionService,
    private snackbar: SnackbarService
  ) { }

  ngOnInit() {
    this.shareForm = this.fb.group({
      recipient_name: [''],
      recipient_email: ['', [Validators.email]],
      recipient_type: ['pharmacy', Validators.required],
      expiry_hours: [72, Validators.required],
      send_email: [false]
    });
  }

  close() {
    this.closeModal.emit();
    this.resetForm();
  }

  resetForm() {
    this.shareForm.reset({
      recipient_name: '',
      recipient_email: '',
      recipient_type: 'pharmacy',
      expiry_hours: 72,
      send_email: false
    });
    this.shareCreatedSuccess = false;
    this.generatedLink = '';
  }

  createShare() {
    if (this.shareForm.invalid) {
      this.snackbar.error('Please fill in all required fields correctly');
      return;
    }

    const formData: ShareLinkData = this.shareForm.value;

    // Validate email if send_email is checked
    if (formData.send_email && !formData.recipient_email) {
      this.snackbar.error('Email address is required to send via email');
      return;
    }

    this.loading = true;

    this.prescriptionService.createShareLink(this.prescriptionId, formData).subscribe({
      next: (response) => {
        this.generatedLink = response.share_url;
        this.shareCreatedSuccess = true;
        this.loading = false;
        this.shareCreated.emit(response);

        if (response.email_sent) {
          this.snackbar.success('Share link created and email sent successfully!');
        } else {
          this.snackbar.success('Share link created successfully!');
        }
      },
      error: (error) => {
        console.error('Error creating share:', error);
        this.snackbar.error('Failed to create share link');
        this.loading = false;
      }
    });
  }

  copyLink() {
    navigator.clipboard.writeText(this.generatedLink).then(() => {
      this.snackbar.success('Link copied to clipboard!');
    });
  }

  shareViaEmail() {
    const subject = encodeURIComponent('Prescription Share');
    const body = encodeURIComponent(`I've shared a prescription with you. You can view it here: ${this.generatedLink}`);
    window.open(`mailto:${this.shareForm.get('recipient_email')?.value}?subject=${subject}&body=${body}`);
  }

  getSelectedType() {
    const type = this.shareForm.get('recipient_type')?.value;
    return this.recipientTypes.find(t => t.value === type);
  }
}
