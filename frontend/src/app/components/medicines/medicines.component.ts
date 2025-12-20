import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchService, SearchResult } from '../../shared/services/search.service';
import { CartService } from '../../shared/services/cart.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { ProductDetailModalComponent } from '../product-detail-modal/product-detail-modal.component';

@Component({
  selector: 'app-medicines',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductDetailModalComponent],
  templateUrl: './medicines.component.html',
  styleUrls: ['./medicines.component.css']
})
export class MedicinesComponent implements OnInit {
  medicines: SearchResult[] = [];
  loading = false;
  addingToCart: { [key: string]: boolean } = {};
  selectedProduct: SearchResult | null = null;

  // Expose Math for template
  Math = Math;

  // Pagination
  currentPage = 1;
  itemsPerPage = 20;
  totalMedicines = 0;

  // Filters
  searchQuery = '';
  selectedCategory = '';
  categories: string[] = [];
  sortBy = 'name_asc';

  sortOptions = [
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
    { value: 'price_asc', label: 'Price (Low to High)' },
    { value: 'price_desc', label: 'Price (High to Low)' }
  ];

  constructor(
    private searchService: SearchService,
    private cartService: CartService,
    private snackbarService: SnackbarService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadCategories();

    // Check for query params
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['q'] || '';
      this.selectedCategory = params['category'] || '';
      this.sortBy = params['sortBy'] || 'name_asc';
      this.loadMedicines();
    });
  }

  loadCategories() {
    this.categories = this.searchService.getCategories();
  }

  loadMedicines() {
    this.loading = true;

    this.searchService.searchProducts({
      q: this.searchQuery,
      type: 'medicine',
      category: this.selectedCategory,
      sortBy: this.sortBy,
      page: this.currentPage,
      limit: this.itemsPerPage
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.medicines = response.data.results;
          this.totalMedicines = response.data.pagination.total;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackbarService.show('Failed to load medicines', 'error');
      }
    });
  }

  get paginatedMedicines() {
    return this.medicines;
  }

  get totalPages() {
    return Math.ceil(this.totalMedicines / this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  addToCart(medicine: SearchResult) {
    const key = `medicine-${medicine.id}`;
    this.addingToCart[key] = true;

    this.cartService.addToCart({
      product_id: medicine.id,
      product_type: 'medicine',
      quantity: 1,
      price: medicine.price
    }).subscribe({
      next: () => {
        this.addingToCart[key] = false;
        this.snackbarService.show(`${medicine.name} added to cart!`, 'success');
      },
      error: () => {
        this.addingToCart[key] = false;
        this.snackbarService.show('Failed to add to cart', 'error');
      }
    });
  }

  openDetails(medicine: SearchResult) {
    this.selectedProduct = medicine;
  }

  closeDetails() {
    this.selectedProduct = null;
  }

  addToCartFromModal(medicine: SearchResult) {
    this.addToCart(medicine);
    this.closeDetails();
  }

  applyFilters() {
    this.currentPage = 1; // Reset to first page when filters change
    this.router.navigate([], {
      queryParams: {
        q: this.searchQuery || null,
        category: this.selectedCategory || null,
        sortBy: this.sortBy,
        page: 1
      },
      queryParamsHandling: 'merge'
    });
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.sortBy = 'name_asc';
    this.currentPage = 1;
    this.loadMedicines();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadMedicines();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  previousPage() {
    this.goToPage(this.currentPage - 1);
  }
}