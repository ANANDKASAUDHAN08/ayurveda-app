import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface EmergencyContact {
  id?: number;
  name: string;
  phone_number: string;
  relationship?: string;
  is_primary?: boolean;
}

@Component({
  selector: 'app-emergency-contact-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './emergency-contact-modal.component.html',
  styleUrl: './emergency-contact-modal.component.css'
})
export class EmergencyContactModalComponent {
  @Input() isOpen = false;
  @Input() contact: EmergencyContact | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<EmergencyContact>();

  formData: EmergencyContact = {
    name: '',
    phone_number: '',
    relationship: '',
    is_primary: false
  };

  ngOnChanges() {
    if (this.contact) {
      this.formData = { ...this.contact };
    } else {
      this.resetForm();
    }
  }

  resetForm() {
    this.formData = {
      name: '',
      phone_number: '',
      relationship: '',
      is_primary: false
    };
  }

  onClose() {
    this.resetForm();
    this.close.emit();
  }

  onSave() {
    if (this.formData.name && this.formData.phone_number) {
      this.save.emit(this.formData);
      this.resetForm();
    }
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }
}
