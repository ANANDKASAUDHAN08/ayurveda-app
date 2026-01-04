import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SearchService, SearchFilters, SearchResult } from '../../shared/services/search.service';
import { CartService } from '../../shared/services/cart.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import { DoctorDetailModalComponent } from 'src/app/components/doctor-detail-modal/doctor-detail-modal.component';
import { BookingModalComponent } from 'src/app/components/booking-modal/booking-modal.component';
import { ProductDetailModalComponent } from 'src/app/components/product-detail-modal/product-detail-modal.component';

@Component({
    selector: 'app-search-results',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        DoctorDetailModalComponent,
        BookingModalComponent,
        ProductDetailModalComponent
    ],
    templateUrl: './search-results.component.html',
    styleUrls: ['./search-results.component.css']
})
export class SearchResultsComponent implements OnInit, OnDestroy {

    // Expose Math for template
    Math = Math;
    Object = Object;
    Array = Array;

    // View state
    viewMode: 'grid' | 'list' = 'grid';
    showMobileFilters = false;
    skeletonCount = 8;

    // Search results
    results: SearchResult[] = [];
    groupedResults: { [key: string]: SearchResult[] } = {};
    loading = false;

    // Filters
    filters: SearchFilters = {
        q: '',
        category: '',
        type: '',
        minPrice: undefined,
        maxPrice: undefined,
        sortBy: 'name_asc',
        page: 1,
        limit: 20
    };

    // Filter options
    categories: string[] = [];
    productTypes = [
        { value: '', label: 'All Results' },
        { value: 'medicine', label: 'Medicines' },
        { value: 'device', label: 'Medical Devices' },
        { value: 'doctor', label: 'Doctors' },
        { value: 'hospital', label: 'Hospitals' },
        { value: 'pharmacy', label: 'Pharmacies' }
    ];

    sortOptions = [
        { value: 'name_asc', label: 'Name (A-Z)' },
        { value: 'name_desc', label: 'Name (Z-A)' },
        { value: 'price_asc', label: 'Price (Low to High)' },
        { value: 'price_desc', label: 'Price (High to Low)' }
    ];

    // Pagination
    pagination = {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    };

    // Loading states
    addingToCart: { [key: string]: boolean } = {};

    // Modal states (ADD THESE)
    selectedDoctor: any = null;
    selectedDoctorForDetails: any = null;
    selectedProduct: SearchResult | null = null;

    // Subscriptions
    private routeSub?: Subscription;
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private searchService: SearchService,
        private cartService: CartService,
        private snackbarService: SnackbarService,
        private authService: AuthService,
        private snackbar: SnackbarService
    ) { }

    ngOnInit() {
        this.loadCategories();

        // Watch query params
        this.routeSub = this.route.queryParams.subscribe(params => {
            this.filters.q = params['q'] || '';
            this.filters.category = params['category'] || '';
            this.filters.type = params['type'] || '';
            this.filters.minPrice = params['minPrice'] ? +params['minPrice'] : undefined;
            this.filters.maxPrice = params['maxPrice'] ? +params['maxPrice'] : undefined;
            this.filters.sortBy = params['sortBy'] || 'name_asc';
            this.filters.page = params['page'] ? +params['page'] : 1;
            this.search();
        });
    }

    ngOnDestroy() {
        this.routeSub?.unsubscribe();
    }

    loadCategories() {
        this.categories = this.searchService.getCategories();
    }

    search() {
        this.loading = true;
        // Show skeletons based on page limit
        this.skeletonCount = this.filters.limit || 20;

        this.searchService.searchProducts(this.filters).subscribe({
            next: (response) => {
                if (response.success) {
                    this.results = response.data.results;
                    this.pagination = response.data.pagination;
                    this.groupResults();

                    // Update skeleton count for next time
                    this.skeletonCount = Math.min(Math.max(this.results.length, 4), 12);
                }

                setTimeout(() => {
                    this.loading = false;
                }, 500);
            },
            error: (err) => {
                console.error('❌ Frontend search error:', err); // DEBUG
                setTimeout(() => {
                    this.loading = false;
                }, 500);
                this.snackbarService.show('Search failed. Please try again.', 'error');
            }
        });
    }

    groupResults() {
        this.groupedResults = {};
        this.results.forEach(result => {
            const type = result.product_type || 'other';
            if (!this.groupedResults[type]) {
                this.groupedResults[type] = [];
            }
            this.groupedResults[type].push(result);
        });
    }

    applyFilters() {
        this.filters.page = 1;
        this.updateUrl();
    }

    updateUrl() {
        const queryParams: any = {};
        if (this.filters.q) queryParams.q = this.filters.q;
        if (this.filters.category) queryParams.category = this.filters.category;
        if (this.filters.type) queryParams.type = this.filters.type;
        if (this.filters.minPrice) queryParams.minPrice = this.filters.minPrice;
        if (this.filters.maxPrice) queryParams.maxPrice = this.filters.maxPrice;
        if (this.filters.sortBy) queryParams.sortBy = this.filters.sortBy;
        // Always include page, even if it's 1
        queryParams.page = this.filters.page;

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams,
            queryParamsHandling: 'merge'
        });
    }

    clearFilters() {
        this.filters = {
            q: this.filters.q, // Keep search query
            category: '',
            type: '',
            minPrice: undefined,
            maxPrice: undefined,
            sortBy: 'name_asc',
            page: 1,
            limit: 20
        };

        // Use replaceUrl to completely clear params
        const queryParams: any = {};
        if (this.filters.q) queryParams.q = this.filters.q;
        queryParams.sortBy = 'name_asc';

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams,
            replaceUrl: true  // Replace instead of merge
        });
    }

    removeFilter(filterType: string) {
        switch (filterType) {
            case 'category':
                this.filters.category = '';
                break;
            case 'type':
                this.filters.type = '';
                break;
            case 'price':
                this.filters.minPrice = undefined;
                this.filters.maxPrice = undefined;
                break;
        }
        this.applyFilters();
    }

    changePage(page: number) {
        this.filters.page = page;
        this.updateUrl();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    toggleViewMode() {
        this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
    }

    toggleMobileFilters() {
        this.showMobileFilters = !this.showMobileFilters;
    }

    // Entity-specific actions
    addToCart(product: SearchResult) {
        const key = `${product.product_type}-${product.id}`;
        this.addingToCart[key] = true;

        this.cartService.addItem({
            id: String(product.id),
            name: product.name,
            type: (product.product_type || 'medicine') as 'medicine' | 'device' | 'wellness' | 'other',
            price: product.price || 0,
            quantity: 1,
            image: product.image_url || ''
        });

        setTimeout(() => {
            this.addingToCart[key] = false;
            this.snackbarService.show(`${product.name} added to cart!`, 'success');
        }, 300);
    }

    bookAppointment(doctor: SearchResult) {
        if (!this.authService.isLoggedIn()) {
            this.snackbar.warning('Please login to book an appointment');
            return;
        }

        this.openBookingModal(doctor);
    }

    viewDetails(item: SearchResult) {
        // For doctors, open detail modal
        if (item.product_type === 'doctor') {
            this.openDoctorDetails(item);
            return;
        }

        // For medicines/devices, open product detail modal
        if (item.product_type === 'medicine' || item.product_type === 'device') {
            this.openProductDetails(item);
            return;
        }

        // Navigate to list pages (detail pages don't exist yet)
        const routes: { [key: string]: string } = {
            'hospital': '/hospitals',
            'pharmacy': '/pharmacies',
        };

        const basePath = routes[item.product_type];

        if (!basePath) {
            this.snackbarService.show('Page not available', 'info');
            return;
        }

        this.router.navigate([basePath]);
    }

    // Modal handlers
    openDoctorDetails(doctor: SearchResult) {
        this.selectedDoctorForDetails = doctor;
    }

    closeDoctorDetails() {
        this.selectedDoctorForDetails = null;
    }

    openBookingModal(doctor: SearchResult) {
        this.selectedDoctor = doctor;
    }

    closeBooking() {
        this.selectedDoctor = null;
    }

    openBookingFromDetails(doctor: any) {
        this.closeDoctorDetails();
        this.openBookingModal(doctor);
    }

    onBookingConfirmed(bookingData: any) {
        this.snackbarService.show('Appointment booked successfully!', 'success');
        this.closeBooking();
    }

    // Product modal handlers
    openProductDetails(product: SearchResult) {
        this.selectedProduct = product;
    }

    closeProductDetails() {
        this.selectedProduct = null;
    }

    addToCartFromModal(product: SearchResult) {
        this.addToCart(product);
        this.closeProductDetails();
    }

    // Helper methods
    getTypeLabel(type: string): string {
        const labels: { [key: string]: string } = {
            'medicine': 'Medicines',
            'device': 'Medical Devices',
            'doctor': 'Doctors',
            'hospital': 'Hospitals',
            'pharmacy': 'Pharmacies'
        };
        return labels[type] || type;
    }

    getTypeIcon(type: string): string {
        const icons: { [key: string]: string } = {
            'medicine': 'fa-pills',
            'device': 'fa-stethoscope',
            'doctor': 'fa-user-md',
            'hospital': 'fa-hospital',
            'pharmacy': 'fa-prescription-bottle'
        };
        return icons[type] || 'fa-box';
    }

    get activeFilterCount(): number {
        let count = 0;
        if (this.filters.category) count++;
        if (this.filters.type) count++;
        if (this.filters.minPrice || this.filters.maxPrice) count++;
        return count;
    }

    get hasResults(): boolean {
        return this.results.length > 0;
    }

    get showGroupedView(): boolean {
        return Object.keys(this.groupedResults).length > 1;
    }

    getActionButtonClass(type: string): string {
        if (type === 'doctor') {
            return 'bg-blue-600 hover:bg-blue-700';
        } else if (type === 'hospital' || type === 'pharmacy') {
            return 'bg-purple-600 hover:bg-purple-700';
        }
        return 'bg-emerald-600 hover:bg-emerald-700';
    }

    getActionButtonText(type: string): string {
        if (type === 'doctor') return 'Book Appointment';
        if (type === 'hospital' || type === 'pharmacy') return 'View Details';
        return 'Add to Cart';
    }
}