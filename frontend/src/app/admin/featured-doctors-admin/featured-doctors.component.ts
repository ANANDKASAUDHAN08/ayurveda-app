import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
    selector: 'app-featured-doctors',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './featured-doctors.component.html',
    styleUrl: './featured-doctors.component.css'
})
export class FeaturedDoctorsComponent implements OnInit {
    featuredDoctors: any[] = [];
    allDoctors: any[] = [];  // For dropdown when adding new
    loading = true;
    showModal = false;
    modalMode: 'add' | 'edit' = 'add';

    selectedDoctor = {
        id: 0,
        doctor_id: 0,
        display_order: 0,
        is_active: true
    };

    constructor(
        private adminService: AdminService,
        private snackbarService: SnackbarService
    ) { }

    ngOnInit() {
        this.loadFeaturedDoctors();
        this.loadAllDoctors();
    }

    loadAllDoctors() {
        this.adminService.getAllDoctors().subscribe({
            next: (response) => {
                this.allDoctors = Array.isArray(response) ? response : (response.doctors || []);
            },
            error: (error) => {
                console.error('Error loading doctors:', error);
            }
        });
    }

    loadFeaturedDoctors() {
        this.loading = true;
        this.adminService.getFeaturedDoctors().subscribe({
            next: (response) => {
                this.featuredDoctors = response.featuredDoctors || [];
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading featured doctors:', error);
                this.snackbarService.show('Failed to load featured doctors', 'error');
                this.loading = false;
            }
        });
    }

    openAddModal() {
        this.modalMode = 'add';
        this.selectedDoctor = {
            id: 0,
            doctor_id: 0,
            display_order: this.featuredDoctors.length + 1,
            is_active: true
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
            this.adminService.addFeaturedDoctor(this.selectedDoctor).subscribe({
                next: () => {
                    this.snackbarService.show('Featured doctor added successfully', 'success');
                    this.loadFeaturedDoctors();
                    this.closeModal();
                },
                error: (error) => {
                    console.error('Error adding featured doctor:', error);
                    this.snackbarService.show('Failed to add featured doctor', 'error');
                }
            });
        } else {
            this.adminService.updateFeaturedDoctor(this.selectedDoctor.id, this.selectedDoctor).subscribe({
                next: () => {
                    this.snackbarService.show('Featured doctor updated successfully', 'success');
                    this.loadFeaturedDoctors();
                    this.closeModal();
                },
                error: (error) => {
                    console.error('Error updating featured doctor:', error);
                    this.snackbarService.show('Failed to update featured doctor', 'error');
                }
            });
        }
    }

    delete(id: number) {
        if (confirm('Are you sure you want to remove this featured doctor?')) {
            this.adminService.deleteFeaturedDoctor(id).subscribe({
                next: () => {
                    this.snackbarService.show('Featured doctor removed successfully', 'success');
                    this.loadFeaturedDoctors();
                },
                error: (error) => {
                    console.error('Error deleting featured doctor:', error);
                    this.snackbarService.show('Failed to remove featured doctor', 'error');
                }
            });
        }
    }

    toggleActive(doctor: any) {
        const updated = { ...doctor, is_active: !doctor.is_active };
        this.adminService.updateFeaturedDoctor(doctor.id, updated).subscribe({
            next: () => {
                this.loadFeaturedDoctors();
                this.snackbarService.show(updated.is_active ? 'Doctor activated' : 'Doctor deactivated', 'success');
            },
            error: (error) => {
                console.error('Error toggling active status:', error);
                this.snackbarService.show('Failed to update status', 'error');
            }
        });
    }
}
