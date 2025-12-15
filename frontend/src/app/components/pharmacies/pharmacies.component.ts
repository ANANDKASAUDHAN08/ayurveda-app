import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../../services/content.service';

@Component({
    selector: 'app-pharmacies',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './pharmacies.component.html',
    styleUrl: './pharmacies.component.css'
})
export class PharmaciesComponent implements OnInit {
    pharmacies: any[] = [];
    filteredPharmacies: any[] = [];
    searchTerm: string = '';
    loading = true;
    selectedPharmacy: any = null;
    showModal = false;

    constructor(private contentService: ContentService) { }

    ngOnInit() {
        this.loadPharmacies();
    }

    loadPharmacies() {
        this.loading = true;
        this.contentService.getPharmacies().subscribe({
            next: (response) => {
                this.pharmacies = response.pharmacies || [];
                this.filteredPharmacies = [...this.pharmacies];
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading pharmacies:', error);
                this.loading = false;
            }
        });
    }

    searchPharmacies() {
        if (!this.searchTerm.trim()) {
            this.filteredPharmacies = [...this.pharmacies];
        } else {
            const term = this.searchTerm.toLowerCase();
            this.filteredPharmacies = this.pharmacies.filter(pharmacy =>
                pharmacy.name?.toLowerCase().includes(term) ||
                pharmacy.city?.toLowerCase().includes(term) ||
                pharmacy.state?.toLowerCase().includes(term) ||
                pharmacy.email?.toLowerCase().includes(term) ||
                pharmacy.address?.toLowerCase().includes(term)
            );
        }
    }

    clearSearch() {
        this.searchTerm = '';
        this.filteredPharmacies = [...this.pharmacies];
    }

    openDetails(pharmacy: any) {
        this.selectedPharmacy = pharmacy;
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
        this.selectedPharmacy = null;
    }
}
