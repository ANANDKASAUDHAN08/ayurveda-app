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
    selector: 'app-pharmacies',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, ContextBannerComponent, MobileLocationBarComponent],
    templateUrl: './pharmacies.component.html',
    styleUrl: './pharmacies.component.css'
})
export class PharmaciesComponent implements OnInit {
    pharmacies: any[] = [];
    allPharmacies: any[] = []; // Store all for client-side filtering
    filteredPharmacies: any[] = [];
    searchTerm: string = '';
    loading = true;
    selectedPharmacy: any = null;
    showModal = false;

    // Medicine type context
    currentMedicineType: MedicineType | 'all' = 'all';
    private destroy$ = new Subject<void>();

    constructor(
        private contentService: ContentService,
        private medicineTypeService: MedicineTypeService,
        private favoritesService: FavoritesService
    ) { }

    ngOnInit() {
        // Track medicine type changes
        this.medicineTypeService.getCurrentType().pipe(takeUntil(this.destroy$)).subscribe(type => {
            this.currentMedicineType = type;
            this.applyMedicineTypeFilter();
            this.searchPharmacies();
        });

        this.loadPharmacies();
    }

    loadPharmacies() {
        this.loading = true;
        this.contentService.getPharmacies().subscribe({
            next: (response) => {
                this.allPharmacies = response.pharmacies || [];
                this.pharmacies = [...this.allPharmacies];
                this.applyMedicineTypeFilter();
                this.searchPharmacies();
                setTimeout(() => {
                    this.loading = false;
                }, 500);
            },
            error: (error) => {
                console.error('Error loading pharmacies:', error);
                setTimeout(() => {
                    this.loading = false;
                }, 500);
            }
        });
    }

    // Client-side filtering by medicine type
    applyMedicineTypeFilter() {
        if (this.currentMedicineType === 'all') {
            this.pharmacies = [...this.allPharmacies];
            return;
        }

        // Keywords for pharmacy types
        const ayurvedaKeywords = ['ayur', 'herbal', 'natural', 'ayurvedic'];
        const homeopathyKeywords = ['homeo', 'homoeopathy', 'homeopathic'];
        const allopathyKeywords = ['medical', 'pharmacy', 'drug', 'chemist', 'medicine'];

        this.pharmacies = this.allPharmacies.filter(pharmacy => {
            const searchText = `${pharmacy.name || ''} ${pharmacy.address || ''}`.toLowerCase();

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

    // Context banner actions
    onToggleFilter() {
        // Filter mode toggle not implemented in service
        // Just refresh the current filter
        this.applyMedicineTypeFilter();
        this.searchPharmacies();
    }

    onClearFilter() {
        // Set to default type instead of 'all'
        this.currentMedicineType = 'all';
        this.applyMedicineTypeFilter();
        this.searchPharmacies();
    }

    onSwitchType(type: MedicineType) {
        this.medicineTypeService.setMedicineType(type);
    }


    toggleFavorite(event: Event, pharmacy: any) {
        event.stopPropagation();
        this.favoritesService.toggleFavorite(pharmacy.id, 'pharmacy').subscribe();
    }

    isFavorite(pharmacyId: string | number): boolean {
        return this.favoritesService.isFavorite(pharmacyId, 'pharmacy');
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
