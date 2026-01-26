import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../../shared/services/content.service';
import { FavoritesService } from '../../shared/services/favorites.service';
import { MobileLocationBarComponent } from '../../shared/components/mobile-location-bar/mobile-location-bar.component';
import { HospitalCardComponent } from '../../shared/components/hospital-card/hospital-card.component';
import { HospitalDetailsModalComponent } from '../../shared/components/hospital-details-modal/hospital-details-modal.component';

@Component({
    selector: 'app-hospitals',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        MobileLocationBarComponent,
        HospitalCardComponent,
        HospitalDetailsModalComponent
    ],
    templateUrl: './hospitals.component.html',
    styleUrl: './hospitals.component.css'
})
export class HospitalsComponent implements OnInit {
    hospitals: any[] = [];
    loading = true;
    selectedHospital: any = null;
    showModal = false;
    showFilters = false;
    popularSearches: string[] = [];

    // Filters and Pagination
    searchTerm: string = '';
    selectedState: string = '';
    selectedSpecialty: string = '';
    selectedCategory: string = '';
    states: string[] = [];
    specialties: string[] = [];
    categories: string[] = ['NABH', 'Specialty'];
    showCategoryDropdown = false;
    showStateDropdown = false;

    isSearching = false;
    suggestions: string[] = [];
    showSuggestions = false;

    pagination = {
        total: 0,
        page: 1,
        limit: window.innerWidth < 768 ? 6 : 20,
        pages: 0
    };

    constructor(
        private contentService: ContentService,
        private favoritesService: FavoritesService,
        private elementRef: ElementRef
    ) { }

    ngOnInit() {
        this.loadFilters();
        this.loadHospitals();
    }

    loadFilters() {
        this.contentService.getHospitals({}, 'hospital-filters').subscribe({
            next: (response) => {
                this.states = response.states || [];
                this.specialties = response.specialties || [];
                this.popularSearches = this.specialties.slice(0, 5);
            },
            error: (error) => console.error('Error loading filters:', error)
        });
    }

    loadHospitals() {
        this.isSearching = true;
        this.loading = true;

        const params: any = {
            page: this.pagination.page,
            limit: this.pagination.limit,
            search: this.searchTerm,
            state: this.selectedState,
            specialty: this.selectedSpecialty,
            category: this.selectedCategory
        };

        this.contentService.getHospitals(params).subscribe({
            next: (response) => {
                this.hospitals = response.hospitals || [];
                this.pagination = response.pagination || this.pagination;
                setTimeout(() => {
                    this.isSearching = false;
                    this.loading = false;
                }, 300);
            },
            error: (error) => {
                console.error('Error loading hospitals:', error);
                this.isSearching = false;
                this.loading = false;
            }
        });
    }

    onSearch() {
        this.pagination.page = 1;
        this.loadHospitals();
    }

    onSearchInput() {
        if (this.searchTerm.length >= 2) {
            // Filter from your existing specialties list for suggestions
            this.suggestions = this.specialties.filter(s =>
                s.toLowerCase().includes(this.searchTerm.toLowerCase())
            ).slice(0, 6); // Show top 6 matches
            this.showSuggestions = this.suggestions.length > 0;
        } else {
            this.showSuggestions = false;
        }
    }

    selectSuggestion(val: string) {
        this.searchTerm = val;
        this.showSuggestions = false;
        this.onSearch();
    }

    onFilterChange() {
        this.pagination.page = 1;
        this.loadHospitals();
    }

    clearSearch() {
        this.searchTerm = '';
        this.onSearch();
    }

    clearFilters() {
        this.selectedState = '';
        this.selectedSpecialty = '';
        this.selectedCategory = '';
        this.searchTerm = '';
        this.pagination.page = 1;
        this.loadHospitals();
    }

    goToPage(page: number) {
        if (page < 1 || page > this.pagination.pages) return;
        this.pagination.page = page;
        this.loadHospitals();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    getPagesArray(): number[] {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, this.pagination.page - 2);
        let end = Math.min(this.pagination.pages, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    }

    searchBySpecialty(specialty: string) {
        this.selectedSpecialty = specialty;
        this.onFilterChange();
    }

    openDetails(hospital: any) {
        this.selectedHospital = hospital;
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
        this.selectedHospital = null;
    }

    toggleFavorite(event: Event, hospital: any) {
        event.stopPropagation();
        this.favoritesService.toggleFavorite(hospital.id, 'hospital').subscribe();
    }

    isFavorite(hospitalId: string | number): boolean {
        return this.favoritesService.isFavorite(hospitalId, 'hospital');
    }

    toggleCategory() {
        this.showCategoryDropdown = !this.showCategoryDropdown;
        this.showStateDropdown = false;
    }

    toggleState() {
        this.showStateDropdown = !this.showStateDropdown;
        this.showCategoryDropdown = false;
    }

    selectCategory(cat: string) {
        this.selectedCategory = cat;
        this.showCategoryDropdown = false;
        this.onFilterChange();
    }

    selectState(state: string) {
        this.selectedState = state;
        this.showStateDropdown = false;
        this.onFilterChange();
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        // If the click is outside this component, close all dropdowns
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.showCategoryDropdown = false;
            this.showStateDropdown = false;
        }
    }
}
