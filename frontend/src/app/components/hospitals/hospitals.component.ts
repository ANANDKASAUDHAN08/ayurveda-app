import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../../shared/services/content.service';
import { MedicineTypeService, MedicineType, FilterMode } from '../../shared/services/medicine-type.service';
import { FavoritesService } from '../../shared/services/favorites.service';
import { ContextBannerComponent } from '../../shared/components/context-banner/context-banner.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MobileLocationBarComponent } from '../../shared/components/mobile-location-bar/mobile-location-bar.component';

@Component({
    selector: 'app-hospitals',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, ContextBannerComponent, MobileLocationBarComponent],
    templateUrl: './hospitals.component.html',
    styleUrl: './hospitals.component.css'
})
export class HospitalsComponent implements OnInit {
    hospitals: any[] = [];
    allHospitals: any[] = []; // Store all hospitals for client-side filtering
    filteredHospitals: any[] = [];
    searchTerm: string = '';
    loading = true;
    selectedHospital: any = null;
    showModal = false;
    popularSearches: string[] = [];

    // Medicine type context
    currentMedicineType: MedicineType | 'all' = 'all';
    private destroy$ = new Subject<void>();

    constructor(
        private contentService: ContentService,
        private medicineTypeService: MedicineTypeService,
        private favoritesService: FavoritesService
    ) { }

    ngOnInit() {
        // Track medicine type changes and reapply filtering
        this.medicineTypeService.getCurrentType().pipe(takeUntil(this.destroy$)).subscribe(type => {
            this.currentMedicineType = type;
            this.applyMedicineTypeFilter(); // Refilter when type changes
            this.searchHospitals(); // Reapply search after filtering
        });

        this.loadHospitals();
    }

    loadHospitals() {
        this.loading = true;
        this.contentService.getHospitals().subscribe({
            next: (response) => {
                this.allHospitals = response.hospitals || [];
                this.hospitals = [...this.allHospitals];
                this.applyMedicineTypeFilter(); // Apply client-side medicine type filtering
                this.searchHospitals(); // Then apply search filter
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

    // Client-side filtering by medicine type based on specialties
    applyMedicineTypeFilter() {
        if (this.currentMedicineType === 'all') {
            this.hospitals = [...this.allHospitals];
            return;
        }

        // Keywords to identify hospital types based on specialties
        const ayurvedaKeywords = ['ayur', 'panchakarma', 'ayurvedic', 'herbal', 'natural', 'traditional'];
        const homeopathyKeywords = ['homeo', 'homoeopathy', 'homeopathic'];
        const allopathyKeywords = ['cardiology', 'neurology', 'orthopedic', 'surgery', 'oncology', 'pediatric', 'dermatology', 'general'];

        this.hospitals = this.allHospitals.filter(hospital => {
            const searchText = `${hospital.name || ''} ${hospital.specialties || ''} ${hospital.facilities || ''}`.toLowerCase();

            switch (this.currentMedicineType) {
                case 'ayurveda':
                    return ayurvedaKeywords.some(keyword => searchText.includes(keyword));
                case 'homeopathy':
                    return homeopathyKeywords.some(keyword => searchText.includes(keyword));
                case 'allopathy':
                    return allopathyKeywords.some(keyword => searchText.includes(keyword));
                default:
                    return true;
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

    onToggleFilter() {
        // Filter mode toggle not implemented in service
        this.applyMedicineTypeFilter();
    }

    onClearFilter() {
        this.currentMedicineType = 'all';
        this.applyMedicineTypeFilter();
    }

    onSwitchType(type: MedicineType) {
        this.medicineTypeService.setMedicineType(type);
    }


    toggleFavorite(event: Event, hospital: any) {
        event.stopPropagation();
        this.favoritesService.toggleFavorite(hospital.id, 'hospital').subscribe();
    }

    isFavorite(hospitalId: string | number): boolean {
        return this.favoritesService.isFavorite(hospitalId, 'hospital');
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
