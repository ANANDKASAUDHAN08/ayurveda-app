import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../../shared/services/content.service';
import { FavoritesService } from '../../shared/services/favorites.service';
import { Subject } from 'rxjs';
import { PharmacyCardComponent } from './pharmacy-card/pharmacy-card.component';
import { MobileLocationBarComponent } from '../../shared/components/mobile-location-bar/mobile-location-bar.component';

@Component({
    selector: 'app-pharmacies',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, MobileLocationBarComponent, PharmacyCardComponent],
    templateUrl: './pharmacies.component.html',
    styleUrl: './pharmacies.component.css'
})
export class PharmaciesComponent implements OnInit {
    pharmacies: any[] = [];
    allPharmacies: any[] = []; // Store all for client-side filtering
    filteredPharmacies: any[] = [];
    searchTerm: string = '';
    loading = true;

    // Medicine type context
    private destroy$ = new Subject<void>();

    constructor(
        private contentService: ContentService,
    ) { }

    ngOnInit() {

        this.loadPharmacies();
    }

    loadPharmacies() {
        this.loading = true;
        this.contentService.getPharmacies().subscribe({
            next: (response) => {
                this.allPharmacies = response.pharmacies || [];
                this.pharmacies = [...this.allPharmacies];

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


    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
