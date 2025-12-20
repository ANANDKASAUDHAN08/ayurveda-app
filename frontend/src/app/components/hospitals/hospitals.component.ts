import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../../shared/services/content.service';

@Component({
    selector: 'app-hospitals',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './hospitals.component.html',
    styleUrl: './hospitals.component.css'
})
export class HospitalsComponent implements OnInit {
    hospitals: any[] = [];
    filteredHospitals: any[] = [];
    searchTerm: string = '';
    loading = true;
    selectedHospital: any = null;
    showModal = false;
    popularSearches: string[] = [];

    constructor(private contentService: ContentService) { }

    ngOnInit() {
        this.loadHospitals();
    }

    loadHospitals() {
        this.loading = true;
        this.contentService.getHospitals().subscribe({
            next: (response) => {
                this.hospitals = response.hospitals || [];
                this.filteredHospitals = [...this.hospitals];
                this.calculatePopularSearches();
                setTimeout(() => {
                    this.loading = false;
                }, 500);
            },
            error: (error) => {
                console.error('Error loading hospitals:', error);
                setTimeout(() => {
                    this.loading = false;
                }, 500);
            }
        });
    }

    calculatePopularSearches() {
        // Extract all specialties from FILTERED hospitals (based on current search)
        const specialtyCount: { [key: string]: number } = {};

        this.filteredHospitals.forEach(hospital => {
            if (hospital.specialties) {
                const specialties = hospital.specialties.split(',').map((s: string) => s.trim());
                specialties.forEach((specialty: string) => {
                    if (specialty) {
                        specialtyCount[specialty] = (specialtyCount[specialty] || 0) + 1;
                    }
                });
            }
        });

        // Sort by frequency and take top 5
        this.popularSearches = Object.entries(specialtyCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(entry => entry[0]);
    }

    searchHospitals() {
        if (!this.searchTerm.trim()) {
            this.filteredHospitals = [...this.hospitals];
        } else {
            const term = this.searchTerm.toLowerCase();
            this.filteredHospitals = this.hospitals.filter(hospital =>
                hospital.name?.toLowerCase().includes(term) ||
                hospital.city?.toLowerCase().includes(term) ||
                hospital.state?.toLowerCase().includes(term) ||
                hospital.email?.toLowerCase().includes(term) ||
                (hospital.specialties && hospital.specialties.toLowerCase().includes(term)) ||
                (hospital.facilities && hospital.facilities.toLowerCase().includes(term))
            );
        }

        // Recalculate popular searches based on filtered results
        this.calculatePopularSearches();
    }

    clearSearch() {
        this.searchTerm = '';
        this.filteredHospitals = [...this.hospitals];
    }

    openDetails(hospital: any) {
        this.selectedHospital = hospital;
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
        this.selectedHospital = null;
    }

    searchBySpecialty(specialty: string) {
        this.searchTerm = specialty;
        this.searchHospitals();
    }
}
