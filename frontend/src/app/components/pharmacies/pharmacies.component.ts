import { Component, OnInit, HostListener } from '@angular/core';
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
    allPharmacies: any[] = [];
    filteredPharmacies: any[] = [];
    paginatedPharmacies: any[] = [];

    searchTerm: string = '';
    loading = true;

    // Custom Dropdown State
    isCityDropdownOpen = false;
    isBrandDropdownOpen = false;
    isStateDropdownOpen = false;

    // Pagination
    currentPage = 1;
    itemsPerPage = 12;
    totalPages = 1;
    Math = Math;

    // Filters
    filters = {
        state: '',
        city: '',
        brand: '',
        is24x7: false,
        delivery: false
    };
    states: string[] = [];
    cities: string[] = [];
    brands: string[] = [];
    showAdvancedFilters = false;

    private destroy$ = new Subject<void>();

    constructor(
        private contentService: ContentService,
    ) { }

    ngOnInit() {
        this.loadPharmacies();
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.custom-dropdown-container')) {
            this.isCityDropdownOpen = false;
            this.isBrandDropdownOpen = false;
            this.isStateDropdownOpen = false;
        }
    }

    toggleCityDropdown(event: Event) {
        event.stopPropagation();
        this.isCityDropdownOpen = !this.isCityDropdownOpen;
        this.isBrandDropdownOpen = false;
    }

    toggleBrandDropdown(event: Event) {
        event.stopPropagation();
        this.isBrandDropdownOpen = !this.isBrandDropdownOpen;
        this.isCityDropdownOpen = false;
        this.isStateDropdownOpen = false;
    }

    toggleStateDropdown(event: Event) {
        event.stopPropagation();
        this.isStateDropdownOpen = !this.isStateDropdownOpen;
        this.isCityDropdownOpen = false;
        this.isBrandDropdownOpen = false;
    }

    selectState(state: string) {
        this.filters.state = state;
        this.isStateDropdownOpen = false;
        this.applyFilters();
    }

    selectCity(city: string) {
        this.filters.city = city;
        this.isCityDropdownOpen = false;
        this.applyFilters();
    }

    selectBrand(brand: string) {
        this.filters.brand = brand;
        this.isBrandDropdownOpen = false;
        this.applyFilters();
    }

    loadPharmacies() {
        this.loading = true;
        this.contentService.getPharmacies().subscribe({
            next: (response) => {
                this.allPharmacies = response.pharmacies || [];
                this.pharmacies = [...this.allPharmacies];

                // Extract unique states, cities and brands
                // Extract and normalize states
                const stateMap = new Map<string, string>();
                this.allPharmacies.forEach(p => {
                    if (p.state && p.state !== 'Unknown') {
                        const normalized = p.state.trim();
                        const key = normalized.toLowerCase();
                        if (!stateMap.has(key)) {
                            const capitalized = normalized
                                .split(' ')
                                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                .join(' ');
                            stateMap.set(key, capitalized);
                        }
                    }
                });
                this.states = Array.from(stateMap.values()).sort();

                // Normalize city names: extract actual city only, remove areas/neighborhoods
                const cityMap = new Map<string, string>();
                this.allPharmacies.forEach(p => {
                    if (p.city) {
                        let cityName = p.city.trim();

                        // Remove state suffix if present (e.g., "Hyderabad, Telangana.")
                        cityName = cityName.replace(/,\s*[A-Za-z\s]+\.?$/, '');

                        // Extract main city from area names (e.g., "Vanasthalipuram Hyderabad" -> "Hyderabad")
                        const mainCities = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Guwahati', 'Chandigarh', 'Solapur', 'Hubli-Dharwad', 'Bareilly', 'Moradabad', 'Mysore', 'Gurgaon', 'Gurugram', 'Noida'];

                        for (const mainCity of mainCities) {
                            if (cityName.toLowerCase().includes(mainCity.toLowerCase())) {
                                cityName = mainCity;
                                break;
                            }
                        }

                        // Normalize case
                        const key = cityName.toLowerCase();
                        if (!cityMap.has(key)) {
                            const capitalized = cityName
                                .split(' ')
                                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                .join(' ');
                            cityMap.set(key, capitalized);
                        }
                    }
                });
                this.cities = Array.from(cityMap.values()).sort();

                // Extract brands that occur at least 2 times
                const brandCounts = new Map<string, number>();
                this.allPharmacies.forEach(p => {
                    if (p.brand && p.brand !== 'Independent') {
                        brandCounts.set(p.brand, (brandCounts.get(p.brand) || 0) + 1);
                    }
                });

                // Filter brands that appear at least 2 times and sort them
                this.brands = Array.from(brandCounts.entries())
                    .filter(([brand, count]) => count >= 2)
                    .map(([brand, count]) => brand)
                    .sort();

                this.applyFilters();
                setTimeout(() => {
                    this.loading = false;
                }, 500);
            },
            error: (error) => {
                console.error('Error loading pharmacies:', error);
                this.loading = false;
            }
        });
    }

    applyFilters() {
        let results = [...this.allPharmacies];

        // Search term
        if (this.searchTerm.trim()) {
            const term = this.searchTerm.toLowerCase();
            results = results.filter(p =>
                p.name?.toLowerCase().includes(term) ||
                p.city?.toLowerCase().includes(term) ||
                p.address?.toLowerCase().includes(term)
            );
        }

        // State filter
        if (this.filters.state) {
            results = results.filter(p => p.state === this.filters.state);
        }

        // City filter
        if (this.filters.city) {
            // Match city even if it's part of a longer name
            results = results.filter(p => {
                if (!p.city) return false;
                const cityLower = p.city.toLowerCase();
                const filterLower = this.filters.city.toLowerCase();
                return cityLower.includes(filterLower);
            });
        }

        // Brand filter
        if (this.filters.brand) {
            results = results.filter(p => p.brand === this.filters.brand);
        }

        // 24/7 filter
        if (this.filters.is24x7) {
            results = results.filter(p => p.is_24x7 || p.opening_hours === '24/7');
        }

        // Delivery filter
        if (this.filters.delivery) {
            results = results.filter(p => p.delivery_available);
        }

        this.filteredPharmacies = results;
        this.currentPage = 1;
        this.updatePagination();
    }

    updatePagination() {
        this.totalPages = Math.ceil(this.filteredPharmacies.length / this.itemsPerPage);
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        this.paginatedPharmacies = this.filteredPharmacies.slice(start, end);
    }

    goToPage(page: number) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.updatePagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    nextPage() {
        this.goToPage(this.currentPage + 1);
    }

    previousPage() {
        this.goToPage(this.currentPage - 1);
    }

    getVisiblePages(): number[] {
        const total = this.totalPages;
        const current = this.currentPage;
        const pages: number[] = [];

        if (total <= 7) {
            for (let i = 1; i <= total; i++) pages.push(i);
        } else {
            // Always show first page
            pages.push(1);

            if (current > 3) {
                pages.push(-1); // Ellipsis
            }

            const start = Math.max(2, current - 1);
            const end = Math.min(total - 1, current + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (current < total - 2) {
                pages.push(-1); // Ellipsis
            }

            // Always show last page
            pages.push(total);
        }
        return pages;
    }

    toggleAdvancedFilters() {
        this.showAdvancedFilters = !this.showAdvancedFilters;

        // Lock/unlock body scroll when filter is open/closed
        if (this.showAdvancedFilters) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    clearSearch() {
        this.searchTerm = '';
        this.applyFilters();
    }

    resetFilters() {
        this.filters = {
            state: '',
            city: '',
            brand: '',
            is24x7: false,
            delivery: false
        };
        this.searchTerm = '';
        this.applyFilters();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
