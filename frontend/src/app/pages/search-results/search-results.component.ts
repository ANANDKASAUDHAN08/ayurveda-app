import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SearchService, SearchFilters, SearchResult } from '../../shared/services/search.service';
import { CartService } from '../../shared/services/cart.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DoctorDetailModalComponent } from 'src/app/components/doctor-detail-modal/doctor-detail-modal.component';
import { BookingModalComponent } from 'src/app/components/booking-modal/booking-modal.component';
import { ProductDetailModalComponent } from 'src/app/components/product-detail-modal/product-detail-modal.component';
import { HostListener } from '@angular/core';
import { HospitalCardComponent } from 'src/app/shared/components/hospital-card/hospital-card.component';
import { HospitalDetailsModalComponent } from 'src/app/shared/components/hospital-details-modal/hospital-details-modal.component';
import { FavoritesService } from 'src/app/shared/services/favorites.service';
import { DoctorCardComponent } from 'src/app/components/doctor-card/doctor-card.component';
import { DoctorService } from 'src/app/shared/services/doctor.service';
import { AppointmentService } from 'src/app/shared/services/appointment.service';
import { MedicineCardComponent } from 'src/app/components/medicines/medicine-card/medicine-card.component';
import { HerbDetailComponent } from 'src/app/components/medicine-type/ayurveda/herb-detail/herb-detail.component';
import { AyurvedaService, Herb } from 'src/app/shared/services/ayurveda.service';
import { HerbCardComponent, HerbCardData } from 'src/app/components/medicine-type/ayurveda/herb-card/herb-card.component';
import { AyurvedaMedicineCardComponent, AyurvedaMedicineData } from 'src/app/components/medicine-type/ayurveda/ayurveda-medicine-card/ayurveda-medicine-card.component';
import { AyurvedaMedicineDetailModalComponent } from 'src/app/components/medicine-type/ayurveda/ayurveda-medicine-detail-modal/ayurveda-medicine-detail-modal.component';
import { ShareButtonComponent } from 'src/app/shared/components/share/share-button/share-button.component';
import { ShareData } from 'src/app/shared/services/share.service';

@Component({
    selector: 'app-search-results',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        DoctorDetailModalComponent,
        BookingModalComponent,
        ProductDetailModalComponent,
        HospitalCardComponent,
        HospitalDetailsModalComponent,
        DoctorCardComponent,
        MedicineCardComponent,
        HerbDetailComponent,
        HerbCardComponent,
        AyurvedaMedicineCardComponent,
        AyurvedaMedicineDetailModalComponent,
        ShareButtonComponent
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
    activeDropdown: string | null = null;

    // Search results
    results: SearchResult[] = [];
    groupedResults: { [key: string]: SearchResult[] } = {};
    loading = false;

    // Video Consultancy Features
    doctorOnlineStatus: Map<number, boolean> = new Map();
    isFirstTimeUser: boolean = false;

    // Filters
    filters: SearchFilters = {
        q: '',
        category: '',
        type: '',
        minPrice: undefined,
        maxPrice: undefined,
        sortBy: 'name_asc',
        page: 1,
        limit: window.innerWidth < 768 ? 12 : 20,
        medicineType: '',
        manufacturer: '',
        city: '',
        minRating: undefined
    };

    // Filter selections
    medicineTypes = [
        { value: '', label: 'All Systems' },
        { value: 'allopathy', label: 'Allopathy' },
        { value: 'ayurveda', label: 'Ayurveda' },
        { value: 'homeopathy', label: 'Homeopathy' }
    ];

    ratingOptions = [
        { value: 0, label: 'All Ratings' },
        { value: 4, label: '4+ Stars' },
        { value: 3, label: '3+ Stars' }
    ];

    // Filter options
    categories: string[] = [];
    productTypes = [
        { value: '', label: 'All Results' },
        { value: 'hospital', label: 'Hospitals' },
        { value: 'doctor', label: 'Doctors' },
        { value: 'medicine', label: 'Medicines' },
        { value: 'device', label: 'Medical Devices' },
        { value: 'pharmacy', label: 'Pharmacies' },
        { value: 'lab_test', label: 'Lab Tests' },
        { value: 'health_package', label: 'Health Packages' },
        { value: 'ayurveda_medicine', label: 'Ayurveda Medicines' },
        { value: 'ayurveda_exercise', label: 'Ayurveda Wellness' },
        { value: 'herb', label: 'Ayurveda Herbs' },
        { value: 'disease', label: 'Ayurveda Conditions' },
        { value: 'yoga_pose', label: 'Yoga Poses' },
        { value: 'article', label: 'Health Articles' },
        { value: 'page', label: 'Information' }
    ];

    private typePriority = [
        'hospital',
        'doctor',
        'medicine',
        'device',
        'pharmacy',
        'lab_test',
        'health_package',
        'ayurveda_medicine',
        'ayurveda_exercise',
        'herb',
        'disease',
        'yoga_pose',
        'article',
        'page'
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
        limit: window.innerWidth < 768 ? 12 : 20,
        total: 0,
        totalPages: 0
    };

    // Loading states
    addingToCart: { [key: string]: boolean } = {};

    // Modal states (ADD THESE)
    selectedDoctor: any = null;
    selectedDoctorForDetails: any = null;
    selectedProduct: SearchResult | null = null;
    selectedHospital: any = null;
    showHospitalModal = false;
    selectedHerb: Herb | null = null;
    selectedAyurvedaMedicine: AyurvedaMedicineData | null = null;
    isHerbLoading: boolean = false;

    // Subscriptions
    private routeSub?: Subscription;
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private searchService: SearchService,
        private cartService: CartService,
        private snackbarService: SnackbarService,
        private authService: AuthService,
        private sanitizer: DomSanitizer,
        private favoritesService: FavoritesService,
        private doctorService: DoctorService,
        private appointmentService: AppointmentService,
        private ayurvedaService: AyurvedaService
    ) { }

    @HostListener('document:click')
    onDocumentClick() {
        this.activeDropdown = null;
    }

    toggleDropdown(name: string, event?: Event) {
        if (event) {
            event.stopPropagation();
        }
        this.activeDropdown = this.activeDropdown === name ? null : name;
    }

    selectOption(type: string, value: any) {
        switch (type) {
            case 'sortBy':
                this.filters.sortBy = value;
                break;
            case 'productType':
                this.filters.type = value;
                break;
            case 'category':
                this.filters.category = value;
                break;
        }
        this.activeDropdown = null;
        this.applyFilters();
    }

    getSelectedLabel(options: { value: any, label: string }[], currentValue: any): string {
        const option = options.find(opt => opt.value === currentValue);
        return option ? option.label : currentValue || 'Select...';
    }

    ngOnInit() {
        this.loadCategories();

        // Sort product types alphabetically (excluding 'All Results')
        const allResults = this.productTypes[0];
        const rest = this.productTypes.slice(1).sort((a, b) => a.label.localeCompare(b.label));
        this.productTypes = [allResults, ...rest];

        // Check if first-time user for free consultation
        if (this.authService.isLoggedIn()) {
            this.appointmentService.isFirstTimeUser().subscribe({
                next: (isFree) => this.isFirstTimeUser = isFree,
                error: () => this.isFirstTimeUser = false
            });
        }

        // Watch query params
        this.routeSub = this.route.queryParams.subscribe(params => {
            this.filters.q = params['q'] || '';
            this.filters.category = params['category'] || '';
            this.filters.type = params['type'] || '';
            this.filters.minPrice = params['minPrice'] ? +params['minPrice'] : undefined;
            this.filters.maxPrice = params['maxPrice'] ? +params['maxPrice'] : undefined;
            this.filters.sortBy = params['sortBy'] || 'name_asc';
            this.filters.page = params['page'] ? +params['page'] : 1;
            this.filters.medicineType = params['medicineType'] || '';
            this.filters.manufacturer = params['manufacturer'] || '';
            this.filters.city = params['city'] || '';
            this.filters.minRating = params['minRating'] ? +params['minRating'] : undefined;
            this.search();
        });
    }

    ngOnDestroy() {
        this.routeSub?.unsubscribe();
    }

    loadCategories() {
        this.categories = this.searchService.getCategories().sort((a, b) => a.localeCompare(b));
    }

    search() {
        this.loading = true;
        // Show skeletons based on page limit
        this.skeletonCount = this.filters.limit || 20;

        this.searchService.searchProducts(this.filters).subscribe({
            next: (response) => {
                if (response.success) {
                    this.results = response.data.results;
                    this.results.forEach(result => {
                        if (result.product_type === 'doctor') {
                            // Map 'price' to 'consultation_fee' for the component
                            (result as any).consultationFee = result.price;

                            // Extract experience number from the description string
                            const expMatch = result.description?.match(/(\d+)\s+years exp/);
                            if (expMatch) {
                                (result as any).experience = expMatch[1];
                            }
                        }
                    });
                    this.pagination = response.data.pagination;
                    this.groupResults();
                    this.checkDoctorsOnlineStatus();

                    // Update skeleton count for next time
                    this.skeletonCount = Math.min(Math.max(this.results.length, 4), 12);
                }

                setTimeout(() => {
                    this.loading = false;
                }, 100);
            },
            error: (err) => {
                console.error('❌ Frontend search error:', err); // DEBUG
                setTimeout(() => {
                    this.loading = false;
                }, 100);
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

    getOrderedGroupKeys(): string[] {
        const keys = Object.keys(this.groupedResults);
        return keys.sort((a, b) => {
            const indexA = this.typePriority.indexOf(a);
            const indexB = this.typePriority.indexOf(b);

            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;

            return indexA - indexB;
        });
    }

    getDisplayLimit(): number {
        return window.innerWidth < 768 ? 6 : 9;
    }

    applyFilters() {
        this.filters.page = 1;
        this.updateUrl();
    }

    updateUrl() {
        const queryParams: any = {};

        // Build fresh query params from current filters
        if (this.filters.q) queryParams.q = this.filters.q;
        if (this.filters.category) queryParams.category = this.filters.category;
        if (this.filters.type) queryParams.type = this.filters.type;
        if (this.filters.minPrice) queryParams.minPrice = this.filters.minPrice;
        if (this.filters.maxPrice) queryParams.maxPrice = this.filters.maxPrice;
        if (this.filters.sortBy) queryParams.sortBy = this.filters.sortBy;
        if (this.filters.medicineType) queryParams.medicineType = this.filters.medicineType;
        if (this.filters.manufacturer) queryParams.manufacturer = this.filters.manufacturer;
        if (this.filters.city) queryParams.city = this.filters.city;
        if (this.filters.minRating) queryParams.minRating = this.filters.minRating;
        if (this.filters.limit) queryParams.limit = this.filters.limit;

        // Always include page
        queryParams.page = this.filters.page || 1;

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams,
            // DO NOT USE MERGE - We want the URL to explicitly match our current filters
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
            limit: window.innerWidth < 768 ? 12 : 20
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
            case 'medicineType':
                this.filters.medicineType = '';
                break;
            case 'manufacturer':
                this.filters.manufacturer = '';
                break;
            case 'city':
                this.filters.city = '';
                break;
            case 'rating':
                this.filters.minRating = undefined;
                break;
            case 'q':
                this.filters.q = '';
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
            this.snackbarService.warning('Please login to book an appointment');
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

        // For hospitals, open hospital detail modal
        if (item.product_type === 'hospital') {
            this.openHospitalDetails(item);
            return;
        }

        // For herbs, open herb detail modal
        if (item.product_type === 'herb') {
            this.openHerbDetails(item);
            return;
        }

        // Navigate to specific pages
        const routes: { [key: string]: string } = {
            'pharmacy': '/pharmacies',
            'lab_test': '/lab-tests',
            'health_package': '/health-plans',
            'ayurveda_medicine': '/ayurveda',
            'ayurveda_exercise': '/ayurveda/ayurveda-wellness',
            'ayurveda_article': '/ayurveda/ayurveda-article',
            'page': '', // Handled specially below
        };

        if (item.product_type === 'page') {
            this.router.navigate(['/', item.image_url]); // slug is stored in image_url for pages
            return;
        }

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

    // Hospital modal handlers
    openHospitalDetails(hospital: any) {
        this.selectedHospital = hospital;
        this.showHospitalModal = true;
    }

    closeHospitalModal() {
        this.showHospitalModal = false;
        this.selectedHospital = null;
    }

    // Herb modal handlers
    openHerbDetails(herb: HerbCardData) {
        this.isHerbLoading = true;
        this.ayurvedaService.getHerbById(Number(herb.id)).subscribe({
            next: (herbData) => {
                this.selectedHerb = herbData;
                this.isHerbLoading = false;
                document.body.style.overflow = 'hidden';
            },
            error: (err) => {
                console.error('Failed to load herb details:', err);
                this.isHerbLoading = false;
                this.snackbarService.show('Failed to load herb details', 'error');
            }
        });
    }

    closeHerbDetails() {
        this.selectedHerb = null;
        document.body.style.overflow = 'auto';
    }

    // Ayurveda Medicine modal handlers
    openAyurvedaMedicineDetails(medicine: any) {
        this.selectedAyurvedaMedicine = medicine;
        document.body.style.overflow = 'hidden';
    }

    closeAyurvedaMedicineDetails() {
        this.selectedAyurvedaMedicine = null;
        document.body.style.overflow = 'auto';
    }

    toggleFavorite(event: Event, hospital: any) {
        event.stopPropagation();
        this.favoritesService.toggleFavorite(hospital.id, 'hospital').subscribe();
    }

    isFavorite(hospitalId: string | number): boolean {
        return this.favoritesService.isFavorite(hospitalId, 'hospital');
    }

    checkDoctorsOnlineStatus() {
        if (this.groupedResults['doctor']) {
            this.groupedResults['doctor'].forEach(doctor => {
                this.doctorService.isOnlineNow(doctor.id).subscribe({
                    next: (isOnline) => {
                        this.doctorOnlineStatus.set(doctor.id, isOnline);
                    },
                    error: () => {
                        this.doctorOnlineStatus.set(doctor.id, false);
                    }
                });
            });
        }
    }

    isDoctorOnline(doctorId: number): boolean {
        return this.doctorOnlineStatus.get(doctorId) || false;
    }

    onInstantConsult(doctor: any) {
        if (!this.authService.isLoggedIn()) {
            this.snackbarService.warning('Please login to start instant consultation');
            return;
        }

        // Open booking modal in instant mode
        this.selectedDoctor = { ...doctor, instantMode: true };
    }

    // Helper methods
    getTypeLabel(type: string): string {
        const labels: { [key: string]: string } = {
            'medicine': 'Medicines',
            'device': 'Medical Devices',
            'doctor': 'Doctors',
            'hospital': 'Hospitals',
            'pharmacy': 'Pharmacies',
            'lab_test': 'Lab Tests',
            'health_package': 'Health Packages',
            'ayurveda_medicine': 'Ayurveda Medicines',
            'page': 'Information',
            'herb': 'Ayurveda Herb',
            'disease': 'Ayurveda Condition',
            'yoga_pose': 'Yoga Pose',
            'article': 'Health Article'
        };
        return labels[type] || type;
    }

    getTypeIcon(type: string): string {
        const icons: { [key: string]: string } = {
            'medicine': 'fa-pills',
            'device': 'fa-stethoscope',
            'doctor': 'fa-user-md',
            'hospital': 'fa-hospital',
            'pharmacy': 'fa-prescription-bottle',
            'lab_test': 'fa-flask',
            'health_package': 'fa-heart-circle-check',
            'page': 'fa-info-circle',
            'herb': 'fa-leaf',
            'disease': 'fa-book-medical',
            'yoga_pose': 'fa-spa',
            'article': 'fa-newspaper'
        };
        return icons[type] || 'fa-box';
    }

    get activeFilterCount(): number {
        let count = 0;
        if (this.filters.category) count++;
        if (this.filters.type) count++;
        if (this.filters.minPrice || this.filters.maxPrice) count++;
        if (this.filters.medicineType) count++;
        if (this.filters.manufacturer) count++;
        if (this.filters.city) count++;
        if (this.filters.minRating) count++;
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

    getTypeColor(type: string): string {
        switch (type.toLowerCase()) {
            case 'medicine':
            case 'ayurveda_medicine':
            case 'ayurveda_article':
            case 'herb':
                return 'emerald';
            case 'doctor':
            case 'lab_test':
            case 'health_package':
                return 'blue';
            case 'hospital':
            case 'pharmacy':
                return 'indigo';
            case 'article':
            case 'page':
            case 'disease':
            case 'yoga_pose':
                return 'rose';
            default:
                return 'emerald';
        }
    }

    highlight(text: string | undefined): SafeHtml {
        if (!text) return '';
        if (!this.filters.q || this.filters.q.length < 2) return text;
        try {
            const re = new RegExp(`(${this.filters.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            return this.sanitizer.bypassSecurityTrustHtml(text.toString().replace(re, '<span class="search-highlight">$1</span>'));
        } catch (e) {
            return text;
        }
    }

    getPageRange(): number[] {
        const total = this.pagination.totalPages;
        const current = this.filters.page || 1;
        const range = 5; // Show 5 pages
        let start = Math.max(1, current - Math.floor(range / 2));
        let end = Math.min(total, start + range - 1);

        if (end - start + 1 < range) {
            start = Math.max(1, end - range + 1);
        }

        const pages = [];
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    }

    getShareData(): ShareData {
        const url = window.location.href;
        return {
            title: `Search Results for "${this.filters.q || 'Healthcare'}"`,
            text: `Check out these ${this.pagination.total} search results for "${this.filters.q || 'healthcare services'}" on HealthConnect.`,
            url: url
        };
    }
}