import { environment } from '@env/environment';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CartService } from '../../shared/services/cart.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { AuthService } from '../../shared/services/auth.service';


export interface LabTest {
  id: number;
  name: string;
  category: string;
  price: number;
  discounted_price: number;
  description: string;
  includes: string;
  parameters_count: number;
  is_popular: boolean;
  sample_type: string;
  fasting_required: boolean;
  report_time: string;
}

@Component({
  selector: 'app-lab-tests',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './lab-tests.component.html',
  styleUrl: './lab-tests.component.css'
})
export class LabTestsComponent implements OnInit {
  // Expose Math for template
  Math = Math;
  // Data
  tests: LabTest[] = [];
  loading = false;
  // Filters
  searchQuery: string = '';
  selectedCategory: string = 'All';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  sortBy: string = 'name_asc';
  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  totalTests = 0;
  // Categories
  categories = ['All', 'Popular', 'Preventive', 'Diagnostic', 'Specialized', 'Wellness'];

  // Sort options
  sortOptions = [
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
    { value: 'price_asc', label: 'Price (Low to High)' },
    { value: 'price_desc', label: 'Price (High to Low)' },
    { value: 'popular', label: 'Most Popular' }
  ];

  // Cart state
  addingToCart: { [key: number]: boolean } = {};

  // Selected test for details modal
  selectedTest: LabTest | null = null;

  constructor(
    private cartService: CartService,
    private snackbar: SnackbarService,
    private authService: AuthService,
  ) { }

  ngOnInit() {
    this.loadTests();
  }

  loadTests() {
    this.loading = true;
    // Build query params
    const params: any = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };
    if (this.selectedCategory !== 'All') {
      params.category = this.selectedCategory;
    }
    if (this.searchQuery) {
      params.search = this.searchQuery;
    }
    if (this.minPrice) {
      params.minPrice = this.minPrice;
    }
    if (this.maxPrice) {
      params.maxPrice = this.maxPrice;
    }
    if (this.sortBy) {
      params.sortBy = this.sortBy;
    }
    // Build query string
    const queryString = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    // Fetch from API
    fetch(`${environment.apiUrl}/lab-tests?${queryString}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          this.tests = data.data.results;
          this.totalTests = data.data.pagination.total;
        }
        setTimeout(() => {
          this.loading = false;
        }, 500);
      })
      .catch(error => {
        console.error('Error loading tests:', error);
        this.snackbar.show('Failed to load lab tests', 'error');
        setTimeout(() => {
          this.loading = false;
        }, 500);
      });
  }

  // Computed properties
  get totalPages() {
    return Math.ceil(this.totalTests / this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadTests();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  previousPage() {
    this.goToPage(this.currentPage - 1);
  }

  // Filter methods
  onFilterChange() {
    this.currentPage = 1; // Reset to page 1
    this.loadTests();
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedCategory = 'All';
    this.minPrice = null;
    this.maxPrice = null;
    this.sortBy = 'name_asc';
    this.currentPage = 1;
    this.loadTests();
  }

  //Cart integration
  addToCart(test: LabTest) {
    if (!this.authService.isLoggedIn()) {
      this.snackbar.warning('Please login to book an appointment');
      return;
    }

    this.addingToCart[test.id] = true;

    this.cartService.addItem({
      id: String(test.id),
      name: test.name,
      product_type: 'lab_test',
      price: test.discounted_price || 0,
      quantity: 1,
      image: ''
    });

    setTimeout(() => {
      this.addingToCart[test.id] = false;
      this.snackbar.show(`${test.name} added to cart!`, 'success');
    }, 300);
  }

  // Test details modal
  openDetails(test: LabTest) {
    this.selectedTest = test;
  }

  closeDetails() {
    this.selectedTest = null;
  }

  // Helper methods
  get hasFilters(): boolean {
    return this.selectedCategory !== 'All' ||
      !!this.searchQuery ||
      this.minPrice !== null ||
      this.maxPrice !== null;
  }

  getDiscountPercentage(test: LabTest): number {
    return Math.round(((test.price - test.discounted_price) / test.price) * 100);
  }
}
