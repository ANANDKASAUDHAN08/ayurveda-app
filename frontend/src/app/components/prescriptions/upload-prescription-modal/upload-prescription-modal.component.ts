import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { PrescriptionService } from '../../../shared/services/prescription.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-upload-prescription-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './upload-prescription-modal.component.html',
  styleUrl: './upload-prescription-modal.component.css'
})
export class UploadPrescriptionModalComponent {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() uploadSuccess = new EventEmitter<void>();

  uploadForm: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isDragging = false;
  isUploading = false;

  // Doctor search
  doctors: any[] = [];
  showDoctorDropdown = false;
  searchingDoctors = false;
  private doctorSearchSubject = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private prescriptionService: PrescriptionService,
    private snackbar: SnackbarService
  ) {
    this.uploadForm = this.fb.group({
      doctor_name: [''],
      doctor_id: [null],
      issue_date: ['', Validators.required],
      expiry_date: [''],
      notes: [''],
      medicines: this.fb.array([this.createMedicineGroup()])
    });

    // Setup doctor search
    this.doctorSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(searchTerm => this.searchDoctors(searchTerm))
    ).subscribe(doctors => {
      this.doctors = doctors;
      this.searchingDoctors = false;
      this.showDoctorDropdown = doctors.length > 0;
    });
  }

  get medicines(): FormArray {
    return this.uploadForm.get('medicines') as FormArray;
  }

  createMedicineGroup(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      dosage: [''],
      frequency: [''],
      duration: [''],
      quantity: [null],
      instructions: ['']
    });
  }

  addMedicine() {
    this.medicines.push(this.createMedicineGroup());
  }

  removeMedicine(index: number) {
    if (this.medicines.length > 1) {
      this.medicines.removeAt(index);
    }
  }

  // File handling
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;

    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  handleFile(file: File) {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      this.snackbar.error('Only JPEG, PNG, and PDF files are allowed');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.snackbar.error('File size must be less than 10MB');
      return;
    }

    this.selectedFile = file;

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      this.previewUrl = null;
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  triggerFileInput() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput?.click();
  }

  async onSubmit() {
    if (this.uploadForm.invalid) {
      this.snackbar.error('Please fill all required fields');
      return;
    }

    if (!this.selectedFile) {
      this.snackbar.error('Please select a prescription file');
      return;
    }

    this.isUploading = true;

    const formData = new FormData();
    formData.append('prescription_file', this.selectedFile);
    formData.append('doctor_id', this.uploadForm.value.doctor_id || '');
    formData.append('issue_date', this.uploadForm.value.issue_date);
    formData.append('expiry_date', this.uploadForm.value.expiry_date || '');
    formData.append('notes', this.uploadForm.value.notes || '');
    formData.append('medicines', JSON.stringify(this.uploadForm.value.medicines));

    try {
      await this.prescriptionService.uploadPrescription(formData).toPromise();
      this.snackbar.success('Prescription uploaded successfully! Pending verification.');
      this.uploadSuccess.emit();
      this.close();
    } catch (error) {
      console.error('Upload error:', error);
      this.snackbar.error('Failed to upload prescription');
    } finally {
      this.isUploading = false;
    }
  }

  close() {
    this.uploadForm.reset();
    this.selectedFile = null;
    this.previewUrl = null;
    this.medicines.clear();
    this.medicines.push(this.createMedicineGroup());
    this.doctors = [];
    this.showDoctorDropdown = false;
    this.closeModal.emit();
  }

  // Doctor search methods
  searchDoctors(searchTerm: string) {
    if (!searchTerm || searchTerm.length < 2) {
      this.doctors = [];
      this.showDoctorDropdown = false;
      return [];
    }

    return this.http.get<any[]>(`${environment.apiUrl}/doctors?search=${searchTerm}&limit=10`);
  }

  onDoctorNameChange(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value;
    if (searchTerm.length < 2) {
      this.doctors = [];
      this.showDoctorDropdown = false;
      this.uploadForm.patchValue({ doctor_id: null });
      return;
    }
    this.searchingDoctors = true;
    this.doctorSearchSubject.next(searchTerm);
  }

  selectDoctor(doctor: any) {
    this.uploadForm.patchValue({
      doctor_name: doctor.name,
      doctor_id: doctor.id
    });
    this.showDoctorDropdown = false;
    this.doctors = [];
  }
}
