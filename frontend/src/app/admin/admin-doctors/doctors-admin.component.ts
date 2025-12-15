import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
    selector: 'app-doctors-admin',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './doctors-admin.component.html',
    styleUrl: './doctors-admin.component.css'
})
export class DoctorsAdminComponent implements OnInit {
    doctors: any[] = [];
    loading = true;
    showModal = false;
    modalMode: 'add' | 'edit' = 'add';

    selectedDoctor = {
        id: 0,
        userId: 0,
        name: '',
        specialization: '',
        experience: 0,
        mode: 'online',
        location: '',
        about: '',
        qualifications: '',
        consultationFee: 0,
        languages: '',
        image: '',
        phone: '',
        registration_number: '',
        title: 'Dr.',
        clinic_name: '',
        clinic_address: '',
        clinic_timings: ''
    };

    constructor(
        private adminService: AdminService,
        private snackbarService: SnackbarService
    ) { }

    ngOnInit() {
        this.loadDoctors();
    }

    loadDoctors() {
        this.loading = true;
        this.adminService.getAllDoctors().subscribe({
            next: (response) => {
                this.doctors = Array.isArray(response) ? response : (response.doctors || []);
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading doctors:', error);
                this.snackbarService.show('Failed to load doctors', 'error');
                this.loading = false;
            }
        });
    }

    openAddModal() {
        this.modalMode = 'add';
        this.selectedDoctor = {
            id: 0,
            userId: 0,
            name: '',
            specialization: '',
            experience: 0,
            mode: 'online',
            location: '',
            about: '',
            qualifications: '',
            consultationFee: 0,
            languages: 'English',
            image: '/assets/images/default-doctor.png',
            phone: '',
            registration_number: '',
            title: 'Dr.',
            clinic_name: '',
            clinic_address: '',
            clinic_timings: '9 AM - 5 PM'
        };
        this.showModal = true;
    }

    openEditModal(doctor: any) {
        this.modalMode = 'edit';
        this.selectedDoctor = { ...doctor };
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }

    save() {
        if (this.modalMode === 'add') {
            this.adminService.addDoctor(this.selectedDoctor).subscribe({
                next: () => {
                    this.snackbarService.show('Doctor added successfully', 'success');
                    this.loadDoctors();
                    this.closeModal();
                },
                error: (error) => {
                    console.error('Error adding doctor:', error);
                    this.snackbarService.show('Failed to add doctor. ' + (error.error?.message || ''), 'error');
                }
            });
        } else {
            this.adminService.updateDoctor(this.selectedDoctor.id, this.selectedDoctor).subscribe({
                next: () => {
                    this.snackbarService.show('Doctor updated successfully', 'success');
                    this.loadDoctors();
                    this.closeModal();
                },
                error: (error) => {
                    console.error('Error updating doctor:', error);
                    this.snackbarService.show('Failed to update doctor', 'error');
                }
            });
        }
    }

    delete(id: number) {
        if (confirm('Are you sure you want to delete this doctor? This action cannot be undone.')) {
            this.adminService.deleteDoctor(id).subscribe({
                next: () => {
                    this.snackbarService.show('Doctor deleted successfully', 'success');
                    this.loadDoctors();
                },
                error: (error) => {
                    console.error('Error deleting doctor:', error);
                    this.snackbarService.show('Failed to delete doctor', 'error');
                }
            });
        }
    }
}
