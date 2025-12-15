import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
    selector: 'app-hospitals-admin',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './hospitals-admin.component.html',
    styleUrl: './hospitals-admin.component.css'
})
export class HospitalsAdminComponent implements OnInit {
    hospitals: any[] = [];
    loading = true;
    showModal = false;
    modalMode: 'add' | 'edit' = 'add';

    selectedHospital = {
        id: 0,
        name: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: '',
        specialties: '',
        facilities: '',
        rating: 0,
        image_url: '',
        is_active: true
    };

    constructor(
        private adminService: AdminService,
        private snackbarService: SnackbarService
    ) { }

    ngOnInit() {
        this.loadHospitals();
    }

    loadHospitals() {
        this.loading = true;
        this.adminService.getHospitals().subscribe({
            next: (response) => {
                this.hospitals = response.hospitals || [];
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading hospitals:', error);
                this.snackbarService.show('Failed to load hospitals', 'error');
                this.loading = false;
            }
        });
    }

    openAddModal() {
        this.modalMode = 'add';
        this.selectedHospital = {
            id: 0,
            name: '',
            address: '',
            city: '',
            state: '',
            pincode: '',
            phone: '',
            email: '',
            specialties: '',
            facilities: '',
            rating: 0,
            image_url: '',
            is_active: true
        };
        this.showModal = true;
    }

    openEditModal(hospital: any) {
        this.modalMode = 'edit';
        this.selectedHospital = { ...hospital };
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }

    save() {
        if (this.modalMode === 'add') {
            this.adminService.addHospital(this.selectedHospital).subscribe({
                next: () => {
                    this.snackbarService.show('Hospital added successfully', 'success');
                    this.loadHospitals();
                    this.closeModal();
                },
                error: (error) => {
                    console.error('Error adding hospital:', error);
                    this.snackbarService.show('Failed to add hospital', 'error');
                }
            });
        } else {
            this.adminService.updateHospital(this.selectedHospital.id, this.selectedHospital).subscribe({
                next: () => {
                    this.snackbarService.show('Hospital updated successfully', 'success');
                    this.loadHospitals();
                    this.closeModal();
                },
                error: (error) => {
                    console.error('Error updating hospital:', error);
                    this.snackbarService.show('Failed to update hospital', 'error');
                }
            });
        }
    }

    delete(id: number) {
        if (confirm('Are you sure you want to delete this hospital?')) {
            this.adminService.deleteHospital(id).subscribe({
                next: () => {
                    this.snackbarService.show('Hospital deleted successfully', 'success');
                    this.loadHospitals();
                },
                error: (error) => {
                    console.error('Error deleting hospital:', error);
                    this.snackbarService.show('Failed to delete hospital', 'error');
                }
            });
        }
    }

    toggleActive(hospital: any) {
        const updated = { ...hospital, is_active: !hospital.is_active };
        this.adminService.updateHospital(hospital.id, updated).subscribe({
            next: () => {
                this.loadHospitals();
                this.snackbarService.show(updated.is_active ? 'Hospital activated' : 'Hospital deactivated', 'success');
            },
            error: (error) => {
                console.error('Error toggling active status:', error);
                this.snackbarService.show('Failed to update status', 'error');
            }
        });
    }
}
