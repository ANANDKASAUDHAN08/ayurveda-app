import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface MedicalInformation {
  blood_type?: string;
  allergies: string[];
  medical_conditions: string[];
  current_medications: string[];
  primary_doctor_name?: string;
  primary_doctor_phone?: string;
}

@Component({
  selector: 'app-medical-info-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medical-info-modal.component.html',
  styleUrl: './medical-info-modal.component.css'
})
export class MedicalInfoModalComponent {
  @Input() isOpen = false;
  @Input() medicalInfo: MedicalInformation | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<MedicalInformation>();

  formData: MedicalInformation = {
    blood_type: '',
    allergies: [],
    medical_conditions: [],
    current_medications: [],
    primary_doctor_name: '',
    primary_doctor_phone: ''
  };

  // Temporary strings for adding items
  newAllergy = '';
  newCondition = '';
  newMedication = '';

  bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  ngOnChanges() {
    if (this.medicalInfo) {
      this.formData = {
        blood_type: this.medicalInfo.blood_type || '',
        allergies: Array.isArray(this.medicalInfo.allergies) ? [...this.medicalInfo.allergies] : [],
        medical_conditions: Array.isArray(this.medicalInfo.medical_conditions) ? [...this.medicalInfo.medical_conditions] : [],
        current_medications: Array.isArray(this.medicalInfo.current_medications) ? [...this.medicalInfo.current_medications] : [],
        primary_doctor_name: this.medicalInfo.primary_doctor_name || '',
        primary_doctor_phone: this.medicalInfo.primary_doctor_phone || ''
      };
    } else {
      this.resetForm();
    }
  }

  resetForm() {
    this.formData = {
      blood_type: '',
      allergies: [],
      medical_conditions: [],
      current_medications: [],
      primary_doctor_name: '',
      primary_doctor_phone: ''
    };
    this.newAllergy = '';
    this.newCondition = '';
    this.newMedication = '';
  }

  addAllergy() {
    if (this.newAllergy.trim()) {
      this.formData.allergies.push(this.newAllergy.trim());
      this.newAllergy = '';
    }
  }

  removeAllergy(index: number) {
    this.formData.allergies.splice(index, 1);
  }

  addCondition() {
    if (this.newCondition.trim()) {
      this.formData.medical_conditions.push(this.newCondition.trim());
      this.newCondition = '';
    }
  }

  removeCondition(index: number) {
    this.formData.medical_conditions.splice(index, 1);
  }

  addMedication() {
    if (this.newMedication.trim()) {
      this.formData.current_medications.push(this.newMedication.trim());
      this.newMedication = '';
    }
  }

  removeMedication(index: number) {
    this.formData.current_medications.splice(index, 1);
  }

  onClose() {
    this.resetForm();
    this.close.emit();
  }

  onSave() {
    this.save.emit(this.formData);
    this.resetForm();
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }
}
