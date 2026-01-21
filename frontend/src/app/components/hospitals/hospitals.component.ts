import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../../shared/services/content.service';
import { FavoritesService } from '../../shared/services/favorites.service';
import { HospitalReviewService } from '../../shared/services/hospital-review.service';
import { AuthService } from '../../shared/services/auth.service';
import { MobileLocationBarComponent } from '../../shared/components/mobile-location-bar/mobile-location-bar.component';
import { RatingDisplayComponent } from '../../shared/components/rating-display/rating-display.component';
import { ReviewListComponent } from '../../shared/components/review-list/review-list.component';
import { ReviewFormComponent } from '../../shared/components/review-form/review-form.component';
import { getEncyclopediaKey } from '../../shared/utils/specialty-mapping';
import { HospitalReview, ReviewStats } from '../../shared/models/review.model';

@Component({
    selector: 'app-hospitals',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        MobileLocationBarComponent,
        RatingDisplayComponent,
        ReviewListComponent,
        ReviewFormComponent
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
        limit: 12,
        pages: 0
    };

    // Review Related Properties
    reviews: HospitalReview[] = [];
    reviewStats: ReviewStats | null = null;
    reviewsLoading = false;
    showReviewForm = false;
    reviewsCurrentPage = 1;
    reviewsTotalPages = 1;
    activeTab: 'details' | 'reviews' = 'details';

    constructor(
        private contentService: ContentService,
        private favoritesService: FavoritesService,
        private hospitalReviewService: HospitalReviewService,
        public authService: AuthService,
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
        this.activeTab = 'details';
        this.loadHospitalReviews();
        this.loadReviewStats();
    }

    closeModal() {
        this.showModal = false;
        this.selectedHospital = null;
        this.reviews = [];
        this.reviewStats = null;
        this.showReviewForm = false;
        this.activeTab = 'details';
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

    formatLocation(hospital: any): string {
        const city = hospital?.city?.trim();
        const state = hospital?.state?.trim();

        if (city && state) {
            return `${city}, ${state}`;
        } else if (state && state.toLowerCase() !== 'n/a') {
            return state;
        } else if (city && city.toLowerCase() !== 'n/a') {
            return city;
        }
        return 'Location Verified';
    }

    // formatAddress(hospital: any): string {
    //     const address = hospital?.address || '';
    //     const name = hospital?.name || '';

    //     if (address.toLowerCase().includes(name.toLowerCase())) {
    //         // If the address contains the name, let's try to slice it or just return it if it's long enough
    //         // For now, if it starts with the name, we'll try to refine it
    //         if (address.toLowerCase().startsWith(name.toLowerCase())) {
    //             const refined = address.substring(name.length).replace(/^[,-\s\n\t]+/, '').trim();
    //             return refined || 'Address available in details';
    //         }
    //     }
    //     return address || 'Address not available';
    // }

    formatAddress(hospital: any): string {
        if (!hospital || !hospital.address) return '';

        // 1. Remove quotes (both leading/trailing and any double quotes)
        // 2. Clean up common redundant prefixes
        let address = hospital.address.replace(/"/g, '').trim();

        // Optional: Remove redundant hospital name if address starts with it
        if (hospital.name && address.startsWith(hospital.name.replace(/"/g, ''))) {
            address = address.substring(hospital.name.replace(/"/g, '').length).trim();
            if (address.startsWith(',') || address.startsWith('-')) {
                address = address.substring(1).trim();
            }
        }

        return address || 'Address available on request';
    }

    formatName(name: string): string {
        if (!name) return '';
        // Removes leading/trailing quotes and extra whitespace
        return name.replace(/^"+|"+$/g, '').trim();
    }

    getSpecialtiesList(specialties: string): string[] {
        if (!specialties || typeof specialties !== 'string') return [];

        const sanitized = specialties.trim();
        if (sanitized === '' || sanitized === '[]' || sanitized === 'null') {
            return [];
        }

        return sanitized
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0 && s !== '[]');
    }

    getFacilitiesList(facilities: string): string[] {
        if (!facilities || typeof facilities !== 'string') return [];

        const sanitized = facilities.trim();
        if (sanitized === '' || sanitized === '[]' || sanitized === 'null') {
            return [];
        }

        return sanitized
            .split(',')
            .map(f => f.trim())
            .filter(f => f.length > 0 && f !== '[]');
    }

    getSpecialtyKey(specialty: string): string | null {
        return getEncyclopediaKey(specialty);
    }

    // Review Methods
    loadHospitalReviews() {
        if (!this.selectedHospital) return;

        this.reviewsLoading = true;
        const source = this.selectedHospital.data_source === 'NABH' ? 'nabh_hospitals' :
            this.selectedHospital.data_source === 'Specialty' ? 'hospitals_with_specialties' : 'hospitals';

        this.hospitalReviewService.getHospitalReviews(
            this.selectedHospital.id,
            source,
            this.reviewsCurrentPage,
            5
        ).subscribe({
            next: (response) => {
                this.reviews = response.data;
                this.reviewsTotalPages = response.pagination?.totalPages || 1;
                this.reviewsLoading = false;
            },
            error: (error) => {
                console.error('Error loading reviews:', error);
                this.reviewsLoading = false;
            }
        });
    }

    loadReviewStats() {
        if (!this.selectedHospital) return;

        const source = this.selectedHospital.data_source === 'NABH' ? 'nabh_hospitals' :
            this.selectedHospital.data_source === 'Specialty' ? 'hospitals_with_specialties' : 'hospitals';

        this.hospitalReviewService.getHospitalReviewStats(
            this.selectedHospital.id,
            source
        ).subscribe({
            next: (response) => {
                this.reviewStats = response.data;
            },
            error: (error) => {
                console.error('Error loading stats:', error);
            }
        });
    }

    openReviewForm() {
        if (!this.authService.isLoggedIn()) {
            alert('Please login to write a review');
            return;
        }
        this.showReviewForm = true;
    }

    closeReviewForm() {
        this.showReviewForm = false;
    }

    submitReview(reviewData: any) {
        if (!this.selectedHospital) return;

        const source = this.selectedHospital.data_source === 'NABH' ? 'nabh_hospitals' :
            this.selectedHospital.data_source === 'Specialty' ? 'hospitals_with_specialties' : 'hospitals';

        this.hospitalReviewService.submitHospitalReview({
            hospital_id: this.selectedHospital.id,
            hospital_source: source,
            ...reviewData
        }).subscribe({
            next: (response) => {
                this.showReviewForm = false;
                this.loadHospitalReviews();
                this.loadReviewStats();
                alert('Review submitted successfully!');
            },
            error: (error) => {
                console.error('Error submitting review:', error);
                alert(error.error?.message || 'Failed to submit review');
            }
        });
    }

    onReviewPageChange(page: number) {
        this.reviewsCurrentPage = page;
        this.loadHospitalReviews();
    }

    onEditReview(review: HospitalReview) {
        // Open review form with existing data
        console.log('Edit review:', review);
        // TODO: Implement edit functionality
    }

    onDeleteReview(reviewId: number) {
        this.hospitalReviewService.deleteHospitalReview(reviewId).subscribe({
            next: () => {
                this.loadHospitalReviews();
                this.loadReviewStats();
                alert('Review deleted successfully');
            },
            error: (error) => {
                console.error('Error deleting review:', error);
                alert('Failed to delete review');
            }
        });
    }
}
