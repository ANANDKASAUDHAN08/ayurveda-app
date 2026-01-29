import { environment } from '@env/environment';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { LabTest, Laboratory } from './types';

// Import sub-components
import { LabTestCardComponent } from './lab-test-card/lab-test-card.component';
import { LabTestModalComponent } from './lab-test-modal/lab-test-modal.component';
import { LaboratoryCardComponent } from './laboratory-card/laboratory-card.component';
import { LaboratoryModalComponent } from './laboratory-modal/laboratory-modal.component';

@Component({
  selector: 'app-lab-tests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LabTestCardComponent,
    LabTestModalComponent,
    LaboratoryCardComponent,
    LaboratoryModalComponent
  ],
  templateUrl: './lab-tests.component.html',
  styleUrl: './lab-tests.component.css'
})
export class LabTestsComponent implements OnInit, OnDestroy {
  Math = Math;

  // View State
  viewMode: 'tests' | 'labs' = 'tests';
  loading = false;

  // Data
  tests: LabTest[] = [];
  laboratories: Laboratory[] = [];

  // Filters
  searchQuery: string = '';
  selectedCategory: string = 'All'; // For tests
  selectedService: string = 'All';  // For labs
  minPrice: number | null = null;
  maxPrice: number | null = null;
  sortBy: string = 'name_asc';

  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  totalItems = 0;

  // Dynamic Categories/Services from API
  categories: string[] = ['All', 'Popular', 'Preventive', 'Diagnostic', 'Specialized', 'Wellness'];
  services: string[] = ['All'];

  sortOptions = [
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
    { value: 'price_asc', label: 'Price (Low to High)' },
    { value: 'price_desc', label: 'Price (High to Low)' },
    { value: 'popular', label: 'Most Popular' }
  ];

  // UI State
  showMobileFilters = false;
  showMobileCategoryDropdown = false;
  showMobileSortDropdown = false;
  showCategoryDropdown = false;
  showSortDropdown = false;
  selectedTest: LabTest | null = null;
  selectedLab: Laboratory | null = null;

  constructor(
    private snackbar: SnackbarService,
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-container')) {
      this.showCategoryDropdown = false;
      this.showSortDropdown = false;
      this.showMobileCategoryDropdown = false;
      this.showMobileSortDropdown = false;
    }
  }

  toggleDropdown(type: 'category' | 'sort', event: Event) {
    event.stopPropagation();
    if (type === 'category') {
      this.showCategoryDropdown = !this.showCategoryDropdown;
      this.showSortDropdown = false;
    } else {
      this.showSortDropdown = !this.showSortDropdown;
      this.showCategoryDropdown = false;
    }
  }

  toggleMobileFilters(show: boolean) {
    this.showMobileFilters = show;
    if (show) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  }

  selectCategory(category: string) {
    if (this.viewMode === 'tests') {
      this.selectedCategory = category;
    } else {
      this.selectedService = category;
    }
    this.showCategoryDropdown = false;
    this.onFilterChange();
  }

  selectSort(option: any) {
    this.sortBy = option.value;
    this.showSortDropdown = false;
    this.onFilterChange();
  }

  getSortLabel(): string {
    return this.sortOptions.find(opt => opt.value === this.sortBy)?.label || 'Sort By';
  }

  getSelectedCategoryLabel(): string {
    return this.viewMode === 'tests' ? this.selectedCategory : this.selectedService;
  }

  ngOnInit() {
    // Handle query parameters for search
    this.route.queryParams.subscribe(params => {
      const query = params['q'] || params['search'];
      if (query) {
        this.searchQuery = query;
      }
      this.loadInitialData();
    });
  }

  loadInitialData() {
    this.loadData();
    // Load categories for tests
    fetch(`${environment.apiUrl}/lab-tests/categories`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          this.categories = ['All', ...data.data];
        }
      });

    // Load services for labs
    fetch(`${environment.apiUrl}/labs/services`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          this.services = ['All', ...data.data];
        }
      });
  }

  loadData() {
    if (this.viewMode === 'tests') {
      this.loadTests();
    } else {
      this.loadLaboratories();
    }
  }

  loadTests() {
    this.loading = true;
    const params: any = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };
    if (this.selectedCategory !== 'All') params.category = this.selectedCategory;
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.minPrice) params.minPrice = this.minPrice;
    if (this.maxPrice) params.maxPrice = this.maxPrice;
    if (this.sortBy) params.sortBy = this.sortBy;

    const queryString = new URLSearchParams(params).toString();

    fetch(`${environment.apiUrl}/lab-tests?${queryString}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          this.tests = data.data.results;
          this.totalItems = data.data.pagination.total;
        }
        setTimeout(() => this.loading = false, 300);
      })
      .catch(error => {
        console.error('Error loading tests:', error);
        this.snackbar.show('Failed to load lab tests', 'error');
        this.loading = false;
      });
  }

  loadLaboratories() {
    this.loading = true;
    const params: any = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };
    if (this.selectedService !== 'All') params.service = this.selectedService;
    if (this.searchQuery) params.search = this.searchQuery;
    // Price sorting doesn't apply to labs usually, but we keep the structure

    const queryString = new URLSearchParams(params).toString();

    fetch(`${environment.apiUrl}/labs?${queryString}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          this.laboratories = data.data.results;
          this.totalItems = data.data.pagination.total;
        }
        setTimeout(() => this.loading = false, 300);
      })
      .catch(error => {
        console.error('Error loading labs:', error);
        this.snackbar.show('Failed to load laboratories', 'error');
        this.loading = false;
      });
  }

  get totalPages() {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

    // More aggressive truncation for mobile
    if (this.currentPage <= 2) return [1, 2, 3, 0, total];
    if (this.currentPage >= total - 1) return [1, 0, total - 2, total - 1, total];
    return [1, 0, this.currentPage, 0, total];
  }

  toggleView(mode: 'tests' | 'labs') {
    if (this.viewMode === mode) return;
    this.viewMode = mode;
    this.currentPage = 1;
    this.searchQuery = '';
    this.loadData();
  }

  goToPage(page: number) {
    if (page === 0) return;
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadData();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadData();
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedCategory = 'All';
    this.selectedService = 'All';
    this.minPrice = null;
    this.maxPrice = null;
    this.sortBy = 'name_asc';
    this.currentPage = 1;
    this.loadData();
  }


  openTestDetails(test: LabTest) {
    this.selectedTest = test;
  }

  openLabDetails(lab: Laboratory) {
    this.selectedLab = lab;
  }

  findNearbyLab() {
    this.selectedTest = null;
    this.router.navigate(['/nearby-services'], { queryParams: { category: 'Laboratory' } });
  }

  get hasFilters(): boolean {
    return (this.viewMode === 'tests' ? (this.selectedCategory !== 'All') : (this.selectedService !== 'All')) ||
      !!this.searchQuery ||
      this.minPrice !== null ||
      this.maxPrice !== null;
  }

  ngOnDestroy() {
    document.body.classList.remove('overflow-hidden');
  }
}
