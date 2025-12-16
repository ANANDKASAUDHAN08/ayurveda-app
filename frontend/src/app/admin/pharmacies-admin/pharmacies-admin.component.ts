import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../shared/services/admin.service';
import { SnackbarService } from '../../shared/services/snackbar.service';

@Component({
    selector: 'app-pharmacies-admin',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './pharmacies-admin.component.html',
    styleUrl: './pharmacies-admin.component.css'
})
export class PharmaciesAdminComponent implements OnInit {
    pharmacies: any[] = [];
    loading = true;
    showModal = false;
    modalMode: 'add' | 'edit' = 'add';

    selectedPharmacy = {
        id: 0,
        name: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: '',
        is_24x7: false,
        delivery_available: false,
        rating: 0,
        image_url: '',
        is_active: true
    };

    constructor(
        private adminService: AdminService,
        private snackbarService: SnackbarService
    ) { }

    ngOnInit() {
        this.loadPharmacies();
    }

    loadPharmacies() {
        this.loading = true;
        this.adminService.getPharmacies().subscribe({
            next: (response) => {
                this.pharmacies = response.pharmacies || [];
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading pharmacies:', error);
                this.snackbarService.show('Failed to load pharmacies', 'error');
                this.loading = false;
            }
        });
    }

    openAddModal() {
        this.modalMode = 'add';
        this.selectedPharmacy = {
            id: 0,
            name: '',
            address: '',
            city: '',
            state: '',
            pincode: '',
            phone: '',
            email: '',
            is_24x7: false,
            delivery_available: false,
            rating: 0,
            image_url: '',
            is_active: true
        };
        this.showModal = true;
    }

    openEditModal(pharmacy: any) {
        this.modalMode = 'edit';
        this.selectedPharmacy = { ...pharmacy };
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }

    save() {
        if (this.modalMode === 'add') {
            this.adminService.addPharmacy(this.selectedPharmacy).subscribe({
                next: () => {
                    this.snackbarService.show('Pharmacy added successfully', 'success');
                    this.loadPharmacies();
                    this.closeModal();
                },
                error: (error) => {
                    console.error('Error adding pharmacy:', error);
                    this.snackbarService.show('Failed to add pharmacy', 'error');
                }
            });
        } else {
            this.adminService.updatePharmacy(this.selectedPharmacy.id, this.selectedPharmacy).subscribe({
                next: () => {
                    this.snackbarService.show('Pharmacy updated successfully', 'success');
                    this.loadPharmacies();
                    this.closeModal();
                },
                error: (error) => {
                    console.error('Error updating pharmacy:', error);
                    this.snackbarService.show('Failed to update pharmacy', 'error');
                }
            });
        }
    }

    delete(id: number) {
        if (confirm('Are you sure you want to delete this pharmacy?')) {
            this.adminService.deletePharmacy(id).subscribe({
                next: () => {
                    this.snackbarService.show('Pharmacy deleted successfully', 'success');
                    this.loadPharmacies();
                },
                error: (error) => {
                    console.error('Error deleting pharmacy:', error);
                    this.snackbarService.show('Failed to delete pharmacy', 'error');
                }
            });
        }
    }

    toggleActive(pharmacy: any) {
        const updated = { ...pharmacy, is_active: !pharmacy.is_active };
        this.adminService.updatePharmacy(pharmacy.id, updated).subscribe({
            next: () => {
                this.loadPharmacies();
                this.snackbarService.show(updated.is_active ? 'Pharmacy activated' : 'Pharmacy deactivated', 'success');
            },
            error: (error) => {
                console.error('Error toggling active status:', error);
                this.snackbarService.show('Failed to update status', 'error');
            }
        });
    }
}
